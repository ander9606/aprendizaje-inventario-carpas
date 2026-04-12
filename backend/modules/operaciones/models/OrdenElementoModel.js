const { pool } = require('../../../config/database');
const AppError = require('../../../utils/AppError');

class OrdenElementoModel {
    /**
     * Obtener elementos de una orden
     * @param {number} tenantId
     * @param {number} ordenId
     * @returns {Promise<Array>}
     */
    static async obtenerPorOrden(tenantId, ordenId) {
        const [rows] = await pool.query(`
            SELECT
                ote.id,
                ote.orden_id,
                ote.elemento_id,
                ote.serie_id,
                ote.lote_id,
                ote.cantidad,
                ote.estado,
                ote.verificado_salida,
                ote.verificado_retorno,
                ote.notas,
                el.nombre as elemento_nombre,
                s.numero_serie,
                l.lote_numero
            FROM orden_trabajo_elementos ote
            INNER JOIN elementos el ON ote.elemento_id = el.id AND el.tenant_id = ?
            LEFT JOIN series s ON ote.serie_id = s.id AND s.tenant_id = ?
            LEFT JOIN lotes l ON ote.lote_id = l.id AND l.tenant_id = ?
            WHERE ote.tenant_id = ? AND ote.orden_id = ?
            ORDER BY el.nombre ASC
        `, [tenantId, tenantId, tenantId, tenantId, ordenId]);

        return rows;
    }

    /**
     * Cambiar estado de un elemento en la orden
     * @param {number} tenantId
     * @param {number} elementoId - ID del registro en orden_trabajo_elementos
     * @param {string} estado
     * @returns {Promise<Object>}
     */
    static async cambiarEstado(tenantId, elementoId, estado) {
        const estadosValidos = ['pendiente', 'preparado', 'cargado', 'descargado', 'instalado', 'desmontado', 'retornado', 'incidencia'];

        if (!estadosValidos.includes(estado)) {
            throw new AppError(`Estado inválido. Valores permitidos: ${estadosValidos.join(', ')}`, 400);
        }

        const [existente] = await pool.query(
            'SELECT * FROM orden_trabajo_elementos WHERE tenant_id = ? AND id = ?',
            [tenantId, elementoId]
        );

        if (existente.length === 0) {
            throw new AppError('Elemento no encontrado en la orden', 404);
        }

        await pool.query(`
            UPDATE orden_trabajo_elementos
            SET estado = ?
            WHERE tenant_id = ? AND id = ?
        `, [estado, tenantId, elementoId]);

        const [resultado] = await pool.query(`
            SELECT
                ote.*,
                el.nombre as elemento_nombre,
                s.numero_serie,
                l.lote_numero
            FROM orden_trabajo_elementos ote
            INNER JOIN elementos el ON ote.elemento_id = el.id AND el.tenant_id = ?
            LEFT JOIN series s ON ote.serie_id = s.id AND s.tenant_id = ?
            LEFT JOIN lotes l ON ote.lote_id = l.id AND l.tenant_id = ?
            WHERE ote.tenant_id = ? AND ote.id = ?
        `, [tenantId, tenantId, tenantId, tenantId, elementoId]);

        return resultado[0];
    }

    /**
     * ============================================
     * Cambiar estado de múltiples elementos a la vez
     * Permite operaciones masivas para agilizar el proceso
     * ============================================
     * @param {number} tenantId
     * @param {number} ordenId - ID de la orden de trabajo
     * @param {Array<number>} elementoIds - IDs de los registros en orden_trabajo_elementos
     * @param {string} estado - Nuevo estado a aplicar
     * @returns {Promise<Object>} - Cantidad de registros actualizados
     */
    static async cambiarEstadoMasivo(tenantId, ordenId, elementoIds, estado) {
        const estadosValidos = ['pendiente', 'preparado', 'cargado', 'descargado', 'instalado', 'desmontado', 'retornado', 'incidencia'];

        if (!estadosValidos.includes(estado)) {
            throw new AppError(`Estado inválido. Valores permitidos: ${estadosValidos.join(', ')}`, 400);
        }

        if (!Array.isArray(elementoIds) || elementoIds.length === 0) {
            throw new AppError('Debe proporcionar al menos un elemento', 400);
        }

        // Verificar que todos los elementos pertenecen a la orden
        const placeholders = elementoIds.map(() => '?').join(',');
        const [existentes] = await pool.query(
            `SELECT id FROM orden_trabajo_elementos WHERE tenant_id = ? AND orden_id = ? AND id IN (${placeholders})`,
            [tenantId, ordenId, ...elementoIds]
        );

        if (existentes.length !== elementoIds.length) {
            throw new AppError('Algunos elementos no pertenecen a esta orden', 400);
        }

        // Actualizar todos los elementos
        const [result] = await pool.query(`
            UPDATE orden_trabajo_elementos
            SET estado = ?, updated_at = NOW()
            WHERE tenant_id = ? AND orden_id = ? AND id IN (${placeholders})
        `, [estado, tenantId, ordenId, ...elementoIds]);

        return {
            actualizados: result.affectedRows,
            estado: estado
        };
    }

