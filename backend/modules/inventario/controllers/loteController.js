// ============================================
// CONTROLLER: loteController
// Responsabilidad: Lógica de negocio de lotes
// ============================================

const LoteModel = require('../models/LoteModel');
const ElementoModel = require('../models/ElementoModel');
const AppError = require('../../../utils/AppError');
const logger = require('../../../utils/logger');
const { validateCantidad, validateEstado, validateId } = require('../../../utils/validators');
const { MENSAJES_ERROR, MENSAJES_EXITO, ENTIDADES } = require('../../../config/constants');
const { pool } = require('../../../config/database');
const { getPaginationParams, getPaginatedResponse, shouldPaginate, getSortParams } = require('../../../utils/pagination');

// ============================================
// OBTENER TODOS LOS LOTES
// ============================================

exports.obtenerTodos = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;

        if (shouldPaginate(req.query) && (req.query.page || req.query.limit)) {
            const { page, limit, offset } = getPaginationParams(req.query);
            const { sortBy, order } = getSortParams(req.query, 'lote_numero');
            const search = req.query.search || null;

            logger.debug('loteController.obtenerTodos', 'Modo paginado', {
                page, limit, offset, sortBy, order, search
            });

            const lotes = await LoteModel.obtenerConPaginacion(tenantId, {
                limit,
                offset,
                sortBy,
                order,
                search
            });
            const total = await LoteModel.contarTodos(tenantId, search);

            res.json(getPaginatedResponse(lotes, page, limit, total));
        } else {
            const lotes = await LoteModel.obtenerTodos(tenantId);

            res.json({
                success: true,
                data: lotes,
                total: lotes.length
            });
        }
    } catch (error) {
        next(error);
    }
};

// ============================================
// OBTENER LOTE POR ID
// ============================================
exports.obtenerPorId = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const { id } = req.params;
        const lote = await LoteModel.obtenerPorId(tenantId, id);

        if (!lote) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.LOTE), 404);
        }

        res.json({
            success: true,
            data: lote
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// OBTENER LOTES DE UN ELEMENTO
// ============================================
exports.obtenerPorElemento = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const { elementoId } = req.params;

        validateId(elementoId, 'ID de elemento');

        const elemento = await ElementoModel.obtenerPorId(tenantId, elementoId);
        if (!elemento) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.ELEMENTO), 404);
        }

        if (elemento.requiere_series) {
            throw new AppError(
                'Este elemento requiere series individuales. Use el endpoint /api/series',
                400
            );
        }

        const lotes = await LoteModel.obtenerPorElemento(tenantId, elementoId);
        const stats = await LoteModel.obtenerEstadisticas(tenantId, elementoId);

        res.json({
            success: true,
            elemento: {
                id: elemento.id,
                nombre: elemento.nombre,
                cantidad_total: elemento.cantidad
            },
            estadisticas: stats,
            lotes: lotes,
            total_lotes: lotes.length
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// OBTENER LOTES POR ESTADO
// ============================================
exports.obtenerPorEstado = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const { estado } = req.params;

        const estadoValidado = validateEstado(estado, true);

        const lotes = await LoteModel.obtenerPorEstado(tenantId, estadoValidado);

        res.json({
            success: true,
            estado: estadoValidado,
            data: lotes,
            total: lotes.length
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// CREAR LOTE MANUALMENTE
// ============================================

function generarNumeroLote() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const sufijo = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `LOTE-${yyyy}${mm}${dd}-${sufijo}`;
}

exports.crear = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const { elemento_id, cantidad, estado, ubicacion } = req.body;

        logger.info('loteController.crear', 'Creando nuevo lote', { elemento_id, cantidad });

        const elementoIdValidado = validateId(elemento_id, 'elemento_id');
        const cantidadValidada = validateCantidad(cantidad, 'Cantidad');
        const estadoValidado = estado ? validateEstado(estado, false) : 'bueno';

        const elemento = await ElementoModel.obtenerPorId(tenantId, elementoIdValidado);
        if (!elemento) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.ELEMENTO), 404);
        }

        if (elemento.requiere_series) {
            throw new AppError(
                'Este elemento requiere series individuales, no puede usar lotes',
                400
            );
        }

        const nuevoId = await LoteModel.crear(tenantId, {
            elemento_id: elementoIdValidado,
            lote_numero: generarNumeroLote(),
            cantidad: cantidadValidada,
            estado: estadoValidado,
            ubicacion: ubicacion || null
        });

        const nuevoLote = await LoteModel.obtenerPorId(tenantId, nuevoId);

        logger.info('loteController.crear', 'Lote creado exitosamente', {
            id: nuevoId,
            lote_numero: nuevoLote.lote_numero
        });

        res.status(201).json({
            success: true,
            message: MENSAJES_EXITO.CREADO(ENTIDADES.LOTE),
            data: nuevoLote
        });
    } catch (error) {
        logger.error('loteController.crear', error);
        next(error);
    }
};

