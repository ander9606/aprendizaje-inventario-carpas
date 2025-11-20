// ============================================
// CONTROLADOR: CATEGORIA 

// Incluye manejo del campo emoji
// ============================================

const CategoriaModel = require('../models/CategoriaModel')

/**
 * CAMBIOS EN ESTA VERSIÓN:
 * 
 * 1. Agregamos validación del emoji (opcional pero con límites)
 * 2. Extraemos emoji del req.body en crear() y actualizar()
 * 3. Pasamos emoji al modelo
 * 4. USA COMMONJS (module.exports) NO ES6 MODULES
 */

// ============================================
// OBTENER TODAS LAS CATEGORÍAS
// ============================================

/**
 * GET /api/categorias
 */
exports.obtenerTodas = async (req, res) => {
  try {
    const categorias = await CategoriaModel.obtenerTodas()
    
    res.json({
      success: true,
      data: categorias,
      total: categorias.length
    })
  } catch (error) {
    console.error('Error en obtenerTodas:', error)
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener categorías',
      error: error.message
    })
  }
}

// ============================================
// OBTENER SOLO CATEGORÍAS PADRE
// ============================================

/**
 * GET /api/categorias/padres
 */
exports.obtenerPadres = async (req, res) => {
  try {
    const categorias = await CategoriaModel.obtenerPadres()
    
    res.json({
      success: true,
      data: categorias,
      total: categorias.length
    })
  } catch (error) {
    console.error('Error en obtenerPadres:', error)
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener categorías padre',
      error: error.message
    })
  }
}

// ============================================
// OBTENER POR ID
// ============================================

/**
 * GET /api/categorias/:id
 */
exports.obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params
    const categoria = await CategoriaModel.obtenerPorId(id)
    
    if (!categoria) {
      return res.status(404).json({
        success: false,
        mensaje: 'Categoría no encontrada'
      })
    }
    
    res.json({
      success: true,
      data: categoria
    })
  } catch (error) {
    console.error('Error en obtenerPorId:', error)
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener categoría',
      error: error.message
    })
  }
}

// ============================================
// OBTENER SUBCATEGORÍAS
// ============================================

/**
 * GET /api/categorias/:id/hijas
 */
exports.obtenerHijas = async (req, res) => {
  try {
    const { id } = req.params
    
    // Verificar que la categoría padre existe
    const categoriaPadre = await CategoriaModel.obtenerPorId(id)
    if (!categoriaPadre) {
      return res.status(404).json({
        success: false,
        mensaje: 'Categoría padre no encontrada'
      })
    }
    
    const subcategorias = await CategoriaModel.obtenerHijas(id)
    
    res.json({
      success: true,
      data: subcategorias,
      total: subcategorias.length,
      categoria_padre: categoriaPadre
    })
  } catch (error) {
    console.error('Error en obtenerHijas:', error)
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener subcategorías',
      error: error.message
    })
  }
}

// ============================================
// CREAR CATEGORÍA
// ============================================

/**
 * POST /api/categorias
 * 
 * Body:
 * {
 *   "nombre": "Carpas",
 *   "emoji": "🏕️",  // opcional
 *   "padre_id": null  // opcional
 * }
 */
exports.crear = async (req, res) => {
  try {
    const { nombre, emoji, padre_id } = req.body
    
    // ============================================
    // VALIDACIONES
    // ============================================
    
    // Validar nombre
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({
        success: false,
        mensaje: 'El nombre es obligatorio'
      })
    }
    
    if (nombre.length < 3 || nombre.length > 50) {
      return res.status(400).json({
        success: false,
        mensaje: 'El nombre debe tener entre 3 y 50 caracteres'
      })
    }
    
    // Validar emoji (opcional pero con límites)
    if (emoji && emoji.length > 10) {
      return res.status(400).json({
        success: false,
        mensaje: 'El emoji no puede tener más de 10 caracteres'
      })
    }
    
    // Validar padre_id si existe
    if (padre_id) {
      const categoriaPadre = await CategoriaModel.obtenerPorId(padre_id)
      if (!categoriaPadre) {
        return res.status(404).json({
          success: false,
          mensaje: 'La categoría padre no existe'
        })
      }
    }
    
    // ============================================
    // CREAR CATEGORÍA
    // ============================================
    
    const resultado = await CategoriaModel.crear({
      nombre: nombre.trim(),
      emoji: emoji?.trim() || null,
      padre_id: padre_id || null
    })
    
    // Obtener la categoría creada con todos sus datos
    const categoriaCreada = await CategoriaModel.obtenerPorId(resultado.insertId)
    
    res.status(201).json({
      success: true,
      mensaje: 'Categoría creada exitosamente',
      data: categoriaCreada
    })
    
  } catch (error) {
    console.error('Error en crear:', error)
    res.status(500).json({
      success: false,
      mensaje: 'Error al crear categoría',
      error: error.message
    })
  }
}