    /**
     * Verificar salida de elemento
     * @param {number} tenantId
     * @param {number} elementoId
     * @param {number} verificadoPor
     * @returns {Promise<Object>}
     */
    static async verificarSalida(tenantId, elementoId, verificadoPor) {
        const [existente] = await pool.query(
            'SELECT * FROM orden_trabajo_elementos WHERE tenant_id = ? AND id = ?',
            [tenantId, elementoId]
        );

        if (existente.length === 0) {
            throw new AppError('Elemento no encontrado en la orden', 404);
        }

        await pool.query(`
            UPDATE orden_trabajo_elementos
            SET verificado_salida = TRUE,
                estado = 'cargado'
            WHERE tenant_id = ? AND id = ?
        `, [tenantId, elementoId]);

        return this.obtenerPorId(tenantId, elementoId);
    }

    /**
     * Verificar retorno de elemento
     * @param {number} tenantId
     * @param {number} elementoId
     * @param {number} verificadoPor
     * @returns {Promise<Object>}
     */
    static async verificarRetorno(tenantId, elementoId, verificadoPor) {
        const [existente] = await pool.query(
            'SELECT * FROM orden_trabajo_elementos WHERE tenant_id = ? AND id = ?',
            [tenantId, elementoId]
        );

        if (existente.length === 0) {
            throw new AppError('Elemento no encontrado en la orden', 404);
        }

        await pool.query(`
            UPDATE orden_trabajo_elementos
            SET verificado_retorno = TRUE,
                estado = 'retornado'
            WHERE tenant_id = ? AND id = ?
        `, [tenantId, elementoId]);

        return this.obtenerPorId(tenantId, elementoId);
    }

    /**
     * Toggle verificación de cargue (salida) de un elemento
     * @param {number} tenantId
     * @param {number} elementoId
     * @param {boolean} verificado
     * @param {string|null} notas
     * @returns {Promise<Object>}
     */
    static async toggleVerificacionCargue(tenantId, elementoId, verificado, notas = null) {
        const [existente] = await pool.query(
            'SELECT * FROM orden_trabajo_elementos WHERE tenant_id = ? AND id = ?',
            [tenantId, elementoId]
        );

        if (existente.length === 0) {
            throw new AppError('Elemento no encontrado en la orden', 404);
        }

        const nuevoEstado = verificado ? 'cargado' : 'pendiente';
        const updateNotas = notas !== null ? ', notas = ?' : '';
        const params = notas !== null
            ? [verificado, nuevoEstado, notas, tenantId, elementoId]
            : [verificado, nuevoEstado, tenantId, elementoId];

        await pool.query(`
            UPDATE orden_trabajo_elementos
            SET verificado_salida = ?,
                estado = ?
                ${updateNotas}
            WHERE tenant_id = ? AND id = ?
        `, params);

        return this.obtenerPorId(tenantId, elementoId);
    }

    /**
     * Toggle verificación de recogida (recoger en sitio del evento) de un elemento
     * @param {number} tenantId
     * @param {number} elementoId
     * @param {boolean} verificado
     * @param {string|null} notas
     * @returns {Promise<Object>}
     */
    static async toggleVerificacionDescargue(tenantId, elementoId, verificado, notas = null) {
        const [existente] = await pool.query(
            'SELECT * FROM orden_trabajo_elementos WHERE tenant_id = ? AND id = ?',
            [tenantId, elementoId]
        );

        if (existente.length === 0) {
            throw new AppError('Elemento no encontrado en la orden', 404);
        }

        const nuevoEstado = verificado ? 'descargado' : 'pendiente';
        const updateNotas = notas !== null ? ', notas = ?' : '';
        const params = notas !== null
            ? [verificado, nuevoEstado, notas, tenantId, elementoId]
            : [verificado, nuevoEstado, tenantId, elementoId];

        await pool.query(`
            UPDATE orden_trabajo_elementos
            SET verificado_retorno = ?,
                estado = ?
                ${updateNotas}
            WHERE tenant_id = ? AND id = ?
        `, params);

        return this.obtenerPorId(tenantId, elementoId);
    }

