// ============================================
// CONTROLADOR: ElementoCompuesto
// Plantillas de productos de alquiler
// ============================================

const ElementoCompuestoModel = require('../models/ElementoCompuestoModel');
const CompuestoComponenteModel = require('../models/CompuestoComponenteModel');
const CategoriaProductoModel = require('../models/CategoriaProductoModel');
const AppError = require('../../../utils/AppError');
const logger = require('../../../utils/logger');
const { deleteImageFile } = require('../../../middleware/upload');

// ============================================
// OBTENER TODOS
// ============================================
exports.obtenerTodos = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const elementos = await ElementoCompuestoModel.obtenerTodos(tenantId);
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
    const tenantId = req.tenant.id;
    const { categoriaId } = req.params;
    const elementos = await ElementoCompuestoModel.obtenerPorCategoria(tenantId, categoriaId);
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
    const tenantId = req.tenant.id;
    const { id } = req.params;
    const elemento = await ElementoCompuestoModel.obtenerPorId(tenantId, id);

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
    const tenantId = req.tenant.id;
    const { id } = req.params;
    const elemento = await ElementoCompuestoModel.obtenerPorIdConComponentes(tenantId, id);

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
    const tenantId = req.tenant.id;
    const { id } = req.params;

    const elemento = await ElementoCompuestoModel.obtenerPorId(tenantId, id);
    if (!elemento) {
      throw new AppError('Elemento compuesto no encontrado', 404);
    }

    const componentes = await CompuestoComponenteModel.obtenerAgrupados(tenantId, id);

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
    const tenantId = req.tenant.id;
    const { categoria_id, nombre, codigo, descripcion, precio_base, deposito, componentes } = req.body;

    // Validaciones
    if (!categoria_id) {
      throw new AppError('La categoría es obligatoria', 400);
    }
    if (!nombre || nombre.trim() === '') {
      throw new AppError('El nombre es obligatorio', 400);
    }

    // Verificar que la categoría existe
    const categoria = await CategoriaProductoModel.obtenerPorId(tenantId, categoria_id);
    if (!categoria) {
      throw new AppError('Categoría no encontrada', 404);
    }

    logger.info('elementoCompuestoController.crear', 'Creando elemento compuesto', { nombre });

    // Crear elemento compuesto
    const resultado = await ElementoCompuestoModel.crear(tenantId, {
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
      await CompuestoComponenteModel.agregarMultiples(tenantId, elementoId, componentes);
    }

    const elementoCreado = await ElementoCompuestoModel.obtenerPorIdConComponentes(tenantId, elementoId);

    res.status(201).json({
      success: true,
      message: 'Elemento compuesto creado exitosamente',
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
    const tenantId = req.tenant.id;
    const { id } = req.params;
    const { categoria_id, nombre, codigo, descripcion, precio_base, deposito, activo } = req.body;

    const elementoExistente = await ElementoCompuestoModel.obtenerPorId(tenantId, id);
    if (!elementoExistente) {
      throw new AppError('Elemento compuesto no encontrado', 404);
    }

    if (!nombre || nombre.trim() === '') {
      throw new AppError('El nombre es obligatorio', 400);
    }

    await ElementoCompuestoModel.actualizar(tenantId, id, {
      categoria_id,
      nombre: nombre.trim(),
      codigo,
      descripcion,
      precio_base,
      deposito,
      activo
    });

    const elementoActualizado = await ElementoCompuestoModel.obtenerPorId(tenantId, id);

    res.json({
      success: true,
      message: 'Elemento compuesto actualizado exitosamente',
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
    const tenantId = req.tenant.id;
    const { id } = req.params;

    const elemento = await ElementoCompuestoModel.obtenerPorId(tenantId, id);
    if (!elemento) {
      throw new AppError('Elemento compuesto no encontrado', 404);
    }

    const tieneCotizaciones = await ElementoCompuestoModel.tieneCotizaciones(tenantId, id);
    if (tieneCotizaciones) {
      throw new AppError('No se puede eliminar un producto que tiene cotizaciones asociadas', 400);
    }

    // Los componentes se eliminan automáticamente por CASCADE
    await ElementoCompuestoModel.eliminar(tenantId, id);

    res.json({
      success: true,
      message: 'Elemento compuesto eliminado exitosamente'
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
    const tenantId = req.tenant.id;
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      throw new AppError('El término de búsqueda debe tener al menos 2 caracteres', 400);
    }

    const resultados = await ElementoCompuestoModel.buscar(tenantId, q.trim());

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
    const tenantId = req.tenant.id;
    const { id } = req.params;
    const { elemento_id, cantidad, tipo, grupo, es_default, precio_adicional, orden } = req.body;

    const elemento = await ElementoCompuestoModel.obtenerPorId(tenantId, id);
    if (!elemento) {
      throw new AppError('Elemento compuesto no encontrado', 404);
    }

    if (!elemento_id) {
      throw new AppError('El elemento del inventario es obligatorio', 400);
    }

    // Verificar si ya existe
    const existe = await CompuestoComponenteModel.existeEnCompuesto(tenantId, id, elemento_id);
    if (existe) {
      throw new AppError('Este elemento ya está agregado al compuesto', 400);
    }

    await CompuestoComponenteModel.agregar(tenantId, {
      compuesto_id: id,
      elemento_id,
      cantidad,
      tipo,
      grupo,
      es_default,
      precio_adicional,
      orden
    });

    const elementoActualizado = await ElementoCompuestoModel.obtenerPorIdConComponentes(tenantId, id);

    res.status(201).json({
      success: true,
      message: 'Componente agregado exitosamente',
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
    const tenantId = req.tenant.id;
    const { id, componenteId } = req.params;

    const componente = await CompuestoComponenteModel.obtenerPorId(tenantId, componenteId);
    if (!componente || componente.compuesto_id !== parseInt(id)) {
      throw new AppError('Componente no encontrado', 404);
    }

    await CompuestoComponenteModel.eliminar(tenantId, componenteId);

    res.json({
      success: true,
      message: 'Componente eliminado exitosamente'
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
    const tenantId = req.tenant.id;
    const { id } = req.params;
    const { componentes } = req.body;

    const elemento = await ElementoCompuestoModel.obtenerPorId(tenantId, id);
    if (!elemento) {
      throw new AppError('Elemento compuesto no encontrado', 404);
    }

    // Eliminar componentes existentes
    await CompuestoComponenteModel.eliminarPorCompuesto(tenantId, id);

    // Agregar nuevos componentes
    if (componentes && componentes.length > 0) {
      await CompuestoComponenteModel.agregarMultiples(tenantId, id, componentes);
    }

    const elementoActualizado = await ElementoCompuestoModel.obtenerPorIdConComponentes(tenantId, id);

    res.json({
      success: true,
      message: 'Componentes actualizados exitosamente',
      data: elementoActualizado
    });
  } catch (error) {
    logger.error('elementoCompuestoController.actualizarComponentes', error);
    next(error);
  }
};

// ============================================
// SUBIR IMAGEN DE PRODUCTO
// ============================================
exports.subirImagen = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const { id } = req.params;

    if (!req.file) {
      throw new AppError('No se recibió ningún archivo', 400);
    }

    const elemento = await ElementoCompuestoModel.obtenerPorId(tenantId, id);
    if (!elemento) {
      throw new AppError('Elemento compuesto no encontrado', 404);
    }

    // Eliminar imagen anterior si existe
    if (elemento.imagen) {
      deleteImageFile(elemento.imagen);
    }

    const imagenUrl = `/uploads/productos/${req.file.filename}`;
    await ElementoCompuestoModel.actualizarImagen(tenantId, id, imagenUrl);

    logger.info('elementoCompuestoController.subirImagen', 'Imagen subida', { id, imagenUrl });

    res.json({
      success: true,
      message: 'Imagen subida correctamente',
      data: { imagen: imagenUrl }
    });
  } catch (error) {
    logger.error('elementoCompuestoController.subirImagen', error);
    next(error);
  }
};

// ============================================
// ELIMINAR IMAGEN DE PRODUCTO
// ============================================
exports.eliminarImagen = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const { id } = req.params;

    const elemento = await ElementoCompuestoModel.obtenerPorId(tenantId, id);
    if (!elemento) {
      throw new AppError('Elemento compuesto no encontrado', 404);
    }

    if (elemento.imagen) {
      deleteImageFile(elemento.imagen);
    }

    await ElementoCompuestoModel.actualizarImagen(tenantId, id, null);

    logger.info('elementoCompuestoController.eliminarImagen', 'Imagen eliminada', { id });

    res.json({
      success: true,
      message: 'Imagen eliminada correctamente'
    });
  } catch (error) {
    logger.error('elementoCompuestoController.eliminarImagen', error);
    next(error);
  }
};