// ============================================
// ACTUALIZAR CATEGORÍA
// ============================================

/**
 * PUT /api/categorias/:id
 * 
 * Body:
 * {
 *   "nombre": "Carpas Actualizadas",
 *   "emoji": "⛺",  // opcional
 *   "padre_id": null  // opcional
 * }
 */
exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, emoji, padre_id } = req.body
    
    // ============================================
    // VALIDACIONES
    // ============================================
    
    // Verificar que la categoría existe
    const categoriaExistente = await CategoriaModel.obtenerPorId(id)
    if (!categoriaExistente) {
      return res.status(404).json({
        success: false,
        mensaje: 'Categoría no encontrada'
      })
    }
    
    // Validar nombre
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({
        success: false,
        mensaje: 'El nombre es obligatorio'
      })
    }
    
    if (nombre.length < 3 || nombre.length > 50) {
      return res.status(400).json({
        success: false,
        mensaje: 'El nombre debe tener entre 3 y 50 caracteres'
      })
    }
    
    // Validar emoji
    if (emoji && emoji.length > 10) {
      return res.status(400).json({
        success: false,
        mensaje: 'El emoji no puede tener más de 10 caracteres'
      })
    }
    
    // Validar que no se esté poniendo como su propio padre
    if (padre_id && parseInt(padre_id) === parseInt(id)) {
      return res.status(400).json({
        success: false,
        mensaje: 'Una categoría no puede ser su propia padre'
      })
    }
    
    // Validar padre_id si existe
    if (padre_id) {
      const categoriaPadre = await CategoriaModel.obtenerPorId(padre_id)
      if (!categoriaPadre) {
        return res.status(404).json({
          success: false,
          mensaje: 'La categoría padre no existe'
        })
      }
    }
    
    // ============================================
    // ACTUALIZAR CATEGORÍA
    // ============================================
    
    await CategoriaModel.actualizar(id, {
      nombre: nombre.trim(),
      emoji: emoji?.trim() || null,
      padre_id: padre_id || null
    })
    
    // Obtener la categoría actualizada
    const categoriaActualizada = await CategoriaModel.obtenerPorId(id)
    
    res.json({
      success: true,
      mensaje: 'Categoría actualizada exitosamente',
      data: categoriaActualizada
    })
    
  } catch (error) {
    console.error('Error en actualizar:', error)
    res.status(500).json({
      success: false,
      mensaje: 'Error al actualizar categoría',
      error: error.message
    })
  }
}

// ============================================
// ELIMINAR CATEGORÍA
// ============================================

/**
 * DELETE /api/categorias/:id
 */
exports.eliminar = async (req, res) => {
  try {
    const { id } = req.params
    
    // Verificar que la categoría existe
    const categoria = await CategoriaModel.obtenerPorId(id)
    if (!categoria) {
      return res.status(404).json({
        success: false,
        mensaje: 'Categoría no encontrada'
      })
    }
    
    // Verificar que no tenga subcategorías
    const tieneSubcategorias = await CategoriaModel.tieneSubcategorias(id)
    if (tieneSubcategorias) {
      return res.status(400).json({
        success: false,
        mensaje: 'No se puede eliminar una categoría que tiene subcategorías'
      })
    }
    
    // Verificar que no tenga elementos
    const tieneElementos = await CategoriaModel.tieneElementos(id)
    if (tieneElementos) {
      return res.status(400).json({
        success: false,
        mensaje: 'No se puede eliminar una categoría que tiene elementos asociados'
      })
    }
    
    // Eliminar categoría
    await CategoriaModel.eliminar(id)
    
    res.json({
      success: true,
      mensaje: 'Categoría eliminada exitosamente'
    })
    
  } catch (error) {
    console.error('Error en eliminar:', error)
    res.status(500).json({
      success: false,
      mensaje: 'Error al eliminar categoría',
      error: error.message
    })
  }
}

