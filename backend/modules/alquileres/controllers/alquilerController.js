// ============================================
// CONTROLADOR: Alquiler
// Alquileres con gestión de elementos físicos
// ============================================

const AlquilerModel = require('../models/AlquilerModel');
const AlquilerElementoModel = require('../models/AlquilerElementoModel');
const CotizacionModel = require('../models/CotizacionModel');
const SerieModel = require('../../inventario/models/SerieModel');
const LoteModel = require('../../inventario/models/LoteModel');
const AppError = require('../../../utils/AppError');
const logger = require('../../../utils/logger');

// ============================================
// OBTENER TODOS
// ============================================
exports.obtenerTodos = async (req, res, next) => {
  try {
    const alquileres = await AlquilerModel.obtenerTodos();
    res.json({
      success: true,
      data: alquileres,
      total: alquileres.length
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// OBTENER POR ESTADO
// ============================================
exports.obtenerPorEstado = async (req, res, next) => {
  try {
    const { estado } = req.params;
    const estadosValidos = ['programado', 'activo', 'finalizado', 'cancelado'];

    if (!estadosValidos.includes(estado)) {
      throw new AppError(`Estado inválido. Valores permitidos: ${estadosValidos.join(', ')}`, 400);
    }

    const alquileres = await AlquilerModel.obtenerPorEstado(estado);
    res.json({
      success: true,
      data: alquileres,
      total: alquileres.length
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// OBTENER ACTIVOS
// ============================================
exports.obtenerActivos = async (req, res, next) => {
  try {
    const alquileres = await AlquilerModel.obtenerActivos();
    res.json({
      success: true,
      data: alquileres,
      total: alquileres.length
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// OBTENER PROGRAMADOS
// ============================================
exports.obtenerProgramados = async (req, res, next) => {
  try {
    const alquileres = await AlquilerModel.obtenerProgramados();
    res.json({
      success: true,
      data: alquileres,
      total: alquileres.length
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// OBTENER POR ID
// ============================================
exports.obtenerPorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const alquiler = await AlquilerModel.obtenerPorId(id);

    if (!alquiler) {
      throw new AppError('Alquiler no encontrado', 404);
    }

    res.json({
      success: true,
      data: alquiler
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// OBTENER COMPLETO (con productos y elementos)
// ============================================
exports.obtenerCompleto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const alquiler = await AlquilerModel.obtenerCompleto(id);

    if (!alquiler) {
      throw new AppError('Alquiler no encontrado', 404);
    }

    res.json({
      success: true,
      data: alquiler
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// OBTENER ELEMENTOS ASIGNADOS
// ============================================
exports.obtenerElementos = async (req, res, next) => {
  try {
    const { id } = req.params;

    const alquiler = await AlquilerModel.obtenerPorId(id);
    if (!alquiler) {
      throw new AppError('Alquiler no encontrado', 404);
    }

    const elementos = await AlquilerElementoModel.obtenerPorAlquiler(id);

    res.json({
      success: true,
      data: elementos,
      total: elementos.length
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// ASIGNAR ELEMENTOS (series/lotes)
// ============================================
exports.asignarElementos = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { elementos } = req.body;

    const alquiler = await AlquilerModel.obtenerPorId(id);
    if (!alquiler) {
      throw new AppError('Alquiler no encontrado', 404);
    }

    if (alquiler.estado !== 'programado' && alquiler.estado !== 'activo') {
      throw new AppError('Solo se pueden asignar elementos a alquileres programados o activos', 400);
    }

    if (!elementos || elementos.length === 0) {
      throw new AppError('Debe proporcionar elementos a asignar', 400);
    }

    // Validar que las series no estén en otro alquiler activo
    for (const elem of elementos) {
      if (elem.serie_id) {
        const enAlquiler = await AlquilerElementoModel.serieEnAlquilerActivo(elem.serie_id);
        if (enAlquiler) {
          throw new AppError(`La serie ${elem.serie_id} ya está en un alquiler activo`, 400);
        }
      }
    }

    await AlquilerElementoModel.asignarMultiples(id, elementos);

    // TODO: Cambiar estado de series/lotes a 'alquilado'
    // Esto requiere integración con SerieModel y LoteModel

    logger.info('alquilerController.asignarElementos', 'Elementos asignados', {
      alquilerId: id,
      cantidad: elementos.length
    });

    const alquilerActualizado = await AlquilerModel.obtenerCompleto(id);

    res.json({
      success: true,
      mensaje: 'Elementos asignados exitosamente',
      data: alquilerActualizado
    });
  } catch (error) {
    logger.error('alquilerController.asignarElementos', error);
    next(error);
  }
};

// ============================================
// CAMBIAR ELEMENTO ASIGNADO
// Permite cambiar una serie/lote por otra disponible
// ============================================
exports.cambiarElementoAsignado = async (req, res, next) => {
  try {
    const { id, asignacionId } = req.params;
    const { nueva_serie_id, nuevo_lote_id, nueva_cantidad_lote } = req.body;

    const alquiler = await AlquilerModel.obtenerPorId(id);
    if (!alquiler) {
      throw new AppError('Alquiler no encontrado', 404);
    }

    if (alquiler.estado !== 'programado') {
      throw new AppError('Solo se pueden cambiar elementos en alquileres programados', 400);
    }

    const asignacionActual = await AlquilerElementoModel.obtenerPorId(asignacionId);
    if (!asignacionActual || asignacionActual.alquiler_id !== parseInt(id)) {
      throw new AppError('Asignación no encontrada en este alquiler', 404);
    }

    // Si es cambio de serie
    if (nueva_serie_id) {
      // Verificar que la nueva serie no esté en otro alquiler
      const enAlquiler = await AlquilerElementoModel.serieEnAlquilerActivo(nueva_serie_id);
      if (enAlquiler) {
        throw new AppError('La nueva serie ya está asignada a otro alquiler', 400);
      }

      // Eliminar asignación actual y crear nueva
      await AlquilerElementoModel.eliminar(asignacionId);
      await AlquilerElementoModel.asignarSerie({
        alquiler_id: id,
        elemento_id: asignacionActual.elemento_id,
        serie_id: nueva_serie_id,
        estado_salida: asignacionActual.estado_salida,
        ubicacion_original_id: asignacionActual.ubicacion_original_id
      });
    }

    // Si es cambio de lote
    if (nuevo_lote_id) {
      await AlquilerElementoModel.eliminar(asignacionId);
      await AlquilerElementoModel.asignarLote({
        alquiler_id: id,
        elemento_id: asignacionActual.elemento_id,
        lote_id: nuevo_lote_id,
        cantidad_lote: nueva_cantidad_lote || asignacionActual.cantidad_lote,
        estado_salida: asignacionActual.estado_salida,
        ubicacion_original_id: asignacionActual.ubicacion_original_id
      });
    }

    logger.info('alquilerController.cambiarElementoAsignado', 'Elemento cambiado', {
      alquilerId: id,
      asignacionId,
      nuevaSerie: nueva_serie_id,
      nuevoLote: nuevo_lote_id
    });

    const alquilerActualizado = await AlquilerModel.obtenerCompleto(id);

    res.json({
      success: true,
      mensaje: 'Elemento cambiado exitosamente',
      data: alquilerActualizado
    });
  } catch (error) {
    logger.error('alquilerController.cambiarElementoAsignado', error);
    next(error);
  }
};

// ============================================
// MARCAR SALIDA (activo)
// ============================================
exports.marcarSalida = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fecha_salida, notas_salida, elementos } = req.body;

    const alquiler = await AlquilerModel.obtenerPorId(id);
    if (!alquiler) {
      throw new AppError('Alquiler no encontrado', 404);
    }

    if (alquiler.estado !== 'programado') {
      throw new AppError('Solo se puede marcar salida en alquileres programados', 400);
    }

    // Si vienen elementos adicionales, asignarlos
    if (elementos && elementos.length > 0) {
      await AlquilerElementoModel.asignarMultiples(id, elementos);
    }

    // Obtener elementos asignados al alquiler
    const elementosAsignados = await AlquilerElementoModel.obtenerPorAlquiler(id);

    if (elementosAsignados.length === 0) {
      throw new AppError('El alquiler no tiene elementos asignados', 400);
    }

    // Obtener ubicación del evento desde la cotización
    const cotizacion = await CotizacionModel.obtenerPorId(alquiler.cotizacion_id);

    // Cambiar estado de SERIES y LOTES a 'alquilado'
    let seriesActualizadas = 0;
    let lotesMovidos = 0;

    for (const elem of elementosAsignados) {
      if (elem.serie_id) {
        // SERIES: Cambiar estado a 'alquilado' con ubicación del evento
        await SerieModel.cambiarEstado(
          elem.serie_id,
          'alquilado',
          cotizacion.evento_ciudad || null,
          null
        );
        seriesActualizadas++;
      }

      if (elem.lote_id && elem.cantidad_lote) {
        // LOTES: Mover cantidad a estado 'alquilado'
        const loteAlquiladoId = await LoteModel.moverParaAlquiler(
          elem.lote_id,
          elem.cantidad_lote,
          id
        );

        // Guardar referencia al lote alquilado para el retorno
        await AlquilerElementoModel.actualizarLoteAlquilado(elem.id, loteAlquiladoId);
        lotesMovidos++;
      }
    }

    await AlquilerModel.marcarActivo(id, {
      fecha_salida: fecha_salida || new Date(),
      notas_salida
    });

    logger.info('alquilerController.marcarSalida', 'Alquiler marcado como activo', {
      id,
      seriesActualizadas,
      lotesMovidos,
      totalElementos: elementosAsignados.length
    });

    const alquilerActualizado = await AlquilerModel.obtenerCompleto(id);

    res.json({
      success: true,
      mensaje: 'Salida registrada exitosamente',
      series_actualizadas: seriesActualizadas,
      lotes_movidos: lotesMovidos,
      data: alquilerActualizado
    });
  } catch (error) {
    logger.error('alquilerController.marcarSalida', error);
    next(error);
  }
};

// ============================================
// REGISTRAR RETORNO DE ELEMENTO
// ============================================
exports.registrarRetornoElemento = async (req, res, next) => {
  try {
    const { id, elementoId } = req.params;
    const { estado_retorno, costo_dano, notas_retorno } = req.body;

    const alquiler = await AlquilerModel.obtenerPorId(id);
    if (!alquiler) {
      throw new AppError('Alquiler no encontrado', 404);
    }

    if (alquiler.estado !== 'activo') {
      throw new AppError('Solo se pueden registrar retornos en alquileres activos', 400);
    }

    const estadosValidos = ['bueno', 'dañado', 'perdido'];
    if (!estadosValidos.includes(estado_retorno)) {
      throw new AppError(`Estado inválido. Valores: ${estadosValidos.join(', ')}`, 400);
    }

    // Obtener la asignación antes de registrar retorno
    const asignacion = await AlquilerElementoModel.obtenerPorId(elementoId);
    if (!asignacion) {
      throw new AppError('Asignación no encontrada', 404);
    }

    await AlquilerElementoModel.registrarRetorno(elementoId, {
      estado_retorno,
      costo_dano,
      notas_retorno
    });

    // Restaurar estado y ubicación de SERIES
    if (asignacion.serie_id) {
      let nuevoEstadoSerie = 'disponible';
      if (estado_retorno === 'dañado') {
        nuevoEstadoSerie = 'mantenimiento';
      } else if (estado_retorno === 'perdido') {
        nuevoEstadoSerie = 'baja';
      }

      await SerieModel.cambiarEstado(
        asignacion.serie_id,
        nuevoEstadoSerie,
        null,
        asignacion.ubicacion_original_id
      );

      logger.info('alquilerController.registrarRetornoElemento', 'Serie restaurada', {
        serieId: asignacion.serie_id,
        nuevoEstado: nuevoEstadoSerie,
        ubicacionOriginal: asignacion.ubicacion_original_id
      });
    }

    // Restaurar cantidad de LOTES
    if (asignacion.lote_alquilado_id && asignacion.cantidad_lote) {
      await LoteModel.retornarDeAlquiler(
        asignacion.lote_alquilado_id,
        asignacion.cantidad_lote,
        estado_retorno,
        asignacion.ubicacion_original_id,
        id
      );

      logger.info('alquilerController.registrarRetornoElemento', 'Lote retornado', {
        loteAlquiladoId: asignacion.lote_alquilado_id,
        cantidad: asignacion.cantidad_lote,
        estadoRetorno: estado_retorno
      });
    }

    // Actualizar costo de daños del alquiler
    await AlquilerModel.actualizarCostoDanos(id);

    const alquilerActualizado = await AlquilerModel.obtenerCompleto(id);

    res.json({
      success: true,
      mensaje: 'Retorno de elemento registrado',
      data: alquilerActualizado
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// MARCAR RETORNO (finalizado)
// ============================================
exports.marcarRetorno = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fecha_retorno_real, notas_retorno, retornos } = req.body;

    const alquiler = await AlquilerModel.obtenerCompleto(id);
    if (!alquiler) {
      throw new AppError('Alquiler no encontrado', 404);
    }

    if (alquiler.estado !== 'activo') {
      throw new AppError('Solo se puede marcar retorno en alquileres activos', 400);
    }

    // Registrar retornos individuales si vienen
    if (retornos && retornos.length > 0) {
      for (const retorno of retornos) {
        await AlquilerElementoModel.registrarRetorno(retorno.elemento_id, {
          estado_retorno: retorno.estado_retorno,
          costo_dano: retorno.costo_dano,
          notas_retorno: retorno.notas_retorno
        });
      }
    } else {
      // Si no vienen retornos específicos, marcar todos como 'bueno'
      await AlquilerElementoModel.registrarRetornoMasivo(id, 'bueno');
    }

    // Actualizar costo de daños
    await AlquilerModel.actualizarCostoDanos(id);

    // Obtener costo total de daños
    const totalDanos = await AlquilerElementoModel.calcularTotalDanos(id);

    await AlquilerModel.marcarFinalizado(id, {
      fecha_retorno_real: fecha_retorno_real || new Date(),
      costo_danos: totalDanos,
      notas_retorno
    });

    // TODO: Restaurar estado y ubicación de todos los elementos

    logger.info('alquilerController.marcarRetorno', 'Alquiler finalizado', {
      id,
      costo_danos: totalDanos
    });

    const alquilerActualizado = await AlquilerModel.obtenerCompleto(id);

    res.json({
      success: true,
      mensaje: 'Retorno registrado exitosamente',
      data: alquilerActualizado
    });
  } catch (error) {
    logger.error('alquilerController.marcarRetorno', error);
    next(error);
  }
};

// ============================================
// CANCELAR
// ============================================
exports.cancelar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notas } = req.body;

    const alquiler = await AlquilerModel.obtenerPorId(id);
    if (!alquiler) {
      throw new AppError('Alquiler no encontrado', 404);
    }

    if (alquiler.estado === 'finalizado') {
      throw new AppError('No se puede cancelar un alquiler ya finalizado', 400);
    }

    if (alquiler.estado === 'cancelado') {
      throw new AppError('El alquiler ya está cancelado', 400);
    }

    // Si tiene elementos asignados, liberarlos
    await AlquilerElementoModel.eliminarPorAlquiler(id);
    // TODO: Restaurar estado de elementos a disponible

    await AlquilerModel.cancelar(id, notas);

    logger.info('alquilerController.cancelar', 'Alquiler cancelado', { id });

    res.json({
      success: true,
      mensaje: 'Alquiler cancelado exitosamente'
    });
  } catch (error) {
    logger.error('alquilerController.cancelar', error);
    next(error);
  }
};

// ============================================
// OBTENER POR RANGO DE FECHAS
// ============================================
exports.obtenerPorRangoFechas = async (req, res, next) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    if (!fechaInicio || !fechaFin) {
      throw new AppError('Se requieren fechaInicio y fechaFin', 400);
    }

    const alquileres = await AlquilerModel.obtenerPorRangoFechas(fechaInicio, fechaFin);

    res.json({
      success: true,
      data: alquileres,
      total: alquileres.length
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// OBTENER ESTADÍSTICAS
// ============================================
exports.obtenerEstadisticas = async (req, res, next) => {
  try {
    const estadisticas = await AlquilerModel.obtenerEstadisticas();

    res.json({
      success: true,
      data: estadisticas
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// REPORTES COMPLETOS
// ============================================
exports.obtenerReportes = async (req, res, next) => {
  try {
    const [estadisticas, ingresosPorMes, topClientes, productosMasAlquilados, alquileresPorCiudad] = await Promise.all([
      AlquilerModel.obtenerEstadisticas(),
      AlquilerModel.obtenerIngresosPorMes(),
      AlquilerModel.obtenerTopClientes(10),
      AlquilerModel.obtenerProductosMasAlquilados(10),
      AlquilerModel.obtenerAlquileresPorCiudad(),
    ]);

    // Estadísticas de cotizaciones
    const CotizacionModel = require('../models/CotizacionModel');
    const cotizaciones = await CotizacionModel.obtenerTodas();
    const totalCotizaciones = cotizaciones.length;
    const aprobadas = cotizaciones.filter(c => c.estado === 'aprobada').length;
    const pendientes = cotizaciones.filter(c => c.estado === 'pendiente').length;
    const rechazadas = cotizaciones.filter(c => c.estado === 'rechazada').length;
    const vencidas = cotizaciones.filter(c => c.estado === 'vencida').length;
    const tasaConversion = totalCotizaciones > 0 ? Math.round((aprobadas / totalCotizaciones) * 100) : 0;

    res.json({
      success: true,
      data: {
        estadisticas,
        ingresosPorMes,
        topClientes,
        productosMasAlquilados,
        alquileresPorCiudad,
        cotizaciones: {
          total: totalCotizaciones,
          aprobadas,
          pendientes,
          rechazadas,
          vencidas,
          tasaConversion
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
