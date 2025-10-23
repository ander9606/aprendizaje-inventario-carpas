// ============================================
// CONTROLLER: serieController
// Responsabilidad: Lógica de negocio de series
// ============================================

const SerieModel = require('../models/SerieModel');
const ElementoModel = require('../models/ElementoModel');

// ============================================
// OBTENER TODAS LAS SERIES
// ============================================
exports.obtenerTodas = async (req, res) => {
    try {
        const series = await SerieModel.obtenerTodas();
        
        res.json({
            success: true,
            data: series,
            total: series.length
        });
    } catch (error) {
        console.error('Error en obtenerTodas:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener series',
            error: error.message
        });
    }
};

// ============================================
// OBTENER SERIE POR ID
// ============================================
exports.obtenerPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const serie = await SerieModel.obtenerPorId(id);
        
        if (!serie) {
            return res.status(404).json({
                success: false,
                mensaje: 'Serie no encontrada'
            });
        }
        
        res.json({
            success: true,
            data: serie
        });
    } catch (error) {
        console.error('Error en obtenerPorId:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener serie',
            error: error.message
        });
    }
};

// ============================================
// OBTENER SERIE POR NÚMERO DE SERIE
// ============================================
exports.obtenerPorNumeroSerie = async (req, res) => {
    try {
        const { numeroSerie } = req.params;
        const serie = await SerieModel.obtenerPorNumeroSerie(numeroSerie);
        
        if (!serie) {
            return res.status(404).json({
                success: false,
                mensaje: 'Serie no encontrada'
            });
        }
        
        res.json({
            success: true,
            data: serie
        });
    } catch (error) {
        console.error('Error en obtenerPorNumeroSerie:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener serie',
            error: error.message
        });
    }
};

// ============================================
// OBTENER SERIES DE UN ELEMENTO
// ============================================
exports.obtenerPorElemento = async (req, res) => {
    try {
        const { elementoId } = req.params;
        
        // Verificar que el elemento existe
        const elemento = await ElementoModel.obtenerPorId(elementoId);
        if (!elemento) {
            return res.status(404).json({
                success: false,
                mensaje: 'Elemento no encontrado'
            });
        }
        
        // Obtener series
        const series = await SerieModel.obtenerPorElemento(elementoId);
        
        // Obtener estadísticas
        const stats = await SerieModel.contarPorElemento(elementoId);
        
        res.json({
            success: true,
            elemento: {
                id: elemento.id,
                nombre: elemento.nombre
            },
            estadisticas: stats,
            data: series,
            total: series.length
        });
    } catch (error) {
        console.error('Error en obtenerPorElemento:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener series del elemento',
            error: error.message
        });
    }
};

// ============================================
// OBTENER SERIES POR ESTADO
// ============================================
exports.obtenerPorEstado = async (req, res) => {
    try {
        const { estado } = req.params;
        
        // Validar estado
        const estadosValidos = ['nuevo', 'bueno', 'mantenimiento', 'alquilado', 'dañado'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({
                success: false,
                mensaje: 'Estado inválido',
                estadosValidos
            });
        }
        
        const series = await SerieModel.obtenerPorEstado(estado);
        
        res.json({
            success: true,
            estado,
            data: series,
            total: series.length
        });
    } catch (error) {
        console.error('Error en obtenerPorEstado:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener series por estado',
            error: error.message
        });
    }
};

// ============================================
// OBTENER SERIES DISPONIBLES
// ============================================
exports.obtenerDisponibles = async (req, res) => {
    try {
        const series = await SerieModel.obtenerDisponibles();
        
        res.json({
            success: true,
            data: series,
            total: series.length
        });
    } catch (error) {
        console.error('Error en obtenerDisponibles:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener series disponibles',
            error: error.message
        });
    }
};

// ============================================
// OBTENER SERIES ALQUILADAS
// ============================================
exports.obtenerAlquiladas = async (req, res) => {
    try {
        const series = await SerieModel.obtenerAlquiladas();
        
        res.json({
            success: true,
            data: series,
            total: series.length
        });
    } catch (error) {
        console.error('Error en obtenerAlquiladas:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener series alquiladas',
            error: error.message
        });
    }
};

