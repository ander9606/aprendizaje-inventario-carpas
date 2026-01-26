// ============================================
// CONTROLADOR: Descuento
// Catálogo de descuentos predefinidos
// ============================================

const DescuentoModel = require('../models/DescuentoModel');
const CotizacionDescuentoModel = require('../models/CotizacionDescuentoModel');
const CotizacionModel = require('../models/CotizacionModel');
const AppError = require('../../../utils/AppError');

// ============================================
// OBTENER TODOS
// ============================================
exports.obtenerTodos = async (req, res, next) => {
  try {
    const incluirInactivos = req.query.incluir_inactivos === 'true';
    const descuentos = await DescuentoModel.obtenerTodos(incluirInactivos);
    res.json({
      success: true,
      data: descuentos,
      total: descuentos.length
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
    const descuento = await DescuentoModel.obtenerPorId(id);

    if (!descuento) {
      throw new AppError('Descuento no encontrado', 404);
    }

    res.json({
      success: true,
      data: descuento
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
    const { nombre, descripcion, tipo, valor } = req.body;

    if (!nombre) {
      throw new AppError('El nombre es requerido', 400);
    }

    if (!['porcentaje', 'fijo'].includes(tipo)) {
      throw new AppError('El tipo debe ser "porcentaje" o "fijo"', 400);
    }

    if (valor === undefined || valor < 0) {
      throw new AppError('El valor debe ser un número positivo', 400);
    }

    const resultado = await DescuentoModel.crear({ nombre, descripcion, tipo, valor });
    const descuentoCreado = await DescuentoModel.obtenerPorId(resultado.insertId);

    res.status(201).json({
      success: true,
      message: 'Descuento creado correctamente',
      data: descuentoCreado
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
    const { nombre, descripcion, tipo, valor, activo } = req.body;

    const descuentoExistente = await DescuentoModel.obtenerPorId(id);
    if (!descuentoExistente) {
      throw new AppError('Descuento no encontrado', 404);
    }

    if (tipo && !['porcentaje', 'fijo'].includes(tipo)) {
      throw new AppError('El tipo debe ser "porcentaje" o "fijo"', 400);
    }

    await DescuentoModel.actualizar(id, {
      nombre: nombre || descuentoExistente.nombre,
      descripcion: descripcion !== undefined ? descripcion : descuentoExistente.descripcion,
      tipo: tipo || descuentoExistente.tipo,
      valor: valor !== undefined ? valor : descuentoExistente.valor,
      activo: activo !== undefined ? activo : descuentoExistente.activo
    });

    const descuentoActualizado = await DescuentoModel.obtenerPorId(id);

    res.json({
      success: true,
      message: 'Descuento actualizado correctamente',
      data: descuentoActualizado
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// ELIMINAR (soft delete)
// ============================================
exports.eliminar = async (req, res, next) => {
  try {
    const { id } = req.params;

    const descuento = await DescuentoModel.obtenerPorId(id);
    if (!descuento) {
      throw new AppError('Descuento no encontrado', 404);
    }

    await DescuentoModel.eliminar(id);

    res.json({
      success: true,
      message: 'Descuento desactivado correctamente'
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// APLICAR DESCUENTO A COTIZACIÓN
// ============================================
exports.aplicarACotizacion = async (req, res, next) => {
  try {
    const { id } = req.params; // :id de la ruta /cotizaciones/:id/descuentos
    const { descuento_id, monto, es_porcentaje, notas } = req.body;

    // Verificar que la cotización existe
    const cotizacion = await CotizacionModel.obtenerCompleta(id);
    if (!cotizacion) {
      throw new AppError('Cotización no encontrada', 404);
    }

    // Base para calcular descuentos porcentuales
    const baseCalculo = cotizacion.resumen.subtotal_productos + cotizacion.resumen.subtotal_transporte;

    let resultado;
    if (descuento_id) {
      // Aplicar descuento predefinido
      resultado = await CotizacionDescuentoModel.agregarDescuentoPredefinido(
        id,
        descuento_id,
        baseCalculo,
        notas
      );
    } else if (monto !== undefined) {
      // Aplicar descuento manual
      const tipo = es_porcentaje ? 'porcentaje' : 'fijo';
      resultado = await CotizacionDescuentoModel.agregarDescuentoManual(
        id,
        monto,
        tipo,
        baseCalculo,
        notas
      );
    } else {
      throw new AppError('Debe proporcionar descuento_id o monto', 400);
    }

    // Obtener cotización actualizada
    const cotizacionActualizada = await CotizacionModel.obtenerCompleta(id);

    res.status(201).json({
      success: true,
      message: 'Descuento aplicado correctamente',
      data: cotizacionActualizada
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// OBTENER DESCUENTOS DE COTIZACIÓN
// ============================================
exports.obtenerDeCotizacion = async (req, res, next) => {
  try {
    const { id } = req.params; // :id de la ruta /cotizaciones/:id/descuentos

    const cotizacion = await CotizacionModel.obtenerPorId(id);
    if (!cotizacion) {
      throw new AppError('Cotización no encontrada', 404);
    }

    const descuentos = await CotizacionDescuentoModel.obtenerPorCotizacion(id);

    res.json({
      success: true,
      data: descuentos,
      total: descuentos.length
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// ELIMINAR DESCUENTO DE COTIZACIÓN
// ============================================
exports.eliminarDeCotizacion = async (req, res, next) => {
  try {
    const { id, descuentoAplicadoId } = req.params; // :id de la ruta /cotizaciones/:id/descuentos/:descuentoAplicadoId

    const cotizacion = await CotizacionModel.obtenerPorId(id);
    if (!cotizacion) {
      throw new AppError('Cotización no encontrada', 404);
    }

    await CotizacionDescuentoModel.eliminar(descuentoAplicadoId);

    const cotizacionActualizada = await CotizacionModel.obtenerCompleta(id);

    res.json({
      success: true,
      message: 'Descuento eliminado correctamente',
      data: cotizacionActualizada
    });
  } catch (error) {
    next(error);
  }
};