    /**
     * Toggle verificación en bodega (descarga del camión en bodega) de un elemento
     * @param {number} tenantId
     * @param {number} elementoId
     * @param {boolean} verificado
     * @param {string|null} notas
     * @returns {Promise<Object>}
     */
    static async toggleVerificacionBodega(tenantId, elementoId, verificado, notas = null) {
        const [existente] = await pool.query(
            'SELECT * FROM orden_trabajo_elementos WHERE tenant_id = ? AND id = ?',
            [tenantId, elementoId]
        );

        if (existente.length === 0) {
            throw new AppError('Elemento no encontrado en la orden', 404);
        }

        // Asegurar que la columna existe
        await this._ensureColumnVerificadoBodega();

        const updateNotas = notas !== null ? ', notas = ?' : '';
        const params = notas !== null
            ? [verificado, notas, tenantId, elementoId]
            : [verificado, tenantId, elementoId];

        await pool.query(`
            UPDATE orden_trabajo_elementos
            SET verificado_bodega = ?
                ${updateNotas}
            WHERE tenant_id = ? AND id = ?
        `, params);

        return this.obtenerPorId(tenantId, elementoId);
    }

    /**
     * Auto-agregar columna verificado_bodega si no existe
     */
    static async _ensureColumnVerificadoBodega() {
        if (OrdenElementoModel._bodegaColumnChecked) return;
        try {
            await pool.query(`
                ALTER TABLE orden_trabajo_elementos
                ADD COLUMN verificado_bodega BOOLEAN DEFAULT FALSE AFTER verificado_retorno
            `);
        } catch (error) {
            // ER_DUP_FIELDNAME = la columna ya existe, está bien
            if (error.code !== 'ER_DUP_FIELDNAME') throw error;
        }
        OrdenElementoModel._bodegaColumnChecked = true;
    }

    /**
     * Auto-agregar columnas marcado_dano y descripcion_dano si no existen
     */
    static async _ensureColumnsMarcadoDano() {
        if (OrdenElementoModel._danoColumnsChecked) return;
        // Intentar agregar cada columna individualmente para evitar que
        // ER_DUP_FIELDNAME en una columna impida crear las demás
        for (const col of [
            'ADD COLUMN marcado_dano BOOLEAN DEFAULT FALSE',
            'ADD COLUMN descripcion_dano TEXT DEFAULT NULL',
            'ADD COLUMN cantidad_danada INT DEFAULT NULL'
        ]) {
            try {
                await pool.query(`ALTER TABLE orden_trabajo_elementos ${col}`);
            } catch (e) {
                // ER_DUP_FIELDNAME = columna ya existe, ignorar
                if (e.code !== 'ER_DUP_FIELDNAME') { /* ignorar */ }
            }
        }
        OrdenElementoModel._danoColumnsChecked = true;
    }

    /**
     * Marcar o desmarcar daño en un elemento del checklist
     * @param {number} tenantId
     * @param {number} elementoId
     * @param {boolean} marcadoDano
     * @param {string|null} descripcionDano
     * @param {number|null} cantidadDanada - Para lotes, cuántos están dañados
     * @returns {Promise<Object>}
     */
    static async marcarDano(tenantId, elementoId, marcadoDano, descripcionDano = null, cantidadDanada = null) {
        await this._ensureColumnsMarcadoDano();

        const [existente] = await pool.query(
            'SELECT * FROM orden_trabajo_elementos WHERE tenant_id = ? AND id = ?',
            [tenantId, elementoId]
        );

        if (existente.length === 0) {
            throw new AppError('Elemento no encontrado en la orden', 404);
        }

        // Validar cantidad dañada para lotes
        if (marcadoDano && cantidadDanada !== null && cantidadDanada > existente[0].cantidad) {
            throw new AppError(`La cantidad dañada (${cantidadDanada}) no puede ser mayor a la cantidad total (${existente[0].cantidad})`, 400);
        }

        await pool.query(`
            UPDATE orden_trabajo_elementos
            SET marcado_dano = ?,
                descripcion_dano = ?,
                cantidad_danada = ?
            WHERE tenant_id = ? AND id = ?
        `, [
            marcadoDano,
            marcadoDano ? descripcionDano : null,
            marcadoDano ? cantidadDanada : null,
            tenantId,
            elementoId
        ]);

        return this.obtenerPorId(tenantId, elementoId);
    }

