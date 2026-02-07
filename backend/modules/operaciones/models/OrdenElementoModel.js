const { pool } = require('../../../config/database');
const AppError = require('../../../utils/AppError');

class OrdenElementoModel {
    /**
     * Obtener elementos de una orden
     * @param {number} ordenId
     * @returns {Promise<Array>}
     */
    static async obtenerPorOrden(ordenId) {
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
            INNER JOIN elementos el ON ote.elemento_id = el.id
            LEFT JOIN series s ON ote.serie_id = s.id
            LEFT JOIN lotes l ON ote.lote_id = l.id
            WHERE ote.orden_id = ?
            ORDER BY el.nombre ASC
        `, [ordenId]);

        return rows;
    }

    /**
     * Cambiar estado de un elemento en la orden
     * @param {number} elementoId - ID del registro en orden_trabajo_elementos
     * @param {string} estado
     * @returns {Promise<Object>}
     */
    static async cambiarEstado(elementoId, estado) {
        const estadosValidos = ['pendiente', 'preparado', 'cargado', 'instalado', 'desmontado', 'retornado', 'incidencia'];

        if (!estadosValidos.includes(estado)) {
            throw new AppError(`Estado inválido. Valores permitidos: ${estadosValidos.join(', ')}`, 400);
        }

        const [existente] = await pool.query(
            'SELECT * FROM orden_trabajo_elementos WHERE id = ?',
            [elementoId]
        );

        if (existente.length === 0) {
            throw new AppError('Elemento no encontrado en la orden', 404);
        }

        await pool.query(`
            UPDATE orden_trabajo_elementos
            SET estado = ?
            WHERE id = ?
        `, [estado, elementoId]);

        const [resultado] = await pool.query(`
            SELECT
                ote.*,
                el.nombre as elemento_nombre,
                s.numero_serie,
                l.lote_numero
            FROM orden_trabajo_elementos ote
            INNER JOIN elementos el ON ote.elemento_id = el.id
            LEFT JOIN series s ON ote.serie_id = s.id
            LEFT JOIN lotes l ON ote.lote_id = l.id
            WHERE ote.id = ?
        `, [elementoId]);

        return resultado[0];
    }

    /**
     * ============================================
     * Cambiar estado de múltiples elementos a la vez
     * Permite operaciones masivas para agilizar el proceso
     * ============================================
     * @param {number} ordenId - ID de la orden de trabajo
     * @param {Array<number>} elementoIds - IDs de los registros en orden_trabajo_elementos
     * @param {string} estado - Nuevo estado a aplicar
     * @returns {Promise<Object>} - Cantidad de registros actualizados
     */
    static async cambiarEstadoMasivo(ordenId, elementoIds, estado) {
        const estadosValidos = ['pendiente', 'preparado', 'cargado', 'instalado', 'desmontado', 'retornado', 'incidencia'];

        if (!estadosValidos.includes(estado)) {
            throw new AppError(`Estado inválido. Valores permitidos: ${estadosValidos.join(', ')}`, 400);
        }

        if (!Array.isArray(elementoIds) || elementoIds.length === 0) {
            throw new AppError('Debe proporcionar al menos un elemento', 400);
        }

        // Verificar que todos los elementos pertenecen a la orden
        const placeholders = elementoIds.map(() => '?').join(',');
        const [existentes] = await pool.query(
            `SELECT id FROM orden_trabajo_elementos WHERE orden_id = ? AND id IN (${placeholders})`,
            [ordenId, ...elementoIds]
        );

        if (existentes.length !== elementoIds.length) {
            throw new AppError('Algunos elementos no pertenecen a esta orden', 400);
        }

        // Actualizar todos los elementos
        const [result] = await pool.query(`
            UPDATE orden_trabajo_elementos
            SET estado = ?, updated_at = NOW()
            WHERE orden_id = ? AND id IN (${placeholders})
        `, [estado, ordenId, ...elementoIds]);

        return {
            actualizados: result.affectedRows,
            estado: estado
        };
    }

    /**
     * Verificar salida de elemento
     * @param {number} elementoId
     * @param {number} verificadoPor
     * @returns {Promise<Object>}
     */
    static async verificarSalida(elementoId, verificadoPor) {
        const [existente] = await pool.query(
            'SELECT * FROM orden_trabajo_elementos WHERE id = ?',
            [elementoId]
        );

        if (existente.length === 0) {
            throw new AppError('Elemento no encontrado en la orden', 404);
        }

        await pool.query(`
            UPDATE orden_trabajo_elementos
            SET verificado_salida = TRUE,
                estado = 'cargado'
            WHERE id = ?
        `, [elementoId]);

        return this.obtenerPorId(elementoId);
    }

    /**
     * Verificar retorno de elemento
     * @param {number} elementoId
     * @param {number} verificadoPor
     * @returns {Promise<Object>}
     */
    static async verificarRetorno(elementoId, verificadoPor) {
        const [existente] = await pool.query(
            'SELECT * FROM orden_trabajo_elementos WHERE id = ?',
            [elementoId]
        );

        if (existente.length === 0) {
            throw new AppError('Elemento no encontrado en la orden', 404);
        }

        await pool.query(`
            UPDATE orden_trabajo_elementos
            SET verificado_retorno = TRUE,
                estado = 'retornado'
            WHERE id = ?
        `, [elementoId]);

        return this.obtenerPorId(elementoId);
    }

    /**
     * Obtener elemento por ID
     * @param {number} elementoId
     * @returns {Promise<Object|null>}
     */
    static async obtenerPorId(elementoId) {
        const [rows] = await pool.query(`
            SELECT
                ote.*,
                el.nombre as elemento_nombre,
                s.numero_serie,
                l.lote_numero
            FROM orden_trabajo_elementos ote
            INNER JOIN elementos el ON ote.elemento_id = el.id
            LEFT JOIN series s ON ote.serie_id = s.id
            LEFT JOIN lotes l ON ote.lote_id = l.id
            WHERE ote.id = ?
        `, [elementoId]);

        return rows.length > 0 ? rows[0] : null;
    }

    /**
     * Registrar incidencia en un elemento
     * @param {number} elementoOrdenId
     * @param {Object} datos
     * @returns {Promise<Object>}
     */
    static async registrarIncidencia(elementoOrdenId, datos) {
        const { tipo, descripcion, severidad = 'media', reportado_por } = datos;

        const elemento = await this.obtenerPorId(elementoOrdenId);
        if (!elemento) {
            throw new AppError('Elemento no encontrado en la orden', 404);
        }

        const [result] = await pool.query(`
            INSERT INTO elemento_incidencias
            (orden_elemento_id, tipo, descripcion, severidad, reportado_por)
            VALUES (?, ?, ?, ?, ?)
        `, [elementoOrdenId, tipo, descripcion, severidad, reportado_por]);

        // Cambiar estado del elemento a incidencia
        await pool.query(`
            UPDATE orden_trabajo_elementos
            SET estado = 'incidencia'
            WHERE id = ?
        `, [elementoOrdenId]);

        const [incidencia] = await pool.query(`
            SELECT
                ei.*,
                e.nombre as reportador_nombre,
                e.apellido as reportador_apellido
            FROM elemento_incidencias ei
            LEFT JOIN empleados e ON ei.reportado_por = e.id
            WHERE ei.id = ?
        `, [result.insertId]);

        return incidencia[0];
    }

    /**
     * Obtener incidencias de un elemento
     * @param {number} elementoOrdenId
     * @returns {Promise<Array>}
     */
    static async obtenerIncidencias(elementoOrdenId) {
        const [rows] = await pool.query(`
            SELECT
                ei.*,
                e.nombre as reportador_nombre,
                e.apellido as reportador_apellido,
                er.nombre as resolutor_nombre,
                er.apellido as resolutor_apellido
            FROM elemento_incidencias ei
            LEFT JOIN empleados e ON ei.reportado_por = e.id
            LEFT JOIN empleados er ON ei.resuelto_por = er.id
            WHERE ei.orden_elemento_id = ?
            ORDER BY ei.created_at DESC
        `, [elementoOrdenId]);

        return rows;
    }

    /**
     * Resolver incidencia
     * @param {number} incidenciaId
     * @param {Object} datos
     * @returns {Promise<Object>}
     */
    static async resolverIncidencia(incidenciaId, datos) {
        const { resolucion, resuelto_por } = datos;

        const [existente] = await pool.query(
            'SELECT * FROM elemento_incidencias WHERE id = ?',
            [incidenciaId]
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
            WHERE id = ?
        `, [resolucion, resuelto_por, incidenciaId]);

