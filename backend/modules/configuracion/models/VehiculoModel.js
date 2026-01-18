const pool = require('../../../config/database');
const AppError = require('../../../utils/AppError');

class VehiculoModel {
    /**
     * Obtener todos los vehículos con paginación y filtros
     * @param {Object} options - Opciones de filtrado
     * @returns {Promise<Object>} Lista de vehículos y total
     */
    static async obtenerTodos(options = {}) {
        const {
            page = 1,
            limit = 20,
            buscar = '',
            tipo = null,
            estado = null,
            activo = null,
            ordenar = 'placa',
            direccion = 'ASC'
        } = options;

        const offset = (page - 1) * limit;
        const params = [];
        let whereClause = 'WHERE 1=1';

        // Filtro por búsqueda (placa, marca, modelo)
        if (buscar) {
            whereClause += ` AND (v.placa LIKE ? OR v.marca LIKE ? OR v.modelo LIKE ?)`;
            const buscarPattern = `%${buscar}%`;
            params.push(buscarPattern, buscarPattern, buscarPattern);
        }

        // Filtro por tipo
        if (tipo) {
            whereClause += ` AND v.tipo = ?`;
            params.push(tipo);
        }

        // Filtro por estado
        if (estado) {
            whereClause += ` AND v.estado = ?`;
            params.push(estado);
        }

        // Filtro por activo
        if (activo !== null) {
            whereClause += ` AND v.activo = ?`;
            params.push(activo);
        }

        // Validar campo de ordenación
        const camposValidos = ['placa', 'marca', 'modelo', 'tipo', 'estado', 'capacidad_carga', 'created_at'];
        const ordenarCampo = camposValidos.includes(ordenar) ? ordenar : 'placa';
        const ordenarDireccion = direccion.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        // Query principal
        const [rows] = await pool.query(`
            SELECT
                v.id,
                v.placa,
                v.marca,
                v.modelo,
                v.anio,
                v.tipo,
                v.capacidad_carga,
                v.estado,
                v.kilometraje_actual,
                v.proximo_mantenimiento,
                v.notas,
                v.activo,
                v.created_at
            FROM vehiculos v
            ${whereClause}
            ORDER BY v.${ordenarCampo} ${ordenarDireccion}
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

        // Contar total
        const [countResult] = await pool.query(`
            SELECT COUNT(*) as total
            FROM vehiculos v
            ${whereClause}
        `, params);

        return {
            vehiculos: rows,
            total: countResult[0].total,
            page,
            limit,
            totalPages: Math.ceil(countResult[0].total / limit)
        };
    }

    /**
     * Obtener vehículo por ID con historial
     * @param {number} id
     * @returns {Promise<Object|null>}
     */
    static async obtenerPorId(id) {
        const [rows] = await pool.query(`
            SELECT
                v.id,
                v.placa,
                v.marca,
                v.modelo,
                v.anio,
                v.tipo,
                v.capacidad_carga,
                v.estado,
                v.kilometraje_actual,
                v.proximo_mantenimiento,
                v.notas,
                v.activo,
                v.created_at,
                v.updated_at
            FROM vehiculos v
            WHERE v.id = ?
        `, [id]);

        if (rows.length === 0) {
            return null;
        }

        const vehiculo = rows[0];

        // Obtener últimos usos
        const [usos] = await pool.query(`
            SELECT
                u.id,
                u.fecha_uso,
                u.kilometraje_inicio,
                u.kilometraje_fin,
                u.destino,
                u.proposito,
                u.notas,
                e.nombre as conductor_nombre,
                e.apellido as conductor_apellido
            FROM vehiculo_uso_log u
            LEFT JOIN empleados e ON u.conductor_id = e.id
            WHERE u.vehiculo_id = ?
            ORDER BY u.fecha_uso DESC
            LIMIT 10
        `, [id]);

        // Obtener próximos mantenimientos
        const [mantenimientos] = await pool.query(`
            SELECT
                m.id,
                m.tipo,
                m.fecha_programada,
                m.fecha_realizada,
                m.kilometraje,
                m.costo,
                m.descripcion,
                m.estado
            FROM vehiculo_mantenimientos m
            WHERE m.vehiculo_id = ?
            ORDER BY m.fecha_programada DESC
            LIMIT 5
        `, [id]);

        vehiculo.ultimosUsos = usos;
        vehiculo.mantenimientos = mantenimientos;

        return vehiculo;
    }

    /**
     * Crear nuevo vehículo
     * @param {Object} datos
     * @returns {Promise<Object>}
     */
    static async crear(datos) {
        const {
            placa,
            marca,
            modelo,
            anio,
            tipo,
            capacidad_carga,
            estado = 'disponible',
            kilometraje_actual = 0,
            proximo_mantenimiento,
            notas
        } = datos;

        // Verificar si la placa ya existe
        const [existente] = await pool.query(
            'SELECT id FROM vehiculos WHERE placa = ?',
            [placa]
        );

        if (existente.length > 0) {
            throw new AppError('Ya existe un vehículo con esa placa', 400);
        }

        const [result] = await pool.query(`
            INSERT INTO vehiculos
            (placa, marca, modelo, anio, tipo, capacidad_carga, estado, kilometraje_actual, proximo_mantenimiento, notas)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            placa,
            marca,
            modelo,
            anio || null,
            tipo,
            capacidad_carga || null,
            estado,
            kilometraje_actual,
            proximo_mantenimiento || null,
            notas || null
        ]);

