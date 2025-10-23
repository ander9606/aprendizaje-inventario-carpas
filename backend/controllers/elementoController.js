// ============================================
// CONTROLLER: elementoController
// Responsabilidad: Lógica de negocio de elementos
// ============================================

const ElementoModel = require('../models/ElementoModel');

// ============================================
// OBTENER TODOS LOS ELEMENTOS
// ============================================
exports.obtenerTodos = async (req, res) => {
    try {
        const elementos = await ElementoModel.obtenerTodos();
        
        res.json({
            success: true,
            data: elementos,
            total: elementos.length
        });
    } catch (error) {
        console.error('Error en obtenerTodos:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener elementos',
            error: error.message
        });
    }
};

// ============================================
// OBTENER ELEMENTO POR ID
// ============================================
exports.obtenerPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const elemento = await ElementoModel.obtenerPorId(id);
        
        if (!elemento) {
            return res.status(404).json({
                success: false,
                mensaje: 'Elemento no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: elemento
        });
    } catch (error) {
        console.error('Error en obtenerPorId:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener elemento',
            error: error.message
        });
    }
};

// ============================================
// OBTENER ELEMENTOS POR CATEGORÍA
// ============================================
exports.obtenerPorCategoria = async (req, res) => {
    try {
        const { categoriaId } = req.params;
        const elementos = await ElementoModel.obtenerPorCategoria(categoriaId);
        
        res.json({
            success: true,
            data: elementos,
            total: elementos.length
        });
    } catch (error) {
        console.error('Error en obtenerPorCategoria:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener elementos por categoría',
            error: error.message
        });
    }
};

// ============================================
// OBTENER ELEMENTOS CON SERIES
// ============================================
exports.obtenerConSeries = async (req, res) => {
    try {
        const elementos = await ElementoModel.obtenerConSeries();
        
        res.json({
            success: true,
            data: elementos,
            total: elementos.length
        });
    } catch (error) {
        console.error('Error en obtenerConSeries:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener elementos con series',
            error: error.message
        });
    }
};

// ============================================
// OBTENER ELEMENTOS SIN SERIES
// ============================================
exports.obtenerSinSeries = async (req, res) => {
    try {
        const elementos = await ElementoModel.obtenerSinSeries();
        
        res.json({
            success: true,
            data: elementos,
            total: elementos.length
        });
    } catch (error) {
        console.error('Error en obtenerSinSeries:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener elementos sin series',
            error: error.message
        });
    }
};

// ============================================
// CREAR ELEMENTO
// ============================================
exports.crear = async (req, res) => {
    try {
        const datos = req.body;
        
        // Validación básica
        if (!datos.nombre || datos.nombre.trim() === '') {
            return res.status(400).json({
                success: false,
                mensaje: 'El nombre es obligatorio'
            });
        }
        
        // Crear elemento
        const nuevoId = await ElementoModel.crear(datos);
        
        // Obtener el elemento creado
        const nuevoElemento = await ElementoModel.obtenerPorId(nuevoId);
        
        res.status(201).json({
            success: true,
            mensaje: 'Elemento creado exitosamente',
            data: nuevoElemento
        });
    } catch (error) {
        console.error('Error en crear:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al crear elemento',
            error: error.message
        });
    }
};

// ============================================
// ACTUALIZAR ELEMENTO
// ============================================
exports.actualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const datos = req.body;
        
        // Validación básica
        if (!datos.nombre || datos.nombre.trim() === '') {
            return res.status(400).json({
                success: false,
                mensaje: 'El nombre es obligatorio'
            });
        }
        
        // Actualizar
        const filasAfectadas = await ElementoModel.actualizar(id, datos);
        
        if (filasAfectadas === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Elemento no encontrado'
            });
        }
        
        // Obtener el elemento actualizado
        const elementoActualizado = await ElementoModel.obtenerPorId(id);
        
        res.json({
            success: true,
            mensaje: 'Elemento actualizado exitosamente',
            data: elementoActualizado
        });
    } catch (error) {
        console.error('Error en actualizar:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al actualizar elemento',
            error: error.message
        });
    }
};

// ============================================
// ELIMINAR ELEMENTO
// ============================================
exports.eliminar = async (req, res) => {
    try {
        const { id } = req.params;
        
        const filasAfectadas = await ElementoModel.eliminar(id);
        
        if (filasAfectadas === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Elemento no encontrado'
            });
        }
        
        res.json({
            success: true,
            mensaje: 'Elemento eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error en eliminar:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al eliminar elemento',
            error: error.message
        });
    }
};

// ============================================
// BUSCAR ELEMENTOS
// ============================================
exports.buscar = async (req, res) => {
    try {
        const { q } = req.query; // query parameter: ?q=termino
        
        if (!q || q.trim() === '') {
            return res.status(400).json({
                success: false,
                mensaje: 'El término de búsqueda es obligatorio'
            });
        }
        
        const elementos = await ElementoModel.buscarPorNombre(q);
        
        res.json({
            success: true,
            data: elementos,
            total: elementos.length,
            termino: q
        });
    } catch (error) {
        console.error('Error en buscar:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al buscar elementos',
            error: error.message
        });
    }
};