// ============================================
// CREAR SERIE
// ============================================
exports.crear = async (req, res) => {
    try {
        const datos = req.body;
        
        // Validaciones
        if (!datos.id_elemento) {
            return res.status(400).json({
                success: false,
                mensaje: 'El id_elemento es obligatorio'
            });
        }
        
        if (!datos.numero_serie || datos.numero_serie.trim() === '') {
            return res.status(400).json({
                success: false,
                mensaje: 'El número de serie es obligatorio'
            });
        }
        
        // Verificar que el elemento existe
        const elemento = await ElementoModel.obtenerPorId(datos.id_elemento);
        if (!elemento) {
            return res.status(404).json({
                success: false,
                mensaje: 'El elemento no existe'
            });
        }
        
        // Verificar que el elemento requiere series
        if (!elemento.requiere_series) {
            return res.status(400).json({
                success: false,
                mensaje: 'Este elemento no requiere números de serie'
            });
        }
        
        // Verificar que el número de serie no exista
        const serieExistente = await SerieModel.obtenerPorNumeroSerie(datos.numero_serie);
        if (serieExistente) {
            return res.status(400).json({
                success: false,
                mensaje: 'Este número de serie ya existe'
            });
        }
        
        // Crear serie
        const nuevoId = await SerieModel.crear(datos);
        
        // Obtener la serie creada
        const nuevaSerie = await SerieModel.obtenerPorId(nuevoId);
        
        res.status(201).json({
            success: true,
            mensaje: 'Serie creada exitosamente',
            data: nuevaSerie
        });
    } catch (error) {
        console.error('Error en crear:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al crear serie',
            error: error.message
        });
    }
};

// ============================================
// ACTUALIZAR SERIE
// ============================================
exports.actualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const datos = req.body;
        
        // Validación
        if (!datos.numero_serie || datos.numero_serie.trim() === '') {
            return res.status(400).json({
                success: false,
                mensaje: 'El número de serie es obligatorio'
            });
        }
        
        // Verificar que el número de serie no esté en uso por otra serie
        const serieExistente = await SerieModel.obtenerPorNumeroSerie(datos.numero_serie);
        if (serieExistente && serieExistente.id != id) {
            return res.status(400).json({
                success: false,
                mensaje: 'Este número de serie ya está en uso'
            });
        }
        
        // Actualizar
        const filasAfectadas = await SerieModel.actualizar(id, datos);
        
        if (filasAfectadas === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Serie no encontrada'
            });
        }
        
        // Obtener la serie actualizada
        const serieActualizada = await SerieModel.obtenerPorId(id);
        
        res.json({
            success: true,
            mensaje: 'Serie actualizada exitosamente',
            data: serieActualizada
        });
    } catch (error) {
        console.error('Error en actualizar:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al actualizar serie',
            error: error.message
        });
    }
};

// ============================================
// CAMBIAR ESTADO DE SERIE
// ============================================
exports.cambiarEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, ubicacion } = req.body;
        
        // Validar estado
        const estadosValidos = ['nuevo', 'bueno', 'mantenimiento', 'alquilado', 'dañado'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({
                success: false,
                mensaje: 'Estado inválido',
                estadosValidos
            });
        }
        
        // Cambiar estado
        const filasAfectadas = await SerieModel.cambiarEstado(id, estado, ubicacion);
        
        if (filasAfectadas === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Serie no encontrada'
            });
        }
        
        // Obtener la serie actualizada
        const serieActualizada = await SerieModel.obtenerPorId(id);
        
        res.json({
            success: true,
            mensaje: 'Estado cambiado exitosamente',
            data: serieActualizada
        });
    } catch (error) {
        console.error('Error en cambiarEstado:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al cambiar estado',
            error: error.message
        });
    }
};

// ============================================
// ELIMINAR SERIE
// ============================================
exports.eliminar = async (req, res) => {
    try {
        const { id } = req.params;
        
        const filasAfectadas = await SerieModel.eliminar(id);
        
        if (filasAfectadas === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Serie no encontrada'
            });
        }
        
        res.json({
            success: true,
            mensaje: 'Serie eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error en eliminar:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al eliminar serie',
            error: error.message
        });
    }
};