// ============================================
// MOVER CANTIDAD ENTRE LOTES (Función Principal)
// ============================================
exports.moverCantidad = async (req, res, next) => {
    const connection = await pool.getConnection();

    try {
        const tenantId = req.tenant.id;
        const {
            lote_origen_id,
            cantidad,
            estado_destino,
            ubicacion_destino,
            motivo,
            descripcion,
            costo_reparacion
        } = req.body;

        logger.info('loteController.moverCantidad', 'Iniciando movimiento de lote', {
            lote_origen_id,
            cantidad,
            estado_destino
        });

        const loteOrigenId = validateId(lote_origen_id, 'lote_origen_id');
        const cantidadValidada = validateCantidad(cantidad, 'Cantidad');
        const estadoDestinoValidado = validateEstado(estado_destino);

        const loteOrigen = await LoteModel.obtenerPorId(tenantId, loteOrigenId);
        if (!loteOrigen) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO('Lote origen'), 404);
        }

        if (loteOrigen.cantidad < cantidadValidada) {
            throw new AppError(
                `Cantidad insuficiente. Disponible: ${loteOrigen.cantidad}, Solicitado: ${cantidadValidada}`,
                400
            );
        }

        await connection.beginTransaction();
        logger.debug('loteController.moverCantidad', 'Transacción iniciada');

        // 1. Buscar o crear lote destino
        let loteDestino = await LoteModel.buscarLoteEspecifico(
            tenantId,
            loteOrigen.elemento_id,
            estadoDestinoValidado,
            ubicacion_destino
        );

        let loteDestinoId;
        let loteDestinoCreado = false;

        if (loteDestino) {
            logger.debug('loteController.moverCantidad', 'Lote destino encontrado', {
                lote_destino_id: loteDestino.id
            });

            await LoteModel.sumarCantidad(tenantId, loteDestino.id, cantidadValidada);
            loteDestinoId = loteDestino.id;
        } else {
            logger.debug('loteController.moverCantidad', 'Creando nuevo lote destino');

            loteDestinoId = await LoteModel.crear(tenantId, {
                elemento_id: loteOrigen.elemento_id,
                cantidad: cantidadValidada,
                estado: estadoDestinoValidado,
                ubicacion: ubicacion_destino,
                lote_numero: generarNumeroLote()
            });
            loteDestinoCreado = true;
        }

        // 2. Restar cantidad del lote origen
        await LoteModel.restarCantidad(tenantId, loteOrigenId, cantidadValidada);
        logger.debug('loteController.moverCantidad', 'Cantidad restada del lote origen');

        // 3. Registrar movimiento en historial
        await LoteModel.registrarMovimiento(tenantId, {
            lote_origen_id: loteOrigenId,
            lote_destino_id: loteDestinoId,
            cantidad: cantidadValidada,
            motivo: motivo || null,
            descripcion: descripcion || null,
            estado_origen: loteOrigen.estado,
            estado_destino: estadoDestinoValidado,
            ubicacion_origen: loteOrigen.ubicacion,
            ubicacion_destino: ubicacion_destino,
            costo_reparacion: costo_reparacion || null
        });
        logger.debug('loteController.moverCantidad', 'Movimiento registrado en historial');

        // 4. Si el lote origen quedó vacío, eliminarlo
        const loteOrigenActualizado = await LoteModel.obtenerPorId(tenantId, loteOrigenId);
        let loteOrigenEliminado = false;

        if (loteOrigenActualizado && loteOrigenActualizado.cantidad === 0) {
            await LoteModel.eliminar(tenantId, loteOrigenId);
            loteOrigenEliminado = true;
            logger.debug('loteController.moverCantidad', 'Lote origen eliminado (cantidad = 0)');
        }

        await connection.commit();
        logger.info('loteController.moverCantidad', 'Transacción completada exitosamente', {
            lote_origen_eliminado: loteOrigenEliminado,
            lote_destino_creado: loteDestinoCreado
        });

        // 5. Obtener estado actualizado
        const estadisticas = await LoteModel.obtenerEstadisticas(tenantId, loteOrigen.elemento_id);
        const lotesActualizados = await LoteModel.obtenerPorElemento(tenantId, loteOrigen.elemento_id);

        res.json({
            success: true,
            message: MENSAJES_EXITO.MOVIMIENTO_EXITOSO,
            movimiento: {
                cantidad_movida: cantidadValidada,
                estado_origen: loteOrigen.estado,
                estado_destino: estadoDestinoValidado,
                lote_origen_eliminado: loteOrigenEliminado,
                lote_destino_creado: loteDestinoCreado
            },
            estadisticas: estadisticas,
            lotes_actuales: lotesActualizados
        });

    } catch (error) {
        await connection.rollback();
        logger.error('loteController.moverCantidad', error, {
            lote_origen_id: req.body.lote_origen_id,
            cantidad: req.body.cantidad
        });

        next(error);
    } finally {
        connection.release();
        logger.debug('loteController.moverCantidad', 'Conexión liberada');
    }
};

