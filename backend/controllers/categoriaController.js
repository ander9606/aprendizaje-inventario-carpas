// ============================================
// CONTROLLER: categoriaController
// Responsabilidad: Lógica de negocio y formateo de respuestas
// ============================================

const CategoriaModel = require('../models/CategoriaModel');

// ============================================
// OBTENER TODAS LAS CATEGORÍAS
// ============================================
exports.obtenerTodas = async (req, res) => {
    try {
        const categorias = await CategoriaModel.obtenerTodas();
        
        res.json({
            success: true,
            data: categorias,
            total: categorias.length
        });
    } catch (error) {
        console.error('Error en obtenerTodas:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener categorías',
            error: error.message
        });
    }
};

// ============================================
// OBTENER CATEGORÍA POR ID
// ============================================
exports.obtenerPorId = async (req, res) => {
    try {
        const { id } = req.params; // Obtener ID de la URL
        const categoria = await CategoriaModel.obtenerPorId(id);
        
        if (!categoria) {
            return res.status(404).json({
                success: false,
                mensaje: 'Categoría no encontrada'
            });
        }
        
        res.json({
            success: true,
            data: categoria
        });
    } catch (error) {
        console.error('Error en obtenerPorId:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener categoría',
            error: error.message
        });
    }
};

// ============================================
// OBTENER CATEGORÍAS PADRE
// ============================================
exports.obtenerPadres = async (req, res) => {
    try {
        const padres = await CategoriaModel.obtenerPadres();
        
        res.json({
            success: true,
            data: padres,
            total: padres.length
        });
    } catch (error) {
        console.error('Error en obtenerPadres:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener categorías padre',
            error: error.message
        });
    }
};

// ============================================
// OBTENER SUBCATEGORÍAS
// ============================================
exports.obtenerHijas = async (req, res) => {
    try {
        const { id } = req.params;
        const hijas = await CategoriaModel.obtenerHijas(id);
        
        res.json({
            success: true,
            data: hijas,
            total: hijas.length
        });
    } catch (error) {
        console.error('Error en obtenerHijas:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener subcategorías',
            error: error.message
        });
    }
};

// ============================================
// CREAR CATEGORÍA
// ============================================
exports.crear = async (req, res) => {
    try {
        const { nombre, padre_id } = req.body;
        
        // Validación
        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({
                success: false,
                mensaje: 'El nombre es obligatorio'
            });
        }
        
        // Crear
        const nuevoId = await CategoriaModel.crear({ nombre, padre_id });
        
        // Obtener el registro creado
        const nuevaCategoria = await CategoriaModel.obtenerPorId(nuevoId);
        
        res.status(201).json({
            success: true,
            mensaje: 'Categoría creada exitosamente',
            data: nuevaCategoria
        });
    } catch (error) {
        console.error('Error en crear:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al crear categoría',
            error: error.message
        });
    }
};

// ============================================
// ACTUALIZAR CATEGORÍA
// ============================================
exports.actualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, padre_id } = req.body;
        
        // Validación
        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({
                success: false,
                mensaje: 'El nombre es obligatorio'
            });
        }
        
        // Actualizar
        const filasAfectadas = await CategoriaModel.actualizar(id, { nombre, padre_id });
        
        if (filasAfectadas === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Categoría no encontrada'
            });
        }
        
        // Obtener el registro actualizado
        const categoriaActualizada = await CategoriaModel.obtenerPorId(id);
        
        res.json({
            success: true,
            mensaje: 'Categoría actualizada exitosamente',
            data: categoriaActualizada
        });
    } catch (error) {
        console.error('Error en actualizar:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al actualizar categoría',
            error: error.message
        });
    }
};

// ============================================
// ELIMINAR CATEGORÍA
// ============================================
exports.eliminar = async (req, res) => {
    try {
        const { id } = req.params;
        
        const filasAfectadas = await CategoriaModel.eliminar(id);
        
        if (filasAfectadas === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Categoría no encontrada'
            });
        }
        
        res.json({
            success: true,
            mensaje: 'Categoría eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error en eliminar:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al eliminar categoría',
            error: error.message
        });
    }
};