    /**
     * Obtener elementos marcados con daño de una orden
     * @param {number} tenantId
     * @param {number} ordenId
     * @returns {Promise<Array>}
     */
    static async obtenerElementosConDano(tenantId, ordenId) {
        await this._ensureColumnsMarcadoDano();

        const [rows] = await pool.query(`
            SELECT
                ote.id,
                ote.orden_id,
                ote.elemento_id,
                ote.serie_id,
                ote.lote_id,
                ote.cantidad,
                ote.estado,
                ote.marcado_dano,
                ote.descripcion_dano,
                ote.cantidad_danada,
                ote.notas,
                el.nombre as elemento_nombre,
                s.numero_serie as serie_codigo,
                l.lote_numero as lote_codigo
            FROM orden_trabajo_elementos ote
            INNER JOIN elementos el ON ote.elemento_id = el.id AND el.tenant_id = ?
            LEFT JOIN series s ON ote.serie_id = s.id AND s.tenant_id = ?
            LEFT JOIN lotes l ON ote.lote_id = l.id AND l.tenant_id = ?
            WHERE ote.tenant_id = ? AND ote.orden_id = ? AND ote.marcado_dano = TRUE
            ORDER BY el.nombre ASC
        `, [tenantId, tenantId, tenantId, tenantId, ordenId]);

        return rows;
    }

    /**
     * Obtener resumen de checklist para una orden
     * @param {number} tenantId
     * @param {number} ordenId
     * @returns {Promise<Object>} - { elementos, totalElementos, verificadosCargue, verificadosRecogida, verificadosBodega }
     */
    static async obtenerChecklistOrden(tenantId, ordenId) {
        // Asegurar que las columnas dinámicas existen
        await this._ensureColumnVerificadoBodega();
        await this._ensureColumnsMarcadoDano();

        const [rows] = await pool.query(`
            SELECT
                ote.id,
                ote.orden_id,
                ote.elemento_id,
                ote.serie_id,
                ote.lote_id,
                ote.cantidad,
                ote.estado,
                ote.verificado_salida,
                ote.verificado_retorno,
                ote.verificado_bodega,
                ote.marcado_dano,
                ote.descripcion_dano,
                ote.cantidad_danada,
                ote.notas,
                el.nombre as elemento_nombre,
                s.numero_serie as serie_codigo,
                l.lote_numero as lote_codigo
            FROM orden_trabajo_elementos ote
            INNER JOIN elementos el ON ote.elemento_id = el.id AND el.tenant_id = ?
            LEFT JOIN series s ON ote.serie_id = s.id AND s.tenant_id = ?
            LEFT JOIN lotes l ON ote.lote_id = l.id AND l.tenant_id = ?
            WHERE ote.tenant_id = ? AND ote.orden_id = ?
            ORDER BY el.nombre ASC
        `, [tenantId, tenantId, tenantId, tenantId, ordenId]);

        const totalElementos = rows.length;
        const verificadosCargue = rows.filter(r => r.verificado_salida).length;
        const verificadosRecogida = rows.filter(r => r.verificado_retorno).length;
        const verificadosBodega = rows.filter(r => r.verificado_bodega).length;
        const elementosConDano = rows.filter(r => r.marcado_dano).length;

        return {
            elementos: rows,
            totalElementos,
            verificadosCargue,
            verificadosRecogida,
            verificadosBodega,
            elementosConDano,
            // Mantener alias por compatibilidad
            verificadosDescargue: verificadosRecogida
        };
    }