// ============================================
// ACTUALIZAR LOTE (cantidad, ubicación)
// ============================================
exports.actualizar = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const { id } = req.params;
        const { cantidad, ubicacion } = req.body;

        logger.info('loteController.actualizar', 'Actualizando lote', { id });

        const lote = await LoteModel.obtenerPorId(tenantId, id);
        if (!lote) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.LOTE), 404);
        }

        if (cantidad !== undefined) {
            const cantidadValidada = validateCantidad(cantidad, 'Cantidad', false);
            await LoteModel.actualizarCantidad(tenantId, id, cantidadValidada);

            if (cantidadValidada === 0) {
                await LoteModel.eliminar(tenantId, id);
                logger.info('loteController.actualizar', 'Lote eliminado automáticamente (cantidad = 0)', { id });

                return res.json({
                    success: true,
                    message: 'Lote actualizado y eliminado automáticamente (cantidad = 0)',
                    data: null,
                    lote_eliminado: true
                });
            }
        }

        if (ubicacion !== undefined) {
            await pool.query(
                'UPDATE lotes SET ubicacion = ? WHERE id = ? AND tenant_id = ?',
                [ubicacion, id, tenantId]
            );
        }

        const loteActualizado = await LoteModel.obtenerPorId(tenantId, id);

        logger.info('loteController.actualizar', 'Lote actualizado exitosamente', { id });

        res.json({
            success: true,
            message: MENSAJES_EXITO.ACTUALIZADO(ENTIDADES.LOTE),
            data: loteActualizado
        });
    } catch (error) {
        logger.error('loteController.actualizar', error);
        next(error);
    }
};

// ============================================
// ELIMINAR LOTE
// ============================================
exports.eliminar = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const { id } = req.params;

        logger.info('loteController.eliminar', 'Eliminando lote', { id });

        const lote = await LoteModel.obtenerPorId(tenantId, id);
        if (!lote) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.LOTE), 404);
        }

        if (lote.cantidad > 0) {
            throw new AppError(
                `No se puede eliminar un lote con cantidad ${lote.cantidad}. Primero mueva o reduzca la cantidad a 0.`,
                400
            );
        }

        const filasAfectadas = await LoteModel.eliminar(tenantId, id);

        if (filasAfectadas === 0) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.LOTE), 404);
        }

        logger.info('loteController.eliminar', 'Lote eliminado exitosamente', {
            id,
            lote_numero: lote.lote_numero
        });

        res.json({
            success: true,
            message: MENSAJES_EXITO.ELIMINADO(ENTIDADES.LOTE)
        });
    } catch (error) {
        logger.error('loteController.eliminar', error);
        next(error);
    }
};

