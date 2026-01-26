// ============================================
// CONTROLADOR: Cotizacion
// Cotizaciones con múltiples productos y transporte
// ============================================

const CotizacionModel = require('../models/CotizacionModel');
const CotizacionProductoModel = require('../models/CotizacionProductoModel');
const CotizacionTransporteModel = require('../models/CotizacionTransporteModel');
const CotizacionProductoRecargoModel = require('../models/CotizacionProductoRecargoModel');
const ClienteModel = require('../models/ClienteModel');
const TarifaTransporteModel = require('../models/TarifaTransporteModel');
const AlquilerModel = require('../models/AlquilerModel');
const AlquilerElementoModel = require('../models/AlquilerElementoModel');
const DisponibilidadModel = require('../models/DisponibilidadModel');
const OrdenTrabajoModel = require('../../operaciones/models/OrdenTrabajoModel');
const EventoModel = require('../models/EventoModel');
const AppError = require('../../../utils/AppError');
const logger = require('../../../utils/logger');

// ============================================
// HELPER: Enriquecer transporte con precios
// ============================================
const enriquecerTransporteConPrecios = async (transporte) => {
  if (!transporte || transporte.length === 0) return [];

  const transporteConPrecios = await Promise.all(
    transporte.map(async (t) => {
      // Si ya tiene precio_unitario, usarlo
      if (t.precio_unitario !== undefined && t.precio_unitario !== null) {
        return t;
      }

      // Obtener precio de la tarifa
      const tarifa = await TarifaTransporteModel.obtenerPorId(t.tarifa_id);
      if (!tarifa) {
        throw new AppError(`Tarifa de transporte ${t.tarifa_id} no encontrada`, 404);
      }

      return {
        ...t,
        precio_unitario: tarifa.precio
      };
    })
  );

  return transporteConPrecios;
};