    /**
     * Obtener elemento por ID
     * @param {number} tenantId
     * @param {number} elementoId
     * @returns {Promise<Object|null>}
     */
    static async obtenerPorId(tenantId, elementoId) {
        const [rows] = await pool.query(`
            SELECT
                ote.*,
                el.nombre as elemento_nombre,
                s.numero_serie,
                l.lote_numero
            FROM orden_trabajo_elementos ote
            INNER JOIN elementos el ON ote.elemento_id = el.id AND el.tenant_id = ?
            LEFT JOIN series s ON ote.serie_id = s.id AND s.tenant_id = ?
            LEFT JOIN lotes l ON ote.lote_id = l.id AND l.tenant_id = ?
            WHERE ote.tenant_id = ? AND ote.id = ?
        `, [tenantId, tenantId, tenantId, tenantId, elementoId]);

        return rows.length > 0 ? rows[0] : null;
    }

    /**
     * Registrar incidencia en un elemento
     * @param {number} tenantId
     * @param {number} elementoOrdenId
     * @param {Object} datos
     * @returns {Promise<Object>}
     */
    static async registrarIncidencia(tenantId, elementoOrdenId, datos) {
        const { tipo, descripcion, severidad = 'media', reportado_por } = datos;

        const elemento = await this.obtenerPorId(tenantId, elementoOrdenId);
        if (!elemento) {
            throw new AppError('Elemento no encontrado en la orden', 404);
        }

        const [result] = await pool.query(`
            INSERT INTO elemento_incidencias
            (tenant_id, orden_elemento_id, tipo, descripcion, severidad, reportado_por)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [tenantId, elementoOrdenId, tipo, descripcion, severidad, reportado_por]);

        // Cambiar estado del elemento a incidencia
        await pool.query(`
            UPDATE orden_trabajo_elementos
            SET estado = 'incidencia'
            WHERE tenant_id = ? AND id = ?
        `, [tenantId, elementoOrdenId]);

        const [incidencia] = await pool.query(`
            SELECT
                ei.*,
                e.nombre as reportador_nombre,
                e.apellido as reportador_apellido
            FROM elemento_incidencias ei
            LEFT JOIN empleados e ON ei.reportado_por = e.id AND e.tenant_id = ?
            WHERE ei.tenant_id = ? AND ei.id = ?
        `, [tenantId, tenantId, result.insertId]);

        return incidencia[0];
    }

    /**
     * Obtener incidencias de un elemento
     * @param {number} tenantId
     * @param {number} elementoOrdenId
     * @returns {Promise<Array>}
     */
    static async obtenerIncidencias(tenantId, elementoOrdenId) {
        const [rows] = await pool.query(`
            SELECT
                ei.*,
                e.nombre as reportador_nombre,
                e.apellido as reportador_apellido,
                er.nombre as resolutor_nombre,
                er.apellido as resolutor_apellido
            FROM elemento_incidencias ei
            LEFT JOIN empleados e ON ei.reportado_por = e.id AND e.tenant_id = ?
            LEFT JOIN empleados er ON ei.resuelto_por = er.id AND er.tenant_id = ?
            WHERE ei.tenant_id = ? AND ei.orden_elemento_id = ?
            ORDER BY ei.created_at DESC
        `, [tenantId, tenantId, tenantId, elementoOrdenId]);

        return rows;
    }

    /**
     * Resolver incidencia
     * @param {number} tenantId
     * @param {number} incidenciaId
     * @param {Object} datos
     * @returns {Promise<Object>}
     */
    static async resolverIncidencia(tenantId, incidenciaId, datos) {
        const { resolucion, resuelto_por } = datos;

        const [existente] = await pool.query(
            'SELECT * FROM elemento_incidencias WHERE tenant_id = ? AND id = ?',
            [tenantId, incidenciaId]
        );

        if (existente.length === 0) {
            throw new AppError('Incidencia no encontrada', 404);
        }

        await pool.query(`
            UPDATE elemento_incidencias
            SET estado = 'resuelta',
                resolucion = ?,
                resuelto_por = ?,
                fecha_resolucion = CURRENT_TIMESTAMP
            WHERE tenant_id = ? AND id = ?
        `, [resolucion, resuelto_por, tenantId, incidenciaId]);

        const [incidencia] = await pool.query(`
            SELECT
                ei.*,
                e.nombre as reportador_nombre,
                e.apellido as reportador_apellido,
                er.nombre as resolutor_nombre,
                er.apellido as resolutor_apellido
            FROM elemento_incidencias ei
            LEFT JOIN empleados e ON ei.reportado_por = e.id AND e.tenant_id = ?
            LEFT JOIN empleados er ON ei.resuelto_por = er.id AND er.tenant_id = ?
            WHERE ei.tenant_id = ? AND ei.id = ?
        `, [tenantId, tenantId, tenantId, incidenciaId]);

        return incidencia[0];
    }

    /**
     * Subir foto de elemento
     * @param {number} tenantId
     * @param {number} elementoOrdenId
     * @param {Object} datos
     * @returns {Promise<Object>}
     */
    static async subirFoto(tenantId, elementoOrdenId, datos) {
        const { url_foto, tipo, descripcion, subido_por } = datos;

        const elemento = await this.obtenerPorId(tenantId, elementoOrdenId);
        if (!elemento) {
            throw new AppError('Elemento no encontrado en la orden', 404);
        }

        const [result] = await pool.query(`
            INSERT INTO orden_elemento_fotos
            (tenant_id, orden_elemento_id, url_foto, tipo, descripcion, subido_por)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [tenantId, elementoOrdenId, url_foto, tipo || 'estado', descripcion || null, subido_por]);

        const [foto] = await pool.query(
            'SELECT * FROM orden_elemento_fotos WHERE tenant_id = ? AND id = ?',
            [tenantId, result.insertId]
        );

        return foto[0];
    }

