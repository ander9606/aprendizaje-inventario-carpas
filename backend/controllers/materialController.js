// ============================================
// CONTROLLER: materialController
// Responsabilidad: Lógica de negocio de materiales
// ============================================

const MaterialModel = require('../models/MaterialModel');

// ============================================
// OBTENER TODOS LOS MATERIALES
// ============================================
exports.obtenerTodos = async (req, res) => {
    try {
        const materiales = await MaterialModel.obtenerTodos();
        
        res.json({
            success: true,
            data: materiales,
            total: materiales.length
        });
    } catch (error) {
        console.error('Error en obtenerTodos:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener materiales',
            error: error.message
        });
    }
};

// ============================================
// OBTENER MATERIAL POR ID
// ============================================
exports.obtenerPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const material = await MaterialModel.obtenerPorId(id);
        
        if (!material) {
            return res.status(404).json({
                success: false,
                mensaje: 'Material no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: material
        });
    } catch (error) {
        console.error('Error en obtenerPorId:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener material',
            error: error.message
        });
    }
};

// ============================================
// OBTENER MATERIALES MÁS USADOS
// ============================================
exports.obtenerMasUsados = async (req, res) => {
    try {
        const materiales = await MaterialModel.obtenerMasUsados();
        
        res.json({
            success: true,
            data: materiales,
            total: materiales.length
        });
    } catch (error) {
        console.error('Error en obtenerMasUsados:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener materiales más usados',
            error: error.message
        });
    }
};

// ============================================
// CREAR MATERIAL
// ============================================
exports.crear = async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;
        
        // Validación
        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({
                success: false,
                mensaje: 'El nombre es obligatorio'
            });
        }
        
        // Verificar que no exista
        const materialExistente = await MaterialModel.obtenerPorNombre(nombre);
        if (materialExistente) {
            return res.status(400).json({
                success: false,
                mensaje: 'Ya existe un material con ese nombre'
            });
        }
        
        // Crear
        const nuevoId = await MaterialModel.crear({ nombre, descripcion });
        
        // Obtener el material creado
        const nuevoMaterial = await MaterialModel.obtenerPorId(nuevoId);
        
        res.status(201).json({
            success: true,
            mensaje: 'Material creado exitosamente',
            data: nuevoMaterial
        });
    } catch (error) {
        console.error('Error en crear:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al crear material',
            error: error.message
        });
    }
};

// ============================================
// ACTUALIZAR MATERIAL
// ============================================
exports.actualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion } = req.body;
        
        // Validación
        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({
                success: false,
                mensaje: 'El nombre es obligatorio'
            });
        }
        
        // Verificar que el nombre no esté en uso por otro material
        const materialExistente = await MaterialModel.obtenerPorNombre(nombre);
        if (materialExistente && materialExistente.id != id) {
            return res.status(400).json({
                success: false,
                mensaje: 'Ya existe otro material con ese nombre'
            });
        }
        
        // Actualizar
        const filasAfectadas = await MaterialModel.actualizar(id, { nombre, descripcion });
        
        if (filasAfectadas === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Material no encontrado'
            });
        }
        
        // Obtener el material actualizado
        const materialActualizado = await MaterialModel.obtenerPorId(id);
        
        res.json({
            success: true,
            mensaje: 'Material actualizado exitosamente',
            data: materialActualizado
        });
    } catch (error) {
        console.error('Error en actualizar:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al actualizar material',
            error: error.message
        });
    }
};

// ============================================
// ELIMINAR MATERIAL
// ============================================
exports.eliminar = async (req, res) => {
    try {
        const { id } = req.params;
        
        const filasAfectadas = await MaterialModel.eliminar(id);
        
        if (filasAfectadas === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Material no encontrado'
            });
        }
        
        res.json({
            success: true,
            mensaje: 'Material eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error en eliminar:', error);
        
        // Si hay error de foreign key
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({
                success: false,
                mensaje: 'No se puede eliminar el material porque está en uso por elementos'
            });
        }
        
        res.status(500).json({
            success: false,
            mensaje: 'Error al eliminar material',
            error: error.message
        });
    }
};

// ============================================
// BUSCAR MATERIALES
// ============================================
exports.buscar = async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.trim() === '') {
            return res.status(400).json({
                success: false,
                mensaje: 'El término de búsqueda es obligatorio'
            });
        }
        
        const materiales = await MaterialModel.buscar(q);
        
        res.json({
            success: true,
            data: materiales,
            total: materiales.length,
            termino: q
        });
    } catch (error) {
        console.error('Error en buscar:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al buscar materiales',
            error: error.message
        });
    }
};