const { pool } = require('../../../config/database');
const DisponibilidadModel = require('../../alquileres/models/DisponibilidadModel');
const AppError = require('../../../utils/AppError');

/**
 * Servicio para validar cambios de fecha en órdenes de trabajo
 * Reutiliza DisponibilidadModel para verificar conflictos
 */
class ValidadorFechasService {
    /**
     * Validar cambio de fecha de una orden
     * @param {number} ordenId
     * @param {Date} nuevaFecha
     * @returns {Promise<Object>} Resultado de validación
     */
    static async validarCambioFecha(ordenId, nuevaFecha) {
        // Obtener datos de la orden
        const [ordenRows] = await pool.query(`
            SELECT
                ot.id,
                ot.alquiler_id,
                ot.tipo,
                ot.fecha_programada as fecha_actual,
                ot.vehiculo_id
            FROM ordenes_trabajo ot
            WHERE ot.id = ?
        `, [ordenId]);

        if (ordenRows.length === 0) {
            throw new AppError('Orden de trabajo no encontrada', 404);
        }

        const orden = ordenRows[0];

        // Obtener elementos de la orden
        const elementos = await this.obtenerElementosOrden(ordenId);

        const resultado = {
            ordenId,
            fechaActual: orden.fecha_actual,
            fechaNueva: nuevaFecha,
            conflictos: [],
            advertencias: [],
            severidad: 'ok',
            requiereAprobacion: false
        };

        // 1. Verificar disponibilidad de elementos
        const conflictosElementos = await this.verificarDisponibilidadElementos(
            elementos,
            nuevaFecha
        );

        if (conflictosElementos.length > 0) {
            resultado.conflictos.push(...conflictosElementos);
        }

        // 2. Verificar disponibilidad del equipo
        const conflictosEquipo = await this.verificarDisponibilidadEquipo(ordenId, nuevaFecha);
        if (conflictosEquipo.length > 0) {
            resultado.advertencias.push(...conflictosEquipo);
        }

        // 3. Verificar disponibilidad del vehículo
        if (orden.vehiculo_id) {
            const conflictoVehiculo = await this.verificarDisponibilidadVehiculo(
                orden.vehiculo_id,
                nuevaFecha,
                ordenId
            );
            if (conflictoVehiculo) {
                resultado.advertencias.push(conflictoVehiculo);
            }
        }

        // 4. Verificar si la nueva fecha afecta a la orden relacionada (montaje/desmontaje)
        const conflictoOrdenRelacionada = await this.verificarOrdenRelacionada(orden, nuevaFecha);
        if (conflictoOrdenRelacionada) {
            resultado.advertencias.push(conflictoOrdenRelacionada);
        }

        // Calcular severidad
        resultado.severidad = this.calcularSeveridad(resultado.conflictos, resultado.advertencias);
        resultado.requiereAprobacion = resultado.severidad === 'critico';

        return resultado;
    }

    /**
     * Obtener elementos de una orden
     * @param {number} ordenId
     * @returns {Promise<Array>}
     */
    static async obtenerElementosOrden(ordenId) {
        const [rows] = await pool.query(`
            SELECT
                ote.id,
                ote.elemento_id,
                ote.serie_id,
                ote.lote_id,
                ote.cantidad,
                el.nombre as elemento_nombre,
                el.codigo as elemento_codigo
            FROM orden_trabajo_elementos ote
            INNER JOIN elementos el ON ote.elemento_id = el.id
            WHERE ote.orden_id = ?
        `, [ordenId]);

        return rows;
    }

