// ============================================
// CONTROLADOR: Evento
// Eventos para cotizaciones
// ============================================

const EventoModel = require('../models/EventoModel');
const ClienteModel = require('../../clientes/models/ClienteModel');
const CotizacionModel = require('../models/CotizacionModel');
const CotizacionProductoModel = require('../models/CotizacionProductoModel');
const NovedadModel = require('../../operaciones/models/NovedadModel');
const AppError = require('../../../utils/AppError');
const logger = require('../../../utils/logger');

// ============================================
// OBTENER TODOS
// ============================================
exports.obtenerTodos = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const eventos = await EventoModel.obtenerTodos(tenantId);
    res.json({
      success: true,
      data: eventos,
      total: eventos.length
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
    const tenantId = req.tenant.id;
    const { id } = req.params;
    const evento = await EventoModel.obtenerPorId(tenantId, id);

    if (!evento) {
      throw new AppError('Evento no encontrado', 404);
    }

    // Enriquecer con información de si se pueden agregar cotizaciones
    const puedeAgregar = await EventoModel.puedeAgregarCotizaciones(tenantId, id);
    evento.puede_agregar_cotizaciones = puedeAgregar;

    res.json({
      success: true,
      data: evento
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// OBTENER POR CLIENTE
// ============================================
exports.obtenerPorCliente = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const { clienteId } = req.params;
    const eventos = await EventoModel.obtenerPorCliente(tenantId, clienteId);

    res.json({
      success: true,
      data: eventos,
      total: eventos.length
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
    const tenantId = req.tenant.id;
    const { estado } = req.params;
    const estadosValidos = ['activo', 'completado', 'cancelado'];

    if (!estadosValidos.includes(estado)) {
      throw new AppError(`Estado inválido. Valores permitidos: ${estadosValidos.join(', ')}`, 400);
    }

    const eventos = await EventoModel.obtenerPorEstado(tenantId, estado);
    res.json({
      success: true,
      data: eventos,
      total: eventos.length
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
    const tenantId = req.tenant.id;
    const { cliente_id, nombre, descripcion, fecha_inicio, fecha_fin, direccion, ciudad_id, notas } = req.body;

    // Validaciones
    if (!cliente_id) {
      throw new AppError('El cliente es requerido', 400);
    }

    if (!nombre) {
      throw new AppError('El nombre del evento es requerido', 400);
    }

    if (!fecha_inicio) {
      throw new AppError('La fecha de inicio es requerida', 400);
    }

    // Verificar que el cliente existe
    const cliente = await ClienteModel.obtenerPorId(tenantId, cliente_id);
    if (!cliente) {
      throw new AppError('Cliente no encontrado', 404);
    }

    const resultado = await EventoModel.crear(tenantId, {
      cliente_id,
      nombre,
      descripcion,
      fecha_inicio,
      fecha_fin,
      direccion,
      ciudad_id,
      notas
    });

    const eventoCreado = await EventoModel.obtenerPorId(tenantId, resultado.insertId);

    res.status(201).json({
      success: true,
      message: 'Evento creado correctamente',
      data: eventoCreado
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// ACTUALIZAR
// ============================================
exports.actualizar = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const { id } = req.params;
    const { nombre, descripcion, fecha_inicio, fecha_fin, direccion, ciudad_id, notas, estado } = req.body;

    const eventoExistente = await EventoModel.obtenerPorId(tenantId, id);
    if (!eventoExistente) {
      throw new AppError('Evento no encontrado', 404);
    }

    await EventoModel.actualizar(tenantId, id, {
      nombre: nombre || eventoExistente.nombre,
      descripcion: descripcion !== undefined ? descripcion : eventoExistente.descripcion,
      fecha_inicio: fecha_inicio || eventoExistente.fecha_inicio,
      fecha_fin: fecha_fin || eventoExistente.fecha_fin,
      direccion: direccion !== undefined ? direccion : eventoExistente.direccion,
      ciudad_id: ciudad_id !== undefined ? ciudad_id : eventoExistente.ciudad_id,
      notas: notas !== undefined ? notas : eventoExistente.notas,
      estado
    });

    const eventoActualizado = await EventoModel.obtenerPorId(tenantId, id);

    res.json({
      success: true,
      message: 'Evento actualizado correctamente',
      data: eventoActualizado
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
    const tenantId = req.tenant.id;
    const { id } = req.params;
    const { estado } = req.body;

    const estadosValidos = ['activo', 'completado', 'cancelado'];
    if (!estadosValidos.includes(estado)) {
      throw new AppError(`Estado inválido. Valores permitidos: ${estadosValidos.join(', ')}`, 400);
    }

    const evento = await EventoModel.obtenerPorId(tenantId, id);
    if (!evento) {
      throw new AppError('Evento no encontrado', 404);
    }

    await EventoModel.cambiarEstado(tenantId, id, estado);

    res.json({
      success: true,
      message: `Estado cambiado a ${estado}`
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// ELIMINAR
// ============================================
exports.eliminar = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const { id } = req.params;

    const evento = await EventoModel.obtenerPorId(tenantId, id);
    if (!evento) {
      throw new AppError('Evento no encontrado', 404);
    }

    // Verificar si tiene cotizaciones
    const tieneCotizaciones = await EventoModel.tieneCotizaciones(tenantId, id);
    if (tieneCotizaciones) {
      throw new AppError('No se puede eliminar un evento con cotizaciones asociadas', 400);
    }

    await EventoModel.eliminar(tenantId, id);

    res.json({
      success: true,
      message: 'Evento eliminado correctamente'
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// OBTENER COTIZACIONES DEL EVENTO
// ============================================
exports.obtenerCotizaciones = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const { id } = req.params;

    const evento = await EventoModel.obtenerPorId(tenantId, id);
    if (!evento) {
      throw new AppError('Evento no encontrado', 404);
    }

    const cotizaciones = await EventoModel.obtenerCotizaciones(tenantId, id);

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
// VERIFICAR SI SE PUEDEN AGREGAR COTIZACIONES
// ============================================
exports.puedeAgregarCotizacion = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const { id } = req.params;

    const resultado = await EventoModel.puedeAgregarCotizaciones(tenantId, id);

    res.json({
      success: true,
      data: resultado
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// REPETIR EVENTO
// Crea nuevo evento con nuevas fechas y cotización
// con los mismos productos aprobados del original
// ============================================
exports.repetir = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const { id } = req.params;
    const { fecha_inicio, fecha_fin } = req.body;

    if (!fecha_inicio) {
      throw new AppError('La fecha de inicio es requerida', 400);
    }

    // Obtener evento original
    const eventoOriginal = await EventoModel.obtenerPorId(tenantId, id);
    if (!eventoOriginal) {
      throw new AppError('Evento original no encontrado', 404);
    }

    // Crear nuevo evento con mismos datos pero nuevas fechas
    const resultadoEvento = await EventoModel.crear(tenantId, {
      cliente_id: eventoOriginal.cliente_id,
      nombre: eventoOriginal.nombre,
      descripcion: eventoOriginal.descripcion,
      fecha_inicio,
      fecha_fin: fecha_fin || fecha_inicio,
      direccion: eventoOriginal.direccion,
      ciudad_id: eventoOriginal.ciudad_id,
      notas: eventoOriginal.notas
    });

    const nuevoEventoId = resultadoEvento.insertId;

    // Obtener productos de cotizaciones aprobadas del evento original
    // MySQL DECIMAL retorna strings, convertir a números para evitar NaN en cálculos
    const productosOriginales = (await EventoModel.obtenerProductosAprobados(tenantId, id)).map(p => ({
      ...p,
      cantidad: parseInt(p.cantidad) || 1,
      precio_base: parseFloat(p.precio_base) || 0,
      deposito: parseFloat(p.deposito) || 0,
      precio_adicionales: parseFloat(p.precio_adicionales) || 0
    }));

    let cotizacionId = null;

    if (productosOriginales.length > 0) {
      // Crear cotización para el nuevo evento
      const resultadoCotizacion = await CotizacionModel.crear(tenantId, {
        cliente_id: eventoOriginal.cliente_id,
        evento_id: nuevoEventoId,
        fecha_evento: fecha_inicio,
        fecha_montaje: fecha_inicio,
        fecha_desmontaje: fecha_fin || fecha_inicio,
        evento_nombre: eventoOriginal.nombre,
        evento_direccion: eventoOriginal.direccion,
        evento_ciudad: eventoOriginal.ciudad_nombre,
        subtotal: 0,
        descuento: 0,
        total: 0,
        notas: `Repetición del evento original #${id}`,
        fechas_confirmadas: true
      });

      cotizacionId = resultadoCotizacion.insertId;

      // Agregar los mismos productos
      await CotizacionProductoModel.agregarMultiples(tenantId, cotizacionId, productosOriginales);

      // Recalcular totales
      await CotizacionModel.recalcularTotales(tenantId, cotizacionId);
    }

    const nuevoEvento = await EventoModel.obtenerPorId(tenantId, nuevoEventoId);

    logger.info('eventoController.repetir', 'Evento repetido', {
      evento_original: id,
      nuevo_evento: nuevoEventoId,
      cotizacion: cotizacionId,
      productos: productosOriginales.length
    });

    res.status(201).json({
      success: true,
      message: 'Evento repetido exitosamente',
      data: {
        evento: nuevoEvento,
        cotizacion_id: cotizacionId,
        productos_copiados: productosOriginales.length
      }
    });
  } catch (error) {
    logger.error('eventoController.repetir', error);
    next(error);
  }
};

// ============================================
// NOVEDADES DEL EVENTO
// ============================================

/**
 * GET /eventos/:id/novedades
 * Obtener novedades consolidadas de todos los alquileres del evento
 */
exports.obtenerNovedadesEvento = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const { id } = req.params;

    const evento = await EventoModel.obtenerPorId(tenantId, id);
    if (!evento) {
      throw new AppError('Evento no encontrado', 404);
    }

    // TODO: pasar tenantId cuando se migre operaciones (Fase 4.2)
    const novedades = await NovedadModel.obtenerPorEvento(id);

    res.json({
      success: true,
      data: novedades
    });
  } catch (error) {
    logger.error('eventoController.obtenerNovedadesEvento', error);
    next(error);
  }
};
