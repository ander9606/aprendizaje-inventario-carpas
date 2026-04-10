// ============================================
// CONTROLADOR: Cliente
// Clientes para cotizaciones y alquileres
// ============================================

const ClienteModel = require('../models/ClienteModel');
const AppError = require('../../../utils/AppError');
const logger = require('../../../utils/logger');

// ============================================
// OBTENER TODOS
// ============================================
exports.obtenerTodos = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const clientes = await ClienteModel.obtenerTodos(tenantId);
    res.json({
      success: true,
      data: clientes,
      total: clientes.length
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
    const tenantId = req.tenant.id;
    const clientes = await ClienteModel.obtenerActivos(tenantId);
    res.json({
      success: true,
      data: clientes,
      total: clientes.length
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
    const cliente = await ClienteModel.obtenerPorId(tenantId, id);

    if (!cliente) {
      throw new AppError('Cliente no encontrado', 404);
    }

    res.json({
      success: true,
      data: cliente
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
    const { tipo_documento, numero_documento, nombre, telefono, email, direccion, ciudad, notas } = req.body;

    // Validaciones
    if (!numero_documento || numero_documento.trim() === '') {
      throw new AppError('El número de documento es obligatorio', 400);
    }
    if (!nombre || nombre.trim() === '') {
      throw new AppError('El nombre es obligatorio', 400);
    }

    // Verificar si ya existe
    const clienteExistente = await ClienteModel.obtenerPorDocumento(
      tenantId,
      tipo_documento || 'CC',
      numero_documento.trim()
    );
    if (clienteExistente) {
      throw new AppError('Ya existe un cliente con este documento', 400);
    }

    logger.info('clienteController.crear', 'Creando cliente', { nombre });

    const resultado = await ClienteModel.crear(tenantId, {
      tipo_documento,
      numero_documento: numero_documento.trim(),
      nombre: nombre.trim(),
      telefono,
      email,
      direccion,
      ciudad,
      notas
    });

    const clienteCreado = await ClienteModel.obtenerPorId(tenantId, resultado.insertId);

    res.status(201).json({
      success: true,
      message: 'Cliente creado exitosamente',
      data: clienteCreado
    });
  } catch (error) {
    logger.error('clienteController.crear', error);
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
    const { tipo_documento, numero_documento, nombre, telefono, email, direccion, ciudad, notas, activo } = req.body;

    const clienteExistente = await ClienteModel.obtenerPorId(tenantId, id);
    if (!clienteExistente) {
      throw new AppError('Cliente no encontrado', 404);
    }

    if (!numero_documento || numero_documento.trim() === '') {
      throw new AppError('El número de documento es obligatorio', 400);
    }
    if (!nombre || nombre.trim() === '') {
      throw new AppError('El nombre es obligatorio', 400);
    }

    // Verificar si el documento ya existe en otro cliente
    const otroCliente = await ClienteModel.obtenerPorDocumento(
      tenantId,
      tipo_documento || 'CC',
      numero_documento.trim()
    );
    if (otroCliente && otroCliente.id !== parseInt(id)) {
      throw new AppError('Ya existe otro cliente con este documento', 400);
    }

    await ClienteModel.actualizar(tenantId, id, {
      tipo_documento,
      numero_documento: numero_documento.trim(),
      nombre: nombre.trim(),
      telefono,
      email,
      direccion,
      ciudad,
      notas,
      activo
    });

    const clienteActualizado = await ClienteModel.obtenerPorId(tenantId, id);

    res.json({
      success: true,
      message: 'Cliente actualizado exitosamente',
      data: clienteActualizado
    });
  } catch (error) {
    logger.error('clienteController.actualizar', error);
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

    const cliente = await ClienteModel.obtenerPorId(tenantId, id);
    if (!cliente) {
      throw new AppError('Cliente no encontrado', 404);
    }

    const tieneCotizaciones = await ClienteModel.tieneCotizaciones(tenantId, id);
    if (tieneCotizaciones) {
      throw new AppError('No se puede eliminar un cliente que tiene cotizaciones asociadas', 400);
    }

    await ClienteModel.eliminar(tenantId, id);

    res.json({
      success: true,
      message: 'Cliente eliminado exitosamente'
    });
  } catch (error) {
    logger.error('clienteController.eliminar', error);
    next(error);
  }
};

// ============================================
// HISTORIAL DE EVENTOS
// ============================================
exports.obtenerHistorialEventos = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const { id } = req.params;

    const cliente = await ClienteModel.obtenerPorId(tenantId, id);
    if (!cliente) {
      throw new AppError('Cliente no encontrado', 404);
    }

    const historial = await ClienteModel.obtenerHistorialEventos(tenantId, id);

    res.json({
      success: true,
      data: {
        cliente,
        ...historial
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// BUSCAR
// ============================================
exports.buscar = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      throw new AppError('El término de búsqueda debe tener al menos 2 caracteres', 400);
    }

    const resultados = await ClienteModel.buscar(tenantId, q.trim());

    res.json({
      success: true,
      data: resultados,
      total: resultados.length
    });
  } catch (error) {
    next(error);
  }
};