    /**
     * Verificar disponibilidad de elementos usando DisponibilidadModel
     * @param {Array} elementos
     * @param {Date} fecha
     * @returns {Promise<Array>}
     */
    static async verificarDisponibilidadElementos(elementos, fecha) {
        const conflictos = [];

        for (const elem of elementos) {
            try {
                // Usar el método existente de DisponibilidadModel
                const disponibles = await DisponibilidadModel.obtenerSeriesDisponibles(
                    elem.elemento_id,
                    fecha,
                    fecha
                );

                // Para series individuales
                if (elem.serie_id) {
                    const serieDisponible = disponibles.some(d => d.id === elem.serie_id);
                    if (!serieDisponible) {
                        conflictos.push({
                            tipo: 'elemento',
                            elementoId: elem.elemento_id,
                            nombre: elem.elemento_nombre,
                            serieId: elem.serie_id,
                            mensaje: `La serie ${elem.serie_id} del elemento "${elem.elemento_nombre}" no está disponible para la fecha ${fecha}`,
                            disponibles: disponibles.length,
                            requeridos: 1,
                            faltantes: 1
                        });
                    }
                } else if (elem.cantidad > 0) {
                    // Para lotes o cantidades
                    const lotesDisponibles = await DisponibilidadModel.obtenerLotesDisponibles(
                        elem.elemento_id,
                        elem.cantidad,
                        fecha,
                        fecha
                    );

                    const cantidadDisponible = lotesDisponibles.reduce(
                        (sum, l) => sum + l.cantidad_disponible,
                        0
                    );

                    if (cantidadDisponible < elem.cantidad) {
                        conflictos.push({
                            tipo: 'elemento',
                            elementoId: elem.elemento_id,
                            nombre: elem.elemento_nombre,
                            mensaje: `Solo hay ${cantidadDisponible} unidades de "${elem.elemento_nombre}" disponibles, se requieren ${elem.cantidad}`,
                            disponibles: cantidadDisponible,
                            requeridos: elem.cantidad,
                            faltantes: elem.cantidad - cantidadDisponible
                        });
                    }
                }
            } catch (error) {
                // Si hay error verificando, agregar advertencia
                conflictos.push({
                    tipo: 'elemento',
                    elementoId: elem.elemento_id,
                    nombre: elem.elemento_nombre,
                    mensaje: `Error verificando disponibilidad de "${elem.elemento_nombre}": ${error.message}`,
                    error: true
                });
            }
        }

        return conflictos;
    }

    /**
     * Verificar disponibilidad del equipo asignado
     * @param {number} ordenId
     * @param {Date} fecha
     * @returns {Promise<Array>}
     */
    static async verificarDisponibilidadEquipo(ordenId, fecha) {
        const advertencias = [];

        // Obtener equipo actual de la orden
        const [equipo] = await pool.query(`
            SELECT
                ote.empleado_id,
                e.nombre,
                e.apellido
            FROM orden_trabajo_equipo ote
            INNER JOIN empleados e ON ote.empleado_id = e.id
            WHERE ote.orden_id = ?
        `, [ordenId]);

        for (const miembro of equipo) {
            // Verificar si el empleado tiene otras órdenes ese día
            const [otrasOrdenes] = await pool.query(`
                SELECT
                    ot.id,
                    ot.tipo,
                    ot.fecha_programada,
                    a.nombre_evento
                FROM ordenes_trabajo ot
                INNER JOIN orden_trabajo_equipo ote ON ot.id = ote.orden_id
                LEFT JOIN alquileres a ON ot.alquiler_id = a.id
                WHERE ote.empleado_id = ?
                  AND DATE(ot.fecha_programada) = DATE(?)
                  AND ot.id != ?
                  AND ot.estado NOT IN ('completado', 'cancelado')
            `, [miembro.empleado_id, fecha, ordenId]);

            if (otrasOrdenes.length > 0) {
                advertencias.push({
                    tipo: 'equipo',
                    empleadoId: miembro.empleado_id,
                    nombre: `${miembro.nombre} ${miembro.apellido}`,
                    mensaje: `${miembro.nombre} ${miembro.apellido} tiene ${otrasOrdenes.length} orden(es) asignada(s) para el ${fecha}`,
                    ordenes: otrasOrdenes.map(o => ({
                        id: o.id,
                        tipo: o.tipo,
                        evento: o.nombre_evento,
                        fecha: o.fecha_programada
                    }))
                });
            }
        }

        return advertencias;
    }

    /**
     * Verificar disponibilidad del vehículo
     * @param {number} vehiculoId
     * @param {Date} fecha
     * @param {number} ordenIdExcluir
     * @returns {Promise<Object|null>}
     */
    static async verificarDisponibilidadVehiculo(vehiculoId, fecha, ordenIdExcluir) {
        const [otrasOrdenes] = await pool.query(`
            SELECT
                ot.id,
                ot.tipo,
                ot.fecha_programada,
                a.nombre_evento,
                v.placa
            FROM ordenes_trabajo ot
            LEFT JOIN alquileres a ON ot.alquiler_id = a.id
            LEFT JOIN vehiculos v ON ot.vehiculo_id = v.id
            WHERE ot.vehiculo_id = ?
              AND DATE(ot.fecha_programada) = DATE(?)
              AND ot.id != ?
              AND ot.estado NOT IN ('completado', 'cancelado')
        `, [vehiculoId, fecha, ordenIdExcluir]);

        if (otrasOrdenes.length > 0) {
            return {
                tipo: 'vehiculo',
                vehiculoId,
                placa: otrasOrdenes[0].placa,
                mensaje: `El vehículo ${otrasOrdenes[0].placa} está asignado a ${otrasOrdenes.length} orden(es) el ${fecha}`,
                ordenes: otrasOrdenes.map(o => ({
                    id: o.id,
                    tipo: o.tipo,
                    evento: o.nombre_evento,
                    fecha: o.fecha_programada
                }))
            };
        }

        return null;
    }

