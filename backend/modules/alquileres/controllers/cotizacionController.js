// ============================================
// CONTROLADOR: Cotizacion
// Cotizaciones generadas para clientes
// ============================================

const CotizacionModel = require('../models/CotizacionModel');
const ClienteModel = require('../models/ClienteModel');
const ElementoCompuestoModel = require('../../productos/models/ElementoCompuestoModel');
const AlquilerModel = require('../models/AlquilerModel');
const AppError = require('../../../utils/AppError');
const logger = require('../../../utils/logger');

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
// OBTENER POR ID CON DETALLES
// ============================================
exports.obtenerPorIdConDetalles = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cotizacion = await CotizacionModel.obtenerPorIdConDetalles(id);

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
      compuesto_id,
      fecha_evento,
      fecha_fin_evento,
      evento_nombre,
      evento_direccion,
      evento_ciudad,
      subtotal,
      descuento,
      total,
      vigencia_dias,
      notas,
      detalles
    } = req.body;

    // Validaciones
    if (!cliente_id) {
      throw new AppError('El cliente es obligatorio', 400);
    }
    if (!compuesto_id) {
      throw new AppError('El producto es obligatorio', 400);
    }
    if (!fecha_evento) {
      throw new AppError('La fecha del evento es obligatoria', 400);
    }

    // Verificar que existan
    const cliente = await ClienteModel.obtenerPorId(cliente_id);
    if (!cliente) {
      throw new AppError('Cliente no encontrado', 404);
    }

    const producto = await ElementoCompuestoModel.obtenerPorId(compuesto_id);
    if (!producto) {
      throw new AppError('Producto no encontrado', 404);
    }

    logger.info('cotizacionController.crear', 'Creando cotización', {
      cliente: cliente.nombre,
      producto: producto.nombre
    });

    // Crear cotización
    const resultado = await CotizacionModel.crear({
      cliente_id,
      compuesto_id,
      fecha_evento,
      fecha_fin_evento,
      evento_nombre,
      evento_direccion,
      evento_ciudad,
      subtotal,
      descuento,
      total,
      vigencia_dias,
      notas
    });

    const cotizacionId = resultado.insertId;

    // Agregar detalles si vienen
    if (detalles && detalles.length > 0) {
      await CotizacionModel.agregarDetalles(cotizacionId, detalles);
    }

    const cotizacionCreada = await CotizacionModel.obtenerPorIdConDetalles(cotizacionId);

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
      fecha_evento,
      fecha_fin_evento,
      evento_nombre,
      evento_direccion,
      evento_ciudad,
      subtotal,
      descuento,
      total,
      vigencia_dias,
      notas,
      detalles
    } = req.body;

    const cotizacionExistente = await CotizacionModel.obtenerPorId(id);
    if (!cotizacionExistente) {
      throw new AppError('Cotización no encontrada', 404);
    }

    if (cotizacionExistente.estado !== 'pendiente') {
      throw new AppError('Solo se pueden editar cotizaciones pendientes', 400);
    }

    await CotizacionModel.actualizar(id, {
      fecha_evento,
      fecha_fin_evento,
      evento_nombre,
      evento_direccion,
      evento_ciudad,
      subtotal,
      descuento,
      total,
      vigencia_dias,
      notas
    });

    // Si vienen detalles, reemplazar
    if (detalles) {
      await CotizacionModel.eliminarDetalles(id);
      if (detalles.length > 0) {
        await CotizacionModel.agregarDetalles(id, detalles);
      }
    }

    const cotizacionActualizada = await CotizacionModel.obtenerPorIdConDetalles(id);

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
// APROBAR Y CREAR ALQUILER
// ============================================
exports.aprobarYCrearAlquiler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fecha_salida, fecha_retorno_esperado, deposito_cobrado, notas_salida } = req.body;

    const cotizacion = await CotizacionModel.obtenerPorId(id);
    if (!cotizacion) {
      throw new AppError('Cotización no encontrada', 404);
    }

    if (cotizacion.estado !== 'pendiente') {
      throw new AppError('Solo se pueden aprobar cotizaciones pendientes', 400);
    }

    // Verificar si ya tiene alquiler
    const tieneAlquiler = await CotizacionModel.tieneAlquiler(id);
    if (tieneAlquiler) {
      throw new AppError('Esta cotización ya tiene un alquiler asociado', 400);
    }

    // Aprobar cotización
    await CotizacionModel.actualizarEstado(id, 'aprobada');

    // Crear alquiler
    const resultadoAlquiler = await AlquilerModel.crear({
      cotizacion_id: id,
      fecha_salida: fecha_salida || cotizacion.fecha_evento,
      fecha_retorno_esperado: fecha_retorno_esperado || cotizacion.fecha_fin_evento,
      total: cotizacion.total,
      deposito_cobrado,
      notas_salida
    });

    const alquiler = await AlquilerModel.obtenerPorId(resultadoAlquiler.insertId);

    logger.info('cotizacionController.aprobarYCrearAlquiler', 'Cotización aprobada y alquiler creado', {
      cotizacionId: id,
      alquilerId: alquiler.id
    });

    res.json({
      success: true,
      mensaje: 'Cotización aprobada y alquiler creado exitosamente',
      data: alquiler
    });
  } catch (error) {
    logger.error('cotizacionController.aprobarYCrearAlquiler', error);
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