// ============================================
// OBTENER HISTORIAL DE MOVIMIENTOS
// ============================================
exports.obtenerHistorial = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const { id } = req.params;

        const lote = await LoteModel.obtenerPorId(tenantId, id);
        if (!lote) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.LOTE), 404);
        }

        const historial = await LoteModel.obtenerHistorial(tenantId, id);

        res.json({
            success: true,
            lote: {
                id: lote.id,
                elemento: lote.elemento_nombre,
                cantidad_actual: lote.cantidad,
                estado: lote.estado
            },
            historial: historial,
            total: historial.length
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// OBTENER RESUMEN DE DISPONIBILIDAD
// ============================================
exports.obtenerResumenDisponibilidad = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const query = `
            SELECT
                e.id,
                e.nombre AS elemento,
                e.cantidad AS cantidad_total,
                SUM(CASE WHEN l.estado = 'bueno' THEN l.cantidad ELSE 0 END) AS disponibles,
                SUM(CASE WHEN l.estado = 'alquilado' THEN l.cantidad ELSE 0 END) AS alquilados,
                SUM(CASE WHEN l.estado = 'mantenimiento' THEN l.cantidad ELSE 0 END) AS en_mantenimiento
            FROM elementos e
            LEFT JOIN lotes l ON e.id = l.elemento_id AND l.tenant_id = e.tenant_id
            WHERE e.requiere_series = FALSE AND e.tenant_id = ?
            GROUP BY e.id, e.nombre, e.cantidad
            HAVING COUNT(l.id) > 0
            ORDER BY e.nombre
        `;

        const [rows] = await pool.query(query, [tenantId]);

        res.json({
            success: true,
            data: rows,
            total: rows.length
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// OBTENER LOTES CON CONTEXTO DE ALQUILER
// ============================================
exports.obtenerPorElementoConContexto = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const { elementoId } = req.params;

        validateId(elementoId, 'ID de elemento');

        const elemento = await ElementoModel.obtenerPorId(tenantId, elementoId);
        if (!elemento) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.ELEMENTO), 404);
        }

        if (elemento.requiere_series) {
            throw new AppError(
                'Este elemento requiere series individuales. Use el endpoint de series.',
                400
            );
        }

        const resultado = await LoteModel.obtenerPorElementoConContexto(tenantId, elementoId);

        res.json({
            success: true,
            elemento: {
                id: elemento.id,
                nombre: elemento.nombre,
                cantidad_total: elemento.cantidad
            },
            estadisticas: resultado.estadisticas,
            lotes_por_ubicacion: resultado.lotes_por_ubicacion,
            en_eventos: resultado.en_eventos,
            total_en_eventos: resultado.total_en_eventos
        });
    } catch (error) {
        logger.error('loteController.obtenerPorElementoConContexto', error);
        next(error);
    }
};

// ============================================
// VERIFICAR EXISTENCIA DE LOTE
// ============================================
exports.verificarExistencia = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const { elementoId, ubicacion, estado } = req.query;

        validateId(elementoId, 'ID de elemento');

        if (!estado) {
            throw new AppError('El estado es requerido', 400);
        }

        const loteExistente = await LoteModel.buscarLoteEspecifico(
            tenantId,
            elementoId,
            estado,
            ubicacion || null
        );

        res.json({
            success: true,
            data: {
                existe: !!loteExistente,
                lote: loteExistente ? {
                    id: loteExistente.id,
                    cantidad: loteExistente.cantidad
                } : null
            }
        });
    } catch (error) {
        logger.error('loteController.verificarExistencia', error);
        next(error);
    }
};

// ============================================
// OBTENER DESGLOSE DE ALQUILERES
// ============================================
exports.obtenerDesgloseAlquileres = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const { elementoId } = req.params;

        validateId(elementoId, 'ID de elemento');

        const elemento = await ElementoModel.obtenerPorId(tenantId, elementoId);
        if (!elemento) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.ELEMENTO), 404);
        }

        const desglose = await LoteModel.obtenerDesgloseAlquileres(tenantId, elementoId);

        const totalEnEventos = desglose.reduce((sum, e) => sum + e.cantidad_total, 0);

        res.json({
            success: true,
            elemento: {
                id: elemento.id,
                nombre: elemento.nombre
            },
            eventos: desglose,
            total_eventos: desglose.length,
            total_cantidad_en_eventos: totalEnEventos
        });
    } catch (error) {
        logger.error('loteController.obtenerDesgloseAlquileres', error);
        next(error);
    }
};
