// ============================================
// CONTROLLER: unidadController
// Responsabilidad: Lógica de negocio de unidades
// ============================================

const UnidadModel = require('../models/UnidadModel');

// ============================================
// OBTENER TODAS LAS UNIDADES
// ============================================
exports.obtenerTodas = async (req, res) => {
    try {
        const unidades = await UnidadModel.obtenerTodas();
        
        res.json({
            success: true,
            data: unidades,
            total: unidades.length
        });
    } catch (error) {
        console.error('Error en obtenerTodas:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener unidades',
            error: error.message
        });
    }
};

// ============================================
// OBTENER UNIDAD POR ID
// ============================================
exports.obtenerPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const unidad = await UnidadModel.obtenerPorId(id);
        
        if (!unidad) {
            return res.status(404).json({
                success: false,
                mensaje: 'Unidad no encontrada'
            });
        }
        
        res.json({
            success: true,
            data: unidad
        });
    } catch (error) {
        console.error('Error en obtenerPorId:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener unidad',
            error: error.message
        });
    }
};

// ============================================
// OBTENER UNIDADES POR TIPO
// ============================================
exports.obtenerPorTipo = async (req, res) => {
    try {
        const { tipo } = req.params;
        
        // Validar tipo
        const tiposValidos = ['longitud', 'peso', 'volumen', 'cantidad'];
        if (!tiposValidos.includes(tipo)) {
            return res.status(400).json({
                success: false,
                mensaje: 'Tipo inválido',
                tiposValidos
            });
        }
        
        const unidades = await UnidadModel.obtenerPorTipo(tipo);
        
        res.json({
            success: true,
            tipo,
            data: unidades,
            total: unidades.length
        });
    } catch (error) {
        console.error('Error en obtenerPorTipo:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener unidades por tipo',
            error: error.message
        });
    }
};

// ============================================
// OBTENER UNIDADES MÁS USADAS
// ============================================
exports.obtenerMasUsadas = async (req, res) => {
    try {
        const unidades = await UnidadModel.obtenerMasUsadas();
        
        res.json({
            success: true,
            data: unidades,
            total: unidades.length
        });
    } catch (error) {
        console.error('Error en obtenerMasUsadas:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener unidades más usadas',
            error: error.message
        });
    }
};

// ============================================
// CREAR UNIDAD
// ============================================
exports.crear = async (req, res) => {
    try {
        const { nombre, abreviatura, tipo } = req.body;
        
        // Validación
        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({
                success: false,
                mensaje: 'El nombre es obligatorio'
            });
        }
        
        // Validar tipo si se proporciona
        if (tipo) {
            const tiposValidos = ['longitud', 'peso', 'volumen', 'cantidad'];
            if (!tiposValidos.includes(tipo)) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'Tipo inválido',
                    tiposValidos
                });
            }
        }
        
        // Verificar que no exista
        const unidadExistente = await UnidadModel.obtenerPorNombre(nombre);
        if (unidadExistente) {
            return res.status(400).json({
                success: false,
                mensaje: 'Ya existe una unidad con ese nombre'
            });
        }
        
        // Crear
        const nuevoId = await UnidadModel.crear({ nombre, abreviatura, tipo });
        
        // Obtener la unidad creada
        const nuevaUnidad = await UnidadModel.obtenerPorId(nuevoId);
        
        res.status(201).json({
            success: true,
            mensaje: 'Unidad creada exitosamente',
            data: nuevaUnidad
        });
    } catch (error) {
        console.error('Error en crear:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al crear unidad',
            error: error.message
        });
    }
};

// ============================================
// ACTUALIZAR UNIDAD
// ============================================
exports.actualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, abreviatura, tipo } = req.body;
        
        // Validación
        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({
                success: false,
                mensaje: 'El nombre es obligatorio'
            });
        }
        
        // Validar tipo si se proporciona
        if (tipo) {
            const tiposValidos = ['longitud', 'peso', 'volumen', 'cantidad'];
            if (!tiposValidos.includes(tipo)) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'Tipo inválido',
                    tiposValidos
                });
            }
        }
        
        // Verificar que el nombre no esté en uso por otra unidad
        const unidadExistente = await UnidadModel.obtenerPorNombre(nombre);
        if (unidadExistente && unidadExistente.id != id) {
            return res.status(400).json({
                success: false,
                mensaje: 'Ya existe otra unidad con ese nombre'
            });
        }
        
        // Actualizar
        const filasAfectadas = await UnidadModel.actualizar(id, { nombre, abreviatura, tipo });
        
        if (filasAfectadas === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Unidad no encontrada'
            });
        }
        
        // Obtener la unidad actualizada
        const unidadActualizada = await UnidadModel.obtenerPorId(id);
        
        res.json({
            success: true,
            mensaje: 'Unidad actualizada exitosamente',
            data: unidadActualizada
        });
    } catch (error) {
        console.error('Error en actualizar:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al actualizar unidad',
            error: error.message
        });
    }
};

// ============================================
// ELIMINAR UNIDAD
// ============================================
exports.eliminar = async (req, res) => {
    try {
        const { id } = req.params;
        
        const filasAfectadas = await UnidadModel.eliminar(id);
        
        if (filasAfectadas === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Unidad no encontrada'
            });
        }
        
        res.json({
            success: true,
            mensaje: 'Unidad eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error en eliminar:', error);
        
        // Si hay error de foreign key
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({
                success: false,
                mensaje: 'No se puede eliminar la unidad porque está en uso por elementos'
            });
        }
        
        res.status(500).json({
            success: false,
            mensaje: 'Error al eliminar unidad',
            error: error.message
        });
    }
};