        const [incidencia] = await pool.query(`
            SELECT
                ei.*,
                e.nombre as reportador_nombre,
                e.apellido as reportador_apellido,
                er.nombre as resolutor_nombre,
                er.apellido as resolutor_apellido
            FROM elemento_incidencias ei
            LEFT JOIN empleados e ON ei.reportado_por = e.id
            LEFT JOIN empleados er ON ei.resuelto_por = er.id
            WHERE ei.id = ?
        `, [incidenciaId]);

        return incidencia[0];
    }

    /**
     * Subir foto de elemento
     * @param {number} elementoOrdenId
     * @param {Object} datos
     * @returns {Promise<Object>}
     */
    static async subirFoto(elementoOrdenId, datos) {
        const { url_foto, tipo, descripcion, subido_por } = datos;

        const elemento = await this.obtenerPorId(elementoOrdenId);
        if (!elemento) {
            throw new AppError('Elemento no encontrado en la orden', 404);
        }

        const [result] = await pool.query(`
            INSERT INTO orden_elemento_fotos
            (orden_elemento_id, url_foto, tipo, descripcion, subido_por)
            VALUES (?, ?, ?, ?, ?)
        `, [elementoOrdenId, url_foto, tipo || 'estado', descripcion || null, subido_por]);

        const [foto] = await pool.query(
            'SELECT * FROM orden_elemento_fotos WHERE id = ?',
            [result.insertId]
        );

        return foto[0];
    }

    /**
     * Obtener fotos de un elemento
     * @param {number} elementoOrdenId
     * @returns {Promise<Array>}
     */
    static async obtenerFotos(elementoOrdenId) {
        const [rows] = await pool.query(`
            SELECT
                oef.*,
                e.nombre as subidor_nombre,
                e.apellido as subidor_apellido
            FROM orden_elemento_fotos oef
            LEFT JOIN empleados e ON oef.subido_por = e.id
            WHERE oef.orden_elemento_id = ?
            ORDER BY oef.created_at DESC
        `, [elementoOrdenId]);

        return rows;
    }

    /**
     * Agregar elemento a una orden
     * @param {number} ordenId
     * @param {Object} datos
     * @returns {Promise<Object>}
     */
    static async agregarElemento(ordenId, datos) {
        const { elemento_id, serie_id, lote_id, cantidad = 1 } = datos;

        const [result] = await pool.query(`
            INSERT INTO orden_trabajo_elementos
            (orden_id, elemento_id, serie_id, lote_id, cantidad, estado)
            VALUES (?, ?, ?, ?, ?, 'pendiente')
        `, [ordenId, elemento_id, serie_id || null, lote_id || null, cantidad]);

        return this.obtenerPorId(result.insertId);
    }

    /**
     * Eliminar elemento de una orden
     * @param {number} elementoId
     * @returns {Promise<boolean>}
     */
    static async eliminarElemento(elementoId) {
        const elemento = await this.obtenerPorId(elementoId);
        if (!elemento) {
            throw new AppError('Elemento no encontrado en la orden', 404);
        }

        // Solo permitir eliminar si está pendiente
        if (elemento.estado !== 'pendiente') {
            throw new AppError('Solo se pueden eliminar elementos en estado pendiente', 400);
        }

        await pool.query('DELETE FROM orden_trabajo_elementos WHERE id = ?', [elementoId]);

        return true;
    }

    /**
     * Actualizar notas de un elemento
     * @param {number} elementoId
     * @param {string} notas
     * @returns {Promise<Object>}
     */
    static async actualizarNotas(elementoId, notas) {
        const elemento = await this.obtenerPorId(elementoId);
        if (!elemento) {
            throw new AppError('Elemento no encontrado en la orden', 404);
        }

        await pool.query(`
            UPDATE orden_trabajo_elementos
            SET notas = ?
            WHERE id = ?
        `, [notas, elementoId]);

        return this.obtenerPorId(elementoId);
    }
}

module.exports = OrdenElementoModel;
