// ============================================
// CONTROLADOR: ElementoCompuesto
// Plantillas de productos de alquiler
// ============================================

const ElementoCompuestoModel = require('../models/ElementoCompuestoModel');
const CompuestoComponenteModel = require('../models/CompuestoComponenteModel');
const CategoriaProductoModel = require('../models/CategoriaProductoModel');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

// ============================================
// OBTENER TODOS
// ============================================
exports.obtenerTodos = async (req, res, next) => {
  try {
    const elementos = await ElementoCompuestoModel.obtenerTodos();
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
// OBTENER POR CATEGORÍA
// ============================================
exports.obtenerPorCategoria = async (req, res, next) => {
  try {
    const { categoriaId } = req.params;
    const elementos = await ElementoCompuestoModel.obtenerPorCategoria(categoriaId);
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
// OBTENER POR ID
// ============================================
exports.obtenerPorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const elemento = await ElementoCompuestoModel.obtenerPorId(id);

    if (!elemento) {
      throw new AppError('Elemento compuesto no encontrado', 404);
    }

    res.json({
      success: true,
      data: elemento
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// OBTENER POR ID CON COMPONENTES
// ============================================
exports.obtenerPorIdConComponentes = async (req, res, next) => {
  try {
    const { id } = req.params;
    const elemento = await ElementoCompuestoModel.obtenerPorIdConComponentes(id);

    if (!elemento) {
      throw new AppError('Elemento compuesto no encontrado', 404);
    }

    res.json({
      success: true,
      data: elemento
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// OBTENER COMPONENTES AGRUPADOS
// ============================================
exports.obtenerComponentesAgrupados = async (req, res, next) => {
  try {
    const { id } = req.params;

    const elemento = await ElementoCompuestoModel.obtenerPorId(id);
    if (!elemento) {
      throw new AppError('Elemento compuesto no encontrado', 404);
    }

    const componentes = await CompuestoComponenteModel.obtenerAgrupados(id);

    res.json({
      success: true,
      data: {
        elemento,
        componentes
      }
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
    const { categoria_id, nombre, codigo, descripcion, precio_base, deposito, componentes } = req.body;

    // Validaciones
    if (!categoria_id) {
      throw new AppError('La categoría es obligatoria', 400);
    }
    if (!nombre || nombre.trim() === '') {
      throw new AppError('El nombre es obligatorio', 400);
    }

    // Verificar que la categoría existe
    const categoria = await CategoriaProductoModel.obtenerPorId(categoria_id);
    if (!categoria) {
      throw new AppError('Categoría no encontrada', 404);
    }

    logger.info('elementoCompuestoController.crear', 'Creando elemento compuesto', { nombre });

    // Crear elemento compuesto
    const resultado = await ElementoCompuestoModel.crear({
      categoria_id,
      nombre: nombre.trim(),
      codigo,
      descripcion,
      precio_base,
      deposito
    });

    const elementoId = resultado.insertId;

    // Agregar componentes si vienen
    if (componentes && componentes.length > 0) {
      await CompuestoComponenteModel.agregarMultiples(elementoId, componentes);
    }

    const elementoCreado = await ElementoCompuestoModel.obtenerPorIdConComponentes(elementoId);

    res.status(201).json({
      success: true,
      mensaje: 'Elemento compuesto creado exitosamente',
      data: elementoCreado
    });
  } catch (error) {
    logger.error('elementoCompuestoController.crear', error);
    next(error);
  }
};

// ============================================
// ACTUALIZAR
// ============================================
exports.actualizar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { categoria_id, nombre, codigo, descripcion, precio_base, deposito, activo } = req.body;

    const elementoExistente = await ElementoCompuestoModel.obtenerPorId(id);
    if (!elementoExistente) {
      throw new AppError('Elemento compuesto no encontrado', 404);
    }

    if (!nombre || nombre.trim() === '') {
      throw new AppError('El nombre es obligatorio', 400);
    }

    await ElementoCompuestoModel.actualizar(id, {
      categoria_id,
      nombre: nombre.trim(),
      codigo,
      descripcion,
      precio_base,
      deposito,
      activo
    });

    const elementoActualizado = await ElementoCompuestoModel.obtenerPorId(id);

    res.json({
      success: true,
      mensaje: 'Elemento compuesto actualizado exitosamente',
      data: elementoActualizado
    });
  } catch (error) {
    logger.error('elementoCompuestoController.actualizar', error);
    next(error);
  }
};

// ============================================
// ELIMINAR
// ============================================
exports.eliminar = async (req, res, next) => {
  try {
    const { id } = req.params;

    const elemento = await ElementoCompuestoModel.obtenerPorId(id);
    if (!elemento) {
      throw new AppError('Elemento compuesto no encontrado', 404);
    }

    const tieneCotizaciones = await ElementoCompuestoModel.tieneCotizaciones(id);
    if (tieneCotizaciones) {
      throw new AppError('No se puede eliminar un producto que tiene cotizaciones asociadas', 400);
    }

    // Los componentes se eliminan automáticamente por CASCADE
    await ElementoCompuestoModel.eliminar(id);

    res.json({
      success: true,
      mensaje: 'Elemento compuesto eliminado exitosamente'
    });
  } catch (error) {
    logger.error('elementoCompuestoController.eliminar', error);
    next(error);
  }
};

// ============================================
// BUSCAR
// ============================================
exports.buscar = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      throw new AppError('El término de búsqueda debe tener al menos 2 caracteres', 400);
    }

    const resultados = await ElementoCompuestoModel.buscar(q.trim());

    res.json({
      success: true,
      data: resultados,
      total: resultados.length
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// AGREGAR COMPONENTE
// ============================================
exports.agregarComponente = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { elemento_id, cantidad, tipo, grupo, es_default, precio_adicional, orden } = req.body;

    const elemento = await ElementoCompuestoModel.obtenerPorId(id);
    if (!elemento) {
      throw new AppError('Elemento compuesto no encontrado', 404);
    }

    if (!elemento_id) {
      throw new AppError('El elemento del inventario es obligatorio', 400);
    }

    // Verificar si ya existe
    const existe = await CompuestoComponenteModel.existeEnCompuesto(id, elemento_id);
    if (existe) {
      throw new AppError('Este elemento ya está agregado al compuesto', 400);
    }

    await CompuestoComponenteModel.agregar({
      compuesto_id: id,
      elemento_id,
      cantidad,
      tipo,
      grupo,
      es_default,
      precio_adicional,
      orden
    });

    const elementoActualizado = await ElementoCompuestoModel.obtenerPorIdConComponentes(id);

    res.status(201).json({
      success: true,
      mensaje: 'Componente agregado exitosamente',
      data: elementoActualizado
    });
  } catch (error) {
    logger.error('elementoCompuestoController.agregarComponente', error);
    next(error);
  }
};

// ============================================
// ELIMINAR COMPONENTE
// ============================================
exports.eliminarComponente = async (req, res, next) => {
  try {
    const { id, componenteId } = req.params;

    const componente = await CompuestoComponenteModel.obtenerPorId(componenteId);
    if (!componente || componente.compuesto_id !== parseInt(id)) {
      throw new AppError('Componente no encontrado', 404);
    }

    await CompuestoComponenteModel.eliminar(componenteId);

    res.json({
      success: true,
      mensaje: 'Componente eliminado exitosamente'
    });
  } catch (error) {
    logger.error('elementoCompuestoController.eliminarComponente', error);
    next(error);
  }
};

// ============================================
// ACTUALIZAR COMPONENTES (reemplazar todos)
// ============================================
exports.actualizarComponentes = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { componentes } = req.body;

    const elemento = await ElementoCompuestoModel.obtenerPorId(id);
    if (!elemento) {
      throw new AppError('Elemento compuesto no encontrado', 404);
    }

    // Eliminar componentes existentes
    await CompuestoComponenteModel.eliminarPorCompuesto(id);

    // Agregar nuevos componentes
    if (componentes && componentes.length > 0) {
      await CompuestoComponenteModel.agregarMultiples(id, componentes);
    }

    const elementoActualizado = await ElementoCompuestoModel.obtenerPorIdConComponentes(id);

    res.json({
      success: true,
      mensaje: 'Componentes actualizados exitosamente',
      data: elementoActualizado
    });
  } catch (error) {
    logger.error('elementoCompuestoController.actualizarComponentes', error);
    next(error);
  }
};
