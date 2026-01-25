// ============================================
// CONTROLADOR: Evento
// Eventos para cotizaciones
// ============================================

const EventoModel = require('../models/EventoModel');
const ClienteModel = require('../models/ClienteModel');
const AppError = require('../../../utils/AppError');

// ============================================
// OBTENER TODOS
// ============================================
exports.obtenerTodos = async (req, res, next) => {
  try {
    const eventos = await EventoModel.obtenerTodos();
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
    const { id } = req.params;
    const evento = await EventoModel.obtenerPorId(id);

    if (!evento) {
      throw new AppError('Evento no encontrado', 404);
    }

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
    const { clienteId } = req.params;
    const eventos = await EventoModel.obtenerPorCliente(clienteId);

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
    const { estado } = req.params;
    const estadosValidos = ['pendiente', 'confirmado', 'en_curso', 'completado', 'cancelado'];

    if (!estadosValidos.includes(estado)) {
      throw new AppError(`Estado inválido. Valores permitidos: ${estadosValidos.join(', ')}`, 400);
    }

    const eventos = await EventoModel.obtenerPorEstado(estado);
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
    const { cliente_id, nombre, fecha_evento, fecha_montaje, fecha_desmontaje, direccion, ciudad, notas } = req.body;

    // Validaciones
    if (!cliente_id) {
      throw new AppError('El cliente es requerido', 400);
    }

    if (!fecha_evento) {
      throw new AppError('La fecha del evento es requerida', 400);
    }

    // Verificar que el cliente existe
    const cliente = await ClienteModel.obtenerPorId(cliente_id);
    if (!cliente) {
      throw new AppError('Cliente no encontrado', 404);
    }

    const resultado = await EventoModel.crear({
      cliente_id,
      nombre,
      fecha_evento,
      fecha_montaje,
      fecha_desmontaje,
      direccion,
      ciudad,
      notas
    });

    const eventoCreado = await EventoModel.obtenerPorId(resultado.insertId);

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
    const { id } = req.params;
    const { nombre, fecha_evento, fecha_montaje, fecha_desmontaje, direccion, ciudad, notas, estado } = req.body;

    const eventoExistente = await EventoModel.obtenerPorId(id);
    if (!eventoExistente) {
      throw new AppError('Evento no encontrado', 404);
    }

    await EventoModel.actualizar(id, {
      nombre: nombre || eventoExistente.nombre,
      fecha_evento: fecha_evento || eventoExistente.fecha_evento,
      fecha_montaje: fecha_montaje || eventoExistente.fecha_montaje,
      fecha_desmontaje: fecha_desmontaje || eventoExistente.fecha_desmontaje,
      direccion,
      ciudad,
      notas,
      estado
    });

    const eventoActualizado = await EventoModel.obtenerPorId(id);

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
    const { id } = req.params;
    const { estado } = req.body;

    const estadosValidos = ['pendiente', 'confirmado', 'en_curso', 'completado', 'cancelado'];
    if (!estadosValidos.includes(estado)) {
      throw new AppError(`Estado inválido. Valores permitidos: ${estadosValidos.join(', ')}`, 400);
    }

    const evento = await EventoModel.obtenerPorId(id);
    if (!evento) {
      throw new AppError('Evento no encontrado', 404);
    }

    await EventoModel.cambiarEstado(id, estado);

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
    const { id } = req.params;

    const evento = await EventoModel.obtenerPorId(id);
    if (!evento) {
      throw new AppError('Evento no encontrado', 404);
    }

    // Verificar si tiene cotizaciones
    const tieneCotizaciones = await EventoModel.tieneCotizaciones(id);
    if (tieneCotizaciones) {
      throw new AppError('No se puede eliminar un evento con cotizaciones asociadas', 400);
    }

    await EventoModel.eliminar(id);

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
    const { id } = req.params;

    const evento = await EventoModel.obtenerPorId(id);
    if (!evento) {
      throw new AppError('Evento no encontrado', 404);
    }

    const cotizaciones = await EventoModel.obtenerCotizaciones(id);

    res.json({
      success: true,
      data: cotizaciones,
      total: cotizaciones.length
    });
  } catch (error) {
    next(error);
  }
};