    /**
     * Verificar si el cambio afecta a la orden relacionada
     * @param {Object} orden
     * @param {Date} nuevaFecha
     * @returns {Promise<Object|null>}
     */
    static async verificarOrdenRelacionada(orden, nuevaFecha) {
        // Buscar la orden complementaria (si es montaje, buscar desmontaje y viceversa)
        const tipoComplementario = orden.tipo === 'montaje' ? 'desmontaje' : 'montaje';

        const [ordenRelacionada] = await pool.query(`
            SELECT id, tipo, fecha_programada
            FROM ordenes_trabajo
            WHERE alquiler_id = ?
              AND tipo = ?
              AND estado NOT IN ('cancelado')
        `, [orden.alquiler_id, tipoComplementario]);

        if (ordenRelacionada.length > 0) {
            const relacionada = ordenRelacionada[0];
            const fechaNuevaDate = new Date(nuevaFecha);
            const fechaRelacionadaDate = new Date(relacionada.fecha_programada);

            // Verificar lógica de fechas
            if (orden.tipo === 'montaje' && fechaNuevaDate > fechaRelacionadaDate) {
                return {
                    tipo: 'orden_relacionada',
                    mensaje: `La fecha de montaje (${nuevaFecha}) no puede ser posterior a la fecha de desmontaje (${relacionada.fecha_programada})`,
                    ordenRelacionadaId: relacionada.id,
                    fechaRelacionada: relacionada.fecha_programada
                };
            }

            if (orden.tipo === 'desmontaje' && fechaNuevaDate < fechaRelacionadaDate) {
                return {
                    tipo: 'orden_relacionada',
                    mensaje: `La fecha de desmontaje (${nuevaFecha}) no puede ser anterior a la fecha de montaje (${relacionada.fecha_programada})`,
                    ordenRelacionadaId: relacionada.id,
                    fechaRelacionada: relacionada.fecha_programada
                };
            }
        }

        return null;
    }

    /**
     * Calcular severidad basada en conflictos y advertencias
     * @param {Array} conflictos
     * @param {Array} advertencias
     * @returns {string}
     */
    static calcularSeveridad(conflictos, advertencias) {
        if (conflictos.length === 0 && advertencias.length === 0) {
            return 'ok';
        }

        // Si hay conflictos de elementos, es crítico
        const conflictosElementos = conflictos.filter(c => c.tipo === 'elemento' && !c.error);
        if (conflictosElementos.length > 0) {
            const totalFaltantes = conflictosElementos.reduce(
                (sum, c) => sum + (c.faltantes || 0),
                0
            );

            if (totalFaltantes > 5) {
                return 'critico';
            }
            return 'alto';
        }

        // Si solo hay advertencias
        if (advertencias.length > 0) {
            // Múltiples conflictos de equipo/vehículo
            if (advertencias.length >= 3) {
                return 'alto';
            }
            return 'advertencia';
        }

        return 'info';
    }

    /**
     * Detectar conflictos generales para un rango de fechas
     * @param {Array} elementoIds
     * @param {Date} fechaInicio
     * @param {Date} fechaFin
     * @returns {Promise<Array>}
     */
    static async detectarConflictos(elementoIds, fechaInicio, fechaFin) {
        const conflictos = [];

        for (const elementoId of elementoIds) {
            try {
                const disponibles = await DisponibilidadModel.obtenerSeriesDisponibles(
                    elementoId,
                    fechaInicio,
                    fechaFin
                );

                // Obtener cantidad total del elemento
                const [elemento] = await pool.query(`
                    SELECT
                        el.nombre,
                        el.codigo,
                        (SELECT COUNT(*) FROM series WHERE elemento_id = el.id AND estado = 'disponible') as total_series,
                        (SELECT SUM(cantidad_actual) FROM lotes WHERE elemento_id = el.id AND estado = 'disponible') as total_lotes
                    FROM elementos el
                    WHERE el.id = ?
                `, [elementoId]);

                if (elemento.length > 0) {
                    const totalDisponible = (elemento[0].total_series || 0) + (elemento[0].total_lotes || 0);
                    const ocupados = totalDisponible - disponibles.length;

                    if (ocupados > 0) {
                        conflictos.push({
                            elementoId,
                            nombre: elemento[0].nombre,
                            codigo: elemento[0].codigo,
                            totalDisponible,
                            disponiblesEnRango: disponibles.length,
                            ocupados
                        });
                    }
                }
            } catch (error) {
                // Ignorar errores de elementos individuales
            }
        }

        return conflictos;
    }
}

module.exports = ValidadorFechasService;