    /**
     * Obtener fotos de un elemento
     * @param {number} tenantId
     * @param {number} elementoOrdenId
     * @returns {Promise<Array>}
     */
    static async obtenerFotos(tenantId, elementoOrdenId) {
        const [rows] = await pool.query(`
            SELECT
                oef.*,
                e.nombre as subidor_nombre,
                e.apellido as subidor_apellido
            FROM orden_elemento_fotos oef
            LEFT JOIN empleados e ON oef.subido_por = e.id AND e.tenant_id = ?
            WHERE oef.tenant_id = ? AND oef.orden_elemento_id = ?
            ORDER BY oef.created_at DESC
        `, [tenantId, tenantId, elementoOrdenId]);

        return rows;
    }

    /**
     * Agregar elemento a una orden
     * @param {number} tenantId
     * @param {number} ordenId
     * @param {Object} datos
     * @returns {Promise<Object>}
     */
    static async agregarElemento(tenantId, ordenId, datos) {
        const { elemento_id, serie_id, lote_id, cantidad = 1 } = datos;

        const [result] = await pool.query(`
            INSERT INTO orden_trabajo_elementos
            (tenant_id, orden_id, elemento_id, serie_id, lote_id, cantidad, estado)
            VALUES (?, ?, ?, ?, ?, ?, 'pendiente')
        `, [tenantId, ordenId, elemento_id, serie_id || null, lote_id || null, cantidad]);

        return this.obtenerPorId(tenantId, result.insertId);
    }

    /**
     * Eliminar elemento de una orden
     * @param {number} tenantId
     * @param {number} elementoId
     * @returns {Promise<boolean>}
     */
    static async eliminarElemento(tenantId, elementoId) {
        const elemento = await this.obtenerPorId(tenantId, elementoId);
        if (!elemento) {
            throw new AppError('Elemento no encontrado en la orden', 404);
        }

        // Solo permitir eliminar si está pendiente
        if (elemento.estado !== 'pendiente') {
            throw new AppError('Solo se pueden eliminar elementos en estado pendiente', 400);
        }

        await pool.query('DELETE FROM orden_trabajo_elementos WHERE tenant_id = ? AND id = ?', [tenantId, elementoId]);

        return true;
    }

    /**
     * Actualizar notas de un elemento
     * @param {number} tenantId
     * @param {number} elementoId
     * @param {string} notas
     * @returns {Promise<Object>}
     */
    static async actualizarNotas(tenantId, elementoId, notas) {
        const elemento = await this.obtenerPorId(tenantId, elementoId);
        if (!elemento) {
            throw new AppError('Elemento no encontrado en la orden', 404);
        }

        await pool.query(`
            UPDATE orden_trabajo_elementos
            SET notas = ?
            WHERE tenant_id = ? AND id = ?
        `, [notas, tenantId, elementoId]);

        return this.obtenerPorId(tenantId, elementoId);
    }
}

module.exports = OrdenElementoModel;