        return this.obtenerPorId(result.insertId);
    }

    /**
     * Actualizar vehículo
     * @param {number} id
     * @param {Object} datos
     * @returns {Promise<Object>}
     */
    static async actualizar(id, datos) {
        const vehiculo = await this.obtenerPorId(id);
        if (!vehiculo) {
            throw new AppError('Vehículo no encontrado', 404);
        }

        const {
            placa,
            marca,
            modelo,
            anio,
            tipo,
            capacidad_carga,
            estado,
            kilometraje_actual,
            proximo_mantenimiento,
            notas,
            activo
        } = datos;

        // Verificar si la nueva placa ya existe
        if (placa && placa !== vehiculo.placa) {
            const [existente] = await pool.query(
                'SELECT id FROM vehiculos WHERE placa = ? AND id != ?',
                [placa, id]
            );

            if (existente.length > 0) {
                throw new AppError('Ya existe otro vehículo con esa placa', 400);
            }
        }

        // Construir actualización dinámica
        const campos = [];
        const valores = [];

        if (placa !== undefined) { campos.push('placa = ?'); valores.push(placa); }
        if (marca !== undefined) { campos.push('marca = ?'); valores.push(marca); }
        if (modelo !== undefined) { campos.push('modelo = ?'); valores.push(modelo); }
        if (anio !== undefined) { campos.push('anio = ?'); valores.push(anio); }
        if (tipo !== undefined) { campos.push('tipo = ?'); valores.push(tipo); }
        if (capacidad_carga !== undefined) { campos.push('capacidad_carga = ?'); valores.push(capacidad_carga); }
        if (estado !== undefined) { campos.push('estado = ?'); valores.push(estado); }
        if (kilometraje_actual !== undefined) { campos.push('kilometraje_actual = ?'); valores.push(kilometraje_actual); }
        if (proximo_mantenimiento !== undefined) { campos.push('proximo_mantenimiento = ?'); valores.push(proximo_mantenimiento); }
        if (notas !== undefined) { campos.push('notas = ?'); valores.push(notas); }
        if (activo !== undefined) { campos.push('activo = ?'); valores.push(activo); }

        if (campos.length === 0) {
            throw new AppError('No hay datos para actualizar', 400);
        }

        valores.push(id);

        await pool.query(`
            UPDATE vehiculos
            SET ${campos.join(', ')}
            WHERE id = ?
        `, valores);

        return this.obtenerPorId(id);
    }

    /**
     * Eliminar (desactivar) vehículo
     * @param {number} id
     * @returns {Promise<boolean>}
     */
    static async eliminar(id) {
        const vehiculo = await this.obtenerPorId(id);
        if (!vehiculo) {
            throw new AppError('Vehículo no encontrado', 404);
        }

        await pool.query('UPDATE vehiculos SET activo = FALSE WHERE id = ?', [id]);

        return true;
    }

    /**
     * Obtener vehículos disponibles en una fecha específica
     * @param {Date} fecha
     * @returns {Promise<Array>}
     */
    static async obtenerDisponibles(fecha = null) {
        // Si no se especifica fecha, obtener todos los disponibles y activos
        let query = `
            SELECT
                v.id,
                v.placa,
                v.marca,
                v.modelo,
                v.tipo,
                v.capacidad_carga,
                v.estado
            FROM vehiculos v
            WHERE v.activo = TRUE
              AND v.estado = 'disponible'
        `;

        const params = [];

        // Si se especifica fecha, excluir vehículos asignados a órdenes ese día
        if (fecha) {
            query += `
              AND v.id NOT IN (
                  SELECT DISTINCT ot.vehiculo_id
                  FROM ordenes_trabajo ot
                  WHERE ot.vehiculo_id IS NOT NULL
                    AND DATE(ot.fecha_programada) = DATE(?)
                    AND ot.estado NOT IN ('completado', 'cancelado')
              )
            `;
            params.push(fecha);
        }

        query += ' ORDER BY v.placa ASC';

        const [rows] = await pool.query(query, params);

        return rows;
    }

    /**
     * Registrar uso de vehículo
     * @param {number} vehiculoId
     * @param {Object} datos
     * @returns {Promise<Object>}
     */
    static async registrarUso(vehiculoId, datos) {
        const vehiculo = await this.obtenerPorId(vehiculoId);
        if (!vehiculo) {
            throw new AppError('Vehículo no encontrado', 404);
        }

        const {
            conductor_id,
            fecha_uso,
            kilometraje_inicio,
            kilometraje_fin,
            destino,
            proposito,
            notas
        } = datos;

        const [result] = await pool.query(`
            INSERT INTO vehiculo_uso_log
            (vehiculo_id, conductor_id, fecha_uso, kilometraje_inicio, kilometraje_fin, destino, proposito, notas)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            vehiculoId,
            conductor_id || null,
            fecha_uso || new Date(),
            kilometraje_inicio || vehiculo.kilometraje_actual,
            kilometraje_fin || null,
            destino || null,
            proposito || null,
            notas || null
        ]);

        // Actualizar kilometraje del vehículo si se proporcionó
        if (kilometraje_fin && kilometraje_fin > vehiculo.kilometraje_actual) {
            await pool.query(
                'UPDATE vehiculos SET kilometraje_actual = ? WHERE id = ?',
                [kilometraje_fin, vehiculoId]
            );
        }

        const [uso] = await pool.query('SELECT * FROM vehiculo_uso_log WHERE id = ?', [result.insertId]);
        return uso[0];
    }

    /**
     * Registrar mantenimiento de vehículo
     * @param {number} vehiculoId
     * @param {Object} datos
     * @returns {Promise<Object>}
     */
    static async registrarMantenimiento(vehiculoId, datos) {
        const vehiculo = await this.obtenerPorId(vehiculoId);
        if (!vehiculo) {
            throw new AppError('Vehículo no encontrado', 404);
        }

        const {
            tipo,
            fecha_programada,
            fecha_realizada,
            kilometraje,
            costo,
            descripcion,
            estado = 'programado'
        } = datos;

        const [result] = await pool.query(`
            INSERT INTO vehiculo_mantenimientos
            (vehiculo_id, tipo, fecha_programada, fecha_realizada, kilometraje, costo, descripcion, estado)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            vehiculoId,
            tipo,
            fecha_programada,
            fecha_realizada || null,
            kilometraje || vehiculo.kilometraje_actual,
            costo || null,
            descripcion || null,
            estado
        ]);

        // Si el mantenimiento fue realizado, actualizar estado del vehículo
        if (fecha_realizada) {
            await pool.query(
                "UPDATE vehiculos SET estado = 'disponible' WHERE id = ?",
                [vehiculoId]
            );
        }

        const [mantenimiento] = await pool.query(
            'SELECT * FROM vehiculo_mantenimientos WHERE id = ?',
            [result.insertId]
        );

        return mantenimiento[0];
    }

    /**
     * Actualizar mantenimiento
     * @param {number} mantenimientoId
     * @param {Object} datos
     * @returns {Promise<Object>}
     */
    static async actualizarMantenimiento(mantenimientoId, datos) {
        const [existente] = await pool.query(
            'SELECT * FROM vehiculo_mantenimientos WHERE id = ?',
            [mantenimientoId]
        );

        if (existente.length === 0) {
            throw new AppError('Mantenimiento no encontrado', 404);
        }

        const { fecha_realizada, costo, descripcion, estado } = datos;

        const campos = [];
        const valores = [];

        if (fecha_realizada !== undefined) { campos.push('fecha_realizada = ?'); valores.push(fecha_realizada); }
        if (costo !== undefined) { campos.push('costo = ?'); valores.push(costo); }
        if (descripcion !== undefined) { campos.push('descripcion = ?'); valores.push(descripcion); }
        if (estado !== undefined) { campos.push('estado = ?'); valores.push(estado); }

        if (campos.length === 0) {
            throw new AppError('No hay datos para actualizar', 400);
        }

        valores.push(mantenimientoId);

        await pool.query(`
            UPDATE vehiculo_mantenimientos
            SET ${campos.join(', ')}
            WHERE id = ?
        `, valores);

        // Si se completó el mantenimiento, poner vehículo disponible
        if (estado === 'completado' || fecha_realizada) {
            await pool.query(
                "UPDATE vehiculos SET estado = 'disponible' WHERE id = ?",
                [existente[0].vehiculo_id]
            );
        }

        const [mantenimiento] = await pool.query(
            'SELECT * FROM vehiculo_mantenimientos WHERE id = ?',
            [mantenimientoId]
        );

        return mantenimiento[0];
    }

    /**
     * Obtener estadísticas de vehículos
     * @returns {Promise<Object>}
     */
    static async obtenerEstadisticas() {
        const [stats] = await pool.query(`
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN activo = TRUE THEN 1 ELSE 0 END) as activos,
                SUM(CASE WHEN estado = 'disponible' AND activo = TRUE THEN 1 ELSE 0 END) as disponibles,
                SUM(CASE WHEN estado = 'en_uso' AND activo = TRUE THEN 1 ELSE 0 END) as en_uso,
                SUM(CASE WHEN estado = 'mantenimiento' AND activo = TRUE THEN 1 ELSE 0 END) as en_mantenimiento
            FROM vehiculos
        `);

        const [porTipo] = await pool.query(`
            SELECT
                tipo,
                COUNT(*) as cantidad
            FROM vehiculos
            WHERE activo = TRUE
            GROUP BY tipo
        `);

        const [proximosMantenimientos] = await pool.query(`
            SELECT
                v.id,
                v.placa,
                v.marca,
                v.modelo,
                v.proximo_mantenimiento
            FROM vehiculos v
            WHERE v.activo = TRUE
              AND v.proximo_mantenimiento IS NOT NULL
              AND v.proximo_mantenimiento <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
            ORDER BY v.proximo_mantenimiento ASC
            LIMIT 5
        `);

        return {
            ...stats[0],
            porTipo,
            proximosMantenimientos
        };
    }
}

module.exports = VehiculoModel;