// ============================================
// OBTENER TODAS
// ============================================
exports.obtenerTodas = async (req, res, next) => {
  try {
    const cotizaciones = await CotizacionModel.obtenerTodas();
    res.json({
      success: true,
      data: cotizaciones,
      total: cotizaciones.length
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
    const estadosValidos = ['pendiente', 'aprobada', 'rechazada', 'vencida'];

    if (!estadosValidos.includes(estado)) {
      throw new AppError(`Estado inválido. Valores permitidos: ${estadosValidos.join(', ')}`, 400);
    }

    const cotizaciones = await CotizacionModel.obtenerPorEstado(estado);
    res.json({
      success: true,
      data: cotizaciones,
      total: cotizaciones.length
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
    const cotizacion = await CotizacionModel.obtenerPorId(id);

    if (!cotizacion) {
      throw new AppError('Cotización no encontrada', 404);
    }

    res.json({
      success: true,
      data: cotizacion
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// OBTENER COMPLETA (productos + transporte)
// ============================================
exports.obtenerCompleta = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cotizacion = await CotizacionModel.obtenerCompleta(id);

    if (!cotizacion) {
      throw new AppError('Cotización no encontrada', 404);
    }

    res.json({
      success: true,
      data: cotizacion
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// CREAR
// ============================================
exports.crear = async (req, res, next) => {
  try {
    const {
      cliente_id,
      evento_id,
      fecha_montaje,
      fecha_evento,
      fecha_desmontaje,
      evento_nombre,
      evento_direccion,
      evento_ciudad,
      descuento,
      vigencia_dias,
      notas,
      productos,
      transporte
    } = req.body;

    // Validaciones
    if (!cliente_id) {
      throw new AppError('El cliente es obligatorio', 400);
    }
    if (!fecha_evento) {
      throw new AppError('La fecha del evento es obligatoria', 400);
    }
    if (!productos || productos.length === 0) {
      throw new AppError('Debe agregar al menos un producto', 400);
    }

    // Verificar cliente
    const cliente = await ClienteModel.obtenerPorId(cliente_id);
    if (!cliente) {
      throw new AppError('Cliente no encontrado', 404);
    }

    // Si viene evento_id, verificar que existe y pertenece al cliente
    if (evento_id) {
      const evento = await EventoModel.obtenerPorId(evento_id);
      if (!evento) {
        throw new AppError('Evento no encontrado', 404);
      }
      if (evento.cliente_id !== cliente_id) {
        throw new AppError('El evento no pertenece al cliente seleccionado', 400);
      }
    }

    logger.info('cotizacionController.crear', 'Creando cotización', {
      cliente: cliente.nombre,
      productos: productos.length,
      evento_id: evento_id || null
    });

    // Crear cotización (sin totales, se calcularán después)
    const resultado = await CotizacionModel.crear({
      cliente_id,
      evento_id: evento_id || null,
      fecha_montaje,
      fecha_evento,
      fecha_desmontaje,
      evento_nombre,
      evento_direccion,
      evento_ciudad,
      subtotal: 0,
      descuento: descuento || 0,
      total: 0,
      vigencia_dias,
      notas
    });

    const cotizacionId = resultado.insertId;

    // Agregar productos (ahora soporta recargos en cada producto)
    for (const producto of productos) {
      const resultadoProducto = await CotizacionProductoModel.agregar({
        cotizacion_id: cotizacionId,
        compuesto_id: producto.compuesto_id,
        cantidad: producto.cantidad,
        precio_base: producto.precio_base,
        deposito: producto.deposito,
        precio_adicionales: producto.precio_adicionales,
        notas: producto.notas
      });

      // Si el producto tiene recargos, agregarlos
      if (producto.recargos && producto.recargos.length > 0) {
        for (const recargo of producto.recargos) {
          await CotizacionProductoRecargoModel.agregar({
            cotizacion_producto_id: resultadoProducto.insertId,
            tipo: recargo.tipo,
            dias: recargo.dias,
            porcentaje: recargo.porcentaje,
            fecha_original: recargo.fecha_original,
            fecha_modificada: recargo.fecha_modificada,
            notas: recargo.notas
          });
        }
      }
    }

    // Agregar transporte si viene (enriquecer con precios)
    if (transporte && transporte.length > 0) {
      const transporteConPrecios = await enriquecerTransporteConPrecios(transporte);
      await CotizacionTransporteModel.agregarMultiples(cotizacionId, transporteConPrecios);
    }

    // Recalcular totales
    await CotizacionModel.recalcularTotales(cotizacionId);

    const cotizacionCreada = await CotizacionModel.obtenerCompleta(cotizacionId);

    res.status(201).json({
      success: true,
      mensaje: 'Cotización creada exitosamente',
      data: cotizacionCreada
    });
  } catch (error) {
    logger.error('cotizacionController.crear', error);
    next(error);
  }
};

// ============================================
// ACTUALIZAR
// ============================================
exports.actualizar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      fecha_montaje,
      fecha_evento,
      fecha_desmontaje,
      evento_nombre,
      evento_direccion,
      evento_ciudad,
      descuento,
      vigencia_dias,
      notas,
      productos,
      transporte
    } = req.body;

    const cotizacionExistente = await CotizacionModel.obtenerPorId(id);
    if (!cotizacionExistente) {
      throw new AppError('Cotización no encontrada', 404);
    }

    if (cotizacionExistente.estado !== 'pendiente') {
      throw new AppError('Solo se pueden editar cotizaciones pendientes', 400);
    }

    // Actualizar datos generales
    await CotizacionModel.actualizar(id, {
      fecha_montaje: fecha_montaje || cotizacionExistente.fecha_montaje,
      fecha_evento: fecha_evento || cotizacionExistente.fecha_evento,
      fecha_desmontaje: fecha_desmontaje || cotizacionExistente.fecha_desmontaje,
      evento_nombre,
      evento_direccion,
      evento_ciudad,
      subtotal: cotizacionExistente.subtotal,
      descuento: descuento !== undefined ? descuento : cotizacionExistente.descuento,
      total: cotizacionExistente.total,
      vigencia_dias,
      notas
    });

    // Si vienen productos, reemplazar
    if (productos) {
      await CotizacionProductoModel.eliminarPorCotizacion(id);
      if (productos.length > 0) {
        await CotizacionProductoModel.agregarMultiples(id, productos);
      }
    }

    // Si viene transporte, reemplazar (enriquecer con precios)
    if (transporte) {
      await CotizacionTransporteModel.eliminarPorCotizacion(id);
      if (transporte.length > 0) {
        const transporteConPrecios = await enriquecerTransporteConPrecios(transporte);
        await CotizacionTransporteModel.agregarMultiples(id, transporteConPrecios);
      }
    }

    // Recalcular totales
    await CotizacionModel.recalcularTotales(id);

    const cotizacionActualizada = await CotizacionModel.obtenerCompleta(id);

    res.json({
      success: true,
      mensaje: 'Cotización actualizada exitosamente',
      data: cotizacionActualizada
    });
  } catch (error) {
    logger.error('cotizacionController.actualizar', error);
    next(error);
  }
};

// ============================================
// AGREGAR PRODUCTO
// ============================================
exports.agregarProducto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { compuesto_id, cantidad, precio_base, deposito, precio_adicionales, notas } = req.body;

    const cotizacion = await CotizacionModel.obtenerPorId(id);
    if (!cotizacion) {
      throw new AppError('Cotización no encontrada', 404);
    }

    if (cotizacion.estado !== 'pendiente') {
      throw new AppError('Solo se pueden modificar cotizaciones pendientes', 400);
    }

    await CotizacionProductoModel.agregar({
      cotizacion_id: id,
      compuesto_id,
      cantidad,
      precio_base,
      deposito,
      precio_adicionales,
      notas
    });

    await CotizacionModel.recalcularTotales(id);
    const cotizacionActualizada = await CotizacionModel.obtenerCompleta(id);

    res.json({
      success: true,
      mensaje: 'Producto agregado exitosamente',
      data: cotizacionActualizada
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// ELIMINAR PRODUCTO
// ============================================
exports.eliminarProducto = async (req, res, next) => {
  try {
    const { id, productoId } = req.params;

    const cotizacion = await CotizacionModel.obtenerPorId(id);
    if (!cotizacion) {
      throw new AppError('Cotización no encontrada', 404);
    }

    if (cotizacion.estado !== 'pendiente') {
      throw new AppError('Solo se pueden modificar cotizaciones pendientes', 400);
    }

    await CotizacionProductoModel.eliminar(productoId);
    await CotizacionModel.recalcularTotales(id);

    const cotizacionActualizada = await CotizacionModel.obtenerCompleta(id);

    res.json({
      success: true,
      mensaje: 'Producto eliminado exitosamente',
      data: cotizacionActualizada
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// AGREGAR TRANSPORTE
// ============================================
exports.agregarTransporte = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tarifa_id, cantidad, notas } = req.body;

    const cotizacion = await CotizacionModel.obtenerPorId(id);
    if (!cotizacion) {
      throw new AppError('Cotización no encontrada', 404);
    }

    if (cotizacion.estado !== 'pendiente') {
      throw new AppError('Solo se pueden modificar cotizaciones pendientes', 400);
    }

    // Obtener precio de la tarifa
    const tarifa = await TarifaTransporteModel.obtenerPorId(tarifa_id);
    if (!tarifa) {
      throw new AppError('Tarifa no encontrada', 404);
    }

    await CotizacionTransporteModel.agregar({
      cotizacion_id: id,
      tarifa_id,
      cantidad,
      precio_unitario: tarifa.precio,
      notas
    });

    await CotizacionModel.recalcularTotales(id);
    const cotizacionActualizada = await CotizacionModel.obtenerCompleta(id);

    res.json({
      success: true,
      mensaje: 'Transporte agregado exitosamente',
      data: cotizacionActualizada
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// ELIMINAR TRANSPORTE
// ============================================
exports.eliminarTransporte = async (req, res, next) => {
  try {
    const { id, transporteId } = req.params;

    const cotizacion = await CotizacionModel.obtenerPorId(id);
    if (!cotizacion) {
      throw new AppError('Cotización no encontrada', 404);
    }

    if (cotizacion.estado !== 'pendiente') {
      throw new AppError('Solo se pueden modificar cotizaciones pendientes', 400);
    }

    await CotizacionTransporteModel.eliminar(transporteId);
    await CotizacionModel.recalcularTotales(id);

    const cotizacionActualizada = await CotizacionModel.obtenerCompleta(id);

    res.json({
      success: true,
      mensaje: 'Transporte eliminado exitosamente',
      data: cotizacionActualizada
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// CAMBIAR ESTADO
// ============================================
exports.cambiarEstado = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const estadosValidos = ['pendiente', 'aprobada', 'rechazada', 'vencida'];
    if (!estadosValidos.includes(estado)) {
      throw new AppError(`Estado inválido. Valores permitidos: ${estadosValidos.join(', ')}`, 400);
    }

    const cotizacion = await CotizacionModel.obtenerPorId(id);
    if (!cotizacion) {
      throw new AppError('Cotización no encontrada', 404);
    }

    await CotizacionModel.actualizarEstado(id, estado);

    logger.info('cotizacionController.cambiarEstado', 'Estado actualizado', {
      id,
      estadoAnterior: cotizacion.estado,
      estadoNuevo: estado
    });

    res.json({
      success: true,
      mensaje: `Cotización marcada como ${estado}`,
      data: { id, estado }
    });
  } catch (error) {
    logger.error('cotizacionController.cambiarEstado', error);
    next(error);
  }
};

// ============================================
// VERIFICAR DISPONIBILIDAD
// ============================================
exports.verificarDisponibilidad = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fecha_inicio, fecha_fin } = req.query;

    const cotizacion = await CotizacionModel.obtenerPorId(id);
    if (!cotizacion) {
      throw new AppError('Cotización no encontrada', 404);
    }

    // Usar fechas del query o de la cotización (montaje a desmontaje)
    const fechaInicio = fecha_inicio || cotizacion.fecha_montaje || cotizacion.fecha_evento;
    const fechaFin = fecha_fin || cotizacion.fecha_desmontaje || cotizacion.fecha_evento;

    const disponibilidad = await DisponibilidadModel.verificarDisponibilidadCotizacion(
      id,
      fechaInicio,
      fechaFin
    );

    res.json({
      success: true,
      data: disponibilidad
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// APROBAR Y CREAR ALQUILER
// ============================================
exports.aprobarYCrearAlquiler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fecha_salida, fecha_retorno_esperado, deposito_cobrado, notas_salida, forzar } = req.body;

    const cotizacion = await CotizacionModel.obtenerCompleta(id);
    if (!cotizacion) {
      throw new AppError('Cotización no encontrada', 404);
    }

    if (cotizacion.estado !== 'pendiente') {
      throw new AppError('Solo se pueden aprobar cotizaciones pendientes', 400);
    }

    if (!cotizacion.productos || cotizacion.productos.length === 0) {
      throw new AppError('La cotización no tiene productos', 400);
    }

    // Verificar si ya tiene alquiler
    const tieneAlquiler = await CotizacionModel.tieneAlquiler(id);
    if (tieneAlquiler) {
      throw new AppError('Esta cotización ya tiene un alquiler asociado', 400);
    }

    // Determinar fechas del alquiler (usar montaje como salida y desmontaje como retorno)
    const fechaSalida = fecha_salida || cotizacion.fecha_montaje || cotizacion.fecha_evento;
    const fechaRetorno = fecha_retorno_esperado || cotizacion.fecha_desmontaje || cotizacion.fecha_evento;

    // Verificar disponibilidad de elementos
    const disponibilidad = await DisponibilidadModel.verificarDisponibilidadCotizacion(
      id,
      fechaSalida,
      fechaRetorno
    );

    // Si hay problemas de disponibilidad
    if (disponibilidad.hay_problemas) {
      const elementosFaltantes = disponibilidad.elementos
        .filter(e => e.estado === 'insuficiente')
        .map(e => `${e.elemento_nombre}: necesita ${e.cantidad_requerida}, disponibles ${e.disponibles} (faltan ${e.faltantes})`);

      // Si no se forzó la aprobación, alertar
      if (!forzar) {
        return res.status(409).json({
          success: false,
          mensaje: 'Hay elementos insuficientes para esta fecha',
          advertencia: true,
          disponibilidad: disponibilidad,
          elementos_faltantes: elementosFaltantes,
          accion_requerida: 'Envía forzar: true para aprobar de todas formas'
        });
      }

      // Si se forzó, registrar advertencia
      logger.warn('cotizacionController.aprobarYCrearAlquiler', 'Aprobación forzada con elementos insuficientes', {
        cotizacionId: id,
        elementosFaltantes
      });
    }

    // Aprobar cotización
    await CotizacionModel.actualizarEstado(id, 'aprobada');

    // Crear alquiler con fechas de la cotización
    const resultadoAlquiler = await AlquilerModel.crear({
      cotizacion_id: id,
      fecha_salida: fechaSalida,
      fecha_retorno_esperado: fechaRetorno,
      total: cotizacion.total,
      deposito_cobrado,
      notas_salida
    });

    const alquilerId = resultadoAlquiler.insertId;

    // Asignar elementos automáticamente
    const asignacion = await DisponibilidadModel.asignarAutomaticamente(
      id,
      fechaSalida,
      fechaRetorno
    );

    // Guardar asignaciones en alquiler_elementos
    if (asignacion.asignaciones.length > 0) {
      await AlquilerElementoModel.asignarMultiples(alquilerId, asignacion.asignaciones);
    }

    // =============================================
    // CREAR ÓRDENES DE TRABAJO (montaje y desmontaje)
    // =============================================
    let ordenesTrabajo = null;
    try {
      ordenesTrabajo = await OrdenTrabajoModel.crearDesdeAlquiler(alquilerId, {
        montaje: {
          fecha: fechaSalida,
          notas: `Montaje para evento: ${cotizacion.evento_nombre || 'Sin nombre'}`,
          prioridad: 'normal'
        },
        desmontaje: {
          fecha: fechaRetorno,
          notas: `Desmontaje para evento: ${cotizacion.evento_nombre || 'Sin nombre'}`,
          prioridad: 'normal'
        },
        elementos: asignacion.asignaciones.map(a => ({
          elemento_id: a.elemento_id,
          serie_id: a.serie_id || null,
          lote_id: a.lote_id || null,
          cantidad: a.cantidad_lote || 1
        })),
        creado_por: req.usuario?.id || null
      });

      logger.info('cotizacionController.aprobarYCrearAlquiler', 'Órdenes de trabajo creadas', {
        alquilerId,
        montajeId: ordenesTrabajo.montaje.id,
        desmontajeId: ordenesTrabajo.desmontaje.id
      });
    } catch (ordenError) {
      // Si falla la creación de órdenes, solo loguear advertencia pero no fallar el proceso
      logger.warn('cotizacionController.aprobarYCrearAlquiler', 'No se pudieron crear órdenes de trabajo', {
        alquilerId,
        error: ordenError.message
      });
    }

    const alquiler = await AlquilerModel.obtenerCompleto(alquilerId);

    logger.info('cotizacionController.aprobarYCrearAlquiler', 'Cotización aprobada y alquiler creado', {
      cotizacionId: id,
      alquilerId: alquiler.id,
      elementosAsignados: asignacion.asignaciones.length,
      conAdvertencias: asignacion.hay_advertencias,
      ordenesCreadas: ordenesTrabajo ? true : false
    });

    res.json({
      success: true,
      mensaje: asignacion.hay_advertencias
        ? 'Cotización aprobada con advertencias de disponibilidad'
        : 'Cotización aprobada y alquiler creado exitosamente',
      advertencia: asignacion.hay_advertencias,
      elementos_asignados: asignacion.asignaciones.length,
      advertencias: asignacion.hay_advertencias ? asignacion.advertencias : undefined,
      ordenes_trabajo: ordenesTrabajo ? {
        montaje_id: ordenesTrabajo.montaje.id,
        desmontaje_id: ordenesTrabajo.desmontaje.id
      } : null,
      data: alquiler
    });
  } catch (error) {
    logger.error('cotizacionController.aprobarYCrearAlquiler', error);
    next(error);
  }
};

// ============================================
// DUPLICAR
// ============================================
exports.duplicar = async (req, res, next) => {
  try {
    const { id } = req.params;

    const cotizacion = await CotizacionModel.obtenerPorId(id);
    if (!cotizacion) {
      throw new AppError('Cotización no encontrada', 404);
    }

    const nuevaCotizacionId = await CotizacionModel.duplicar(id);
    const cotizacionDuplicada = await CotizacionModel.obtenerCompleta(nuevaCotizacionId);

    logger.info('cotizacionController.duplicar', 'Cotización duplicada', {
      original: id,
      nueva: nuevaCotizacionId
    });

    res.status(201).json({
      success: true,
      mensaje: 'Cotización duplicada exitosamente',
      data: cotizacionDuplicada
    });
  } catch (error) {
    logger.error('cotizacionController.duplicar', error);
    next(error);
  }
};

// ============================================
// ELIMINAR
// ============================================
exports.eliminar = async (req, res, next) => {
  try {
    const { id } = req.params;

    const cotizacion = await CotizacionModel.obtenerPorId(id);
    if (!cotizacion) {
      throw new AppError('Cotización no encontrada', 404);
    }

    const tieneAlquiler = await CotizacionModel.tieneAlquiler(id);
    if (tieneAlquiler) {
      throw new AppError('No se puede eliminar una cotización que tiene alquiler asociado', 400);
    }

    await CotizacionModel.eliminar(id);

    res.json({
      success: true,
      mensaje: 'Cotización eliminada exitosamente'
    });
  } catch (error) {
    logger.error('cotizacionController.eliminar', error);
    next(error);
  }
};

// ============================================
// OBTENER POR CLIENTE
// ============================================
exports.obtenerPorCliente = async (req, res, next) => {
  try {
    const { clienteId } = req.params;

    const cliente = await ClienteModel.obtenerPorId(clienteId);
    if (!cliente) {
      throw new AppError('Cliente no encontrado', 404);
    }

    const cotizaciones = await CotizacionModel.obtenerPorCliente(clienteId);

    res.json({
      success: true,
      data: cotizaciones,
      total: cotizaciones.length
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// AGREGAR RECARGO A PRODUCTO
// ============================================
exports.agregarRecargoProducto = async (req, res, next) => {
  try {
    const { id, productoId } = req.params;
    const { tipo, dias, porcentaje, fecha_original, fecha_modificada, notas } = req.body;

    // Validar cotización
    const cotizacion = await CotizacionModel.obtenerPorId(id);
    if (!cotizacion) {
      throw new AppError('Cotización no encontrada', 404);
    }

    if (cotizacion.estado !== 'pendiente') {
      throw new AppError('Solo se pueden modificar cotizaciones pendientes', 400);
    }

    // Validar producto
    const producto = await CotizacionProductoModel.obtenerPorId(productoId);
    if (!producto || producto.cotizacion_id !== parseInt(id)) {
      throw new AppError('Producto no encontrado en esta cotización', 404);
    }

    // Validar tipo de recargo
    if (!['adelanto', 'extension'].includes(tipo)) {
      throw new AppError('Tipo de recargo inválido. Valores permitidos: adelanto, extension', 400);
    }

    // Validar días y porcentaje
    if (!dias || dias < 1) {
      throw new AppError('Los días deben ser al menos 1', 400);
    }
    if (!porcentaje || porcentaje <= 0) {
      throw new AppError('El porcentaje debe ser mayor a 0', 400);
    }

    // Agregar recargo
    const recargo = await CotizacionProductoRecargoModel.agregar({
      cotizacion_producto_id: productoId,
      tipo,
      dias,
      porcentaje,
      fecha_original,
      fecha_modificada,
      notas
    });

    // Recalcular totales de la cotización
    await CotizacionModel.recalcularTotales(id);

    const cotizacionActualizada = await CotizacionModel.obtenerCompleta(id);

    logger.info('cotizacionController.agregarRecargoProducto', 'Recargo agregado', {
      cotizacionId: id,
      productoId,
      tipo,
      monto: recargo.monto_recargo
    });

    res.json({
      success: true,
      mensaje: `Recargo de ${tipo} agregado exitosamente`,
      data: cotizacionActualizada
    });
  } catch (error) {
    logger.error('cotizacionController.agregarRecargoProducto', error);
    next(error);
  }
};

// ============================================
// ACTUALIZAR RECARGO DE PRODUCTO
// ============================================
exports.actualizarRecargoProducto = async (req, res, next) => {
  try {
    const { id, productoId, recargoId } = req.params;
    const { dias, porcentaje, fecha_modificada, notas } = req.body;

    // Validar cotización
    const cotizacion = await CotizacionModel.obtenerPorId(id);
    if (!cotizacion) {
      throw new AppError('Cotización no encontrada', 404);
    }

    if (cotizacion.estado !== 'pendiente') {
      throw new AppError('Solo se pueden modificar cotizaciones pendientes', 400);
    }

    // Validar recargo
    const recargo = await CotizacionProductoRecargoModel.obtenerPorId(recargoId);
    if (!recargo || recargo.cotizacion_producto_id !== parseInt(productoId)) {
      throw new AppError('Recargo no encontrado', 404);
    }

    // Actualizar recargo
    await CotizacionProductoRecargoModel.actualizar(recargoId, {
      dias,
      porcentaje,
      fecha_modificada,
      notas
    });

    // Recalcular totales
    await CotizacionModel.recalcularTotales(id);

    const cotizacionActualizada = await CotizacionModel.obtenerCompleta(id);

    res.json({
      success: true,
      mensaje: 'Recargo actualizado exitosamente',
      data: cotizacionActualizada
    });
  } catch (error) {
    logger.error('cotizacionController.actualizarRecargoProducto', error);
    next(error);
  }
};

// ============================================
// ELIMINAR RECARGO DE PRODUCTO
// ============================================
exports.eliminarRecargoProducto = async (req, res, next) => {
  try {
    const { id, productoId, recargoId } = req.params;

    // Validar cotización
    const cotizacion = await CotizacionModel.obtenerPorId(id);
    if (!cotizacion) {
      throw new AppError('Cotización no encontrada', 404);
    }

    if (cotizacion.estado !== 'pendiente') {
      throw new AppError('Solo se pueden modificar cotizaciones pendientes', 400);
    }

    // Validar recargo
    const recargo = await CotizacionProductoRecargoModel.obtenerPorId(recargoId);
    if (!recargo || recargo.cotizacion_producto_id !== parseInt(productoId)) {
      throw new AppError('Recargo no encontrado', 404);
    }

    // Eliminar recargo
    await CotizacionProductoRecargoModel.eliminar(recargoId);

    // Recalcular totales
    await CotizacionModel.recalcularTotales(id);

    const cotizacionActualizada = await CotizacionModel.obtenerCompleta(id);

    logger.info('cotizacionController.eliminarRecargoProducto', 'Recargo eliminado', {
      cotizacionId: id,
      productoId,
      recargoId
    });

    res.json({
      success: true,
      mensaje: 'Recargo eliminado exitosamente',
      data: cotizacionActualizada
    });
  } catch (error) {
    logger.error('cotizacionController.eliminarRecargoProducto', error);
    next(error);
  }
};

// ============================================
// OBTENER RECARGOS DE UN PRODUCTO
// ============================================
exports.obtenerRecargosProducto = async (req, res, next) => {
  try {
    const { id, productoId } = req.params;

    // Validar cotización
    const cotizacion = await CotizacionModel.obtenerPorId(id);
    if (!cotizacion) {
      throw new AppError('Cotización no encontrada', 404);
    }

    // Validar producto
    const producto = await CotizacionProductoModel.obtenerPorId(productoId);
    if (!producto || producto.cotizacion_id !== parseInt(id)) {
      throw new AppError('Producto no encontrado en esta cotización', 404);
    }

    const recargos = await CotizacionProductoRecargoModel.obtenerPorProducto(productoId);

    res.json({
      success: true,
      data: recargos,
      total: recargos.length
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// ASIGNAR COTIZACIÓN A EVENTO
// ============================================
exports.asignarEvento = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { evento_id } = req.body;

    const cotizacion = await CotizacionModel.obtenerPorId(id);
    if (!cotizacion) {
      throw new AppError('Cotización no encontrada', 404);
    }

    if (evento_id) {
      const evento = await EventoModel.obtenerPorId(evento_id);
      if (!evento) {
        throw new AppError('Evento no encontrado', 404);
      }
      if (evento.cliente_id !== cotizacion.cliente_id) {
        throw new AppError('El evento no pertenece al mismo cliente de la cotización', 400);
      }
    }

    await CotizacionModel.asignarEvento(id, evento_id);

    const cotizacionActualizada = await CotizacionModel.obtenerCompleta(id);

    res.json({
      success: true,
      mensaje: evento_id ? 'Cotización asignada al evento' : 'Cotización desvinculada del evento',
      data: cotizacionActualizada
    });
  } catch (error) {
    logger.error('cotizacionController.asignarEvento', error);
    next(error);
  }
};
