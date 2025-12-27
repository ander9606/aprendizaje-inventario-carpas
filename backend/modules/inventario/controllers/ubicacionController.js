// ============================================
// CONTROLLER: Ubicaciones
// Responsabilidad: Lógica de negocio de ubicaciones
// ============================================

const UbicacionModel = require('../models/UbicacionModel');

// ============================================
// OBTENER TODAS LAS UBICACIONES
// ============================================
exports.obtenerTodas = async (req, res) => {
    try {
        const ubicaciones = await UbicacionModel.obtenerTodas();

        res.json({
            success: true,
            data: ubicaciones
        });
    } catch (error) {
        console.error('❌ Error al obtener ubicaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener ubicaciones',
            error: error.message
        });
    }
};

// ============================================
// OBTENER SOLO UBICACIONES ACTIVAS
// ============================================
exports.obtenerActivas = async (req, res) => {
    try {
        const ubicaciones = await UbicacionModel.obtenerActivas();

        res.json({
            success: true,
            data: ubicaciones
        });
    } catch (error) {
        console.error('❌ Error al obtener ubicaciones activas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener ubicaciones activas',
            error: error.message
        });
    }
};

// ============================================
// OBTENER UBICACIÓN PRINCIPAL
// ============================================
exports.obtenerPrincipal = async (req, res) => {
    try {
        const ubicacion = await UbicacionModel.obtenerPrincipal();

        if (!ubicacion) {
            return res.status(404).json({
                success: false,
                message: 'No hay ubicación principal configurada'
            });
        }

        res.json({
            success: true,
            data: ubicacion
        });
    } catch (error) {
        console.error('❌ Error al obtener ubicación principal:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener ubicación principal',
            error: error.message
        });
    }
};

// ============================================
// OBTENER UBICACIÓN POR ID
// ============================================
exports.obtenerPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const ubicacion = await UbicacionModel.obtenerPorId(id);

        if (!ubicacion) {
            return res.status(404).json({
                success: false,
                message: 'Ubicación no encontrada'
            });
        }

        res.json({
            success: true,
            data: ubicacion
        });
    } catch (error) {
        console.error('❌ Error al obtener ubicación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener ubicación',
            error: error.message
        });
    }
};

// ============================================
// OBTENER UBICACIONES POR TIPO
// ============================================
exports.obtenerPorTipo = async (req, res) => {
    try {
        const { tipo } = req.params;

        // Validar tipo
        const tiposValidos = ['bodega', 'finca', 'evento', 'taller', 'transito', 'otro'];
        if (!tiposValidos.includes(tipo)) {
            return res.status(400).json({
                success: false,
                message: `Tipo no válido. Debe ser uno de: ${tiposValidos.join(', ')}`
            });
        }

        const ubicaciones = await UbicacionModel.obtenerPorTipo(tipo);

        res.json({
            success: true,
            data: ubicaciones
        });
    } catch (error) {
        console.error('❌ Error al obtener ubicaciones por tipo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener ubicaciones por tipo',
            error: error.message
        });
    }
};

// ============================================
// OBTENER UBICACIONES CON INVENTARIO
// ============================================
exports.obtenerConInventario = async (req, res) => {
    try {
        const ubicaciones = await UbicacionModel.obtenerConInventario();

        res.json({
            success: true,
            data: ubicaciones
        });
    } catch (error) {
        console.error('❌ Error al obtener ubicaciones con inventario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener ubicaciones con inventario',
            error: error.message
        });
    }
};

// ============================================
// OBTENER DETALLE DE INVENTARIO DE UNA UBICACIÓN
// ============================================
exports.obtenerDetalleInventario = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que la ubicación existe
        const ubicacion = await UbicacionModel.obtenerPorId(id);
        if (!ubicacion) {
            return res.status(404).json({
                success: false,
                message: 'Ubicación no encontrada'
            });
        }

        const detalle = await UbicacionModel.obtenerDetalleInventario(id);

        res.json({
            success: true,
            data: {
                ubicacion: {
                    id: ubicacion.id,
                    nombre: ubicacion.nombre,
                    tipo: ubicacion.tipo
                },
                inventario: detalle
            }
        });
    } catch (error) {
        console.error('❌ Error al obtener detalle de inventario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener detalle de inventario',
            error: error.message
        });
    }
};

// ============================================
// CREAR NUEVA UBICACIÓN
// ============================================
exports.crear = async (req, res) => {
    try {
        const { nombre, tipo } = req.body;

        // Validaciones
        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El nombre es obligatorio'
            });
        }

        // Verificar que el nombre no exista
        const nombreExiste = await UbicacionModel.nombreExiste(nombre);
        if (nombreExiste) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe una ubicación con ese nombre'
            });
        }

        // Validar tipo si viene
        if (tipo) {
            const tiposValidos = ['bodega', 'finca', 'evento', 'taller', 'transito', 'otro'];
            if (!tiposValidos.includes(tipo)) {
                return res.status(400).json({
                    success: false,
                    message: `Tipo no válido. Debe ser uno de: ${tiposValidos.join(', ')}`
                });
            }
        }

        const nuevoId = await UbicacionModel.crear(req.body);
        const ubicacion = await UbicacionModel.obtenerPorId(nuevoId);

        res.status(201).json({
            success: true,
            message: 'Ubicación creada exitosamente',
            data: ubicacion
        });
    } catch (error) {
        console.error('❌ Error al crear ubicación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear ubicación',
            error: error.message
        });
    }
};

// ============================================
// ACTUALIZAR UBICACIÓN
// ============================================
exports.actualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, tipo } = req.body;

        // Verificar que la ubicación existe
        const ubicacionExiste = await UbicacionModel.obtenerPorId(id);
        if (!ubicacionExiste) {
            return res.status(404).json({
                success: false,
                message: 'Ubicación no encontrada'
            });
        }

        // Validaciones
        if (nombre && nombre.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El nombre no puede estar vacío'
            });
        }

        // Verificar que el nombre no exista (excluyendo la ubicación actual)
        if (nombre) {
            const nombreExiste = await UbicacionModel.nombreExiste(nombre, id);
            if (nombreExiste) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe otra ubicación con ese nombre'
                });
            }
        }

        // Validar tipo si viene
        if (tipo) {
            const tiposValidos = ['bodega', 'finca', 'evento', 'taller', 'transito', 'otro'];
            if (!tiposValidos.includes(tipo)) {
                return res.status(400).json({
                    success: false,
                    message: `Tipo no válido. Debe ser uno de: ${tiposValidos.join(', ')}`
                });
            }
        }

        await UbicacionModel.actualizar(id, req.body);
        const ubicacionActualizada = await UbicacionModel.obtenerPorId(id);

        res.json({
            success: true,
            message: 'Ubicación actualizada exitosamente',
            data: ubicacionActualizada
        });
    } catch (error) {
        console.error('❌ Error al actualizar ubicación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar ubicación',
            error: error.message
        });
    }
};

// ============================================
// MARCAR COMO PRINCIPAL
// ============================================
exports.marcarComoPrincipal = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que la ubicación existe
        const ubicacion = await UbicacionModel.obtenerPorId(id);
        if (!ubicacion) {
            return res.status(404).json({
                success: false,
                message: 'Ubicación no encontrada'
            });
        }

        // Verificar que esté activa
        if (!ubicacion.activo) {
            return res.status(400).json({
                success: false,
                message: 'No se puede marcar como principal una ubicación inactiva'
            });
        }

        await UbicacionModel.marcarComoPrincipal(id);
        const ubicacionActualizada = await UbicacionModel.obtenerPorId(id);

        res.json({
            success: true,
            message: 'Ubicación marcada como principal exitosamente',
            data: ubicacionActualizada
        });
    } catch (error) {
        console.error('❌ Error al marcar como principal:', error);
        res.status(500).json({
            success: false,
            message: 'Error al marcar como principal',
            error: error.message
        });
    }
};

// ============================================
// DESACTIVAR UBICACIÓN (Soft Delete)
// ============================================
exports.desactivar = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que la ubicación existe
        const ubicacion = await UbicacionModel.obtenerPorId(id);
        if (!ubicacion) {
            return res.status(404).json({
                success: false,
                message: 'Ubicación no encontrada'
            });
        }

        await UbicacionModel.desactivar(id);

        res.json({
            success: true,
            message: 'Ubicación desactivada exitosamente'
        });
    } catch (error) {
        console.error('❌ Error al desactivar ubicación:', error);

        // Si es error de ubicación principal
        if (error.message.includes('ubicación principal')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al desactivar ubicación',
            error: error.message
        });
    }
};

// ============================================
// ACTIVAR UBICACIÓN
// ============================================
exports.activar = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que la ubicación existe
        const ubicacion = await UbicacionModel.obtenerPorId(id);
        if (!ubicacion) {
            return res.status(404).json({
                success: false,
                message: 'Ubicación no encontrada'
            });
        }

        await UbicacionModel.activar(id);

        res.json({
            success: true,
            message: 'Ubicación activada exitosamente'
        });
    } catch (error) {
        console.error('❌ Error al activar ubicación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al activar ubicación',
            error: error.message
        });
    }
};

// ============================================
// ELIMINAR UBICACIÓN (Hard Delete)
// Solo si no tiene inventario
// ============================================
exports.eliminar = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que la ubicación existe
        const ubicacion = await UbicacionModel.obtenerPorId(id);
        if (!ubicacion) {
            return res.status(404).json({
                success: false,
                message: 'Ubicación no encontrada'
            });
        }

        // El modelo ya verifica que no tenga inventario
        await UbicacionModel.eliminar(id);

        res.json({
            success: true,
            message: 'Ubicación eliminada exitosamente'
        });
    } catch (error) {
        console.error('❌ Error al eliminar ubicación:', error);

        // Error específico si tiene inventario o es principal
        if (error.message.includes('inventario asociado') || error.message.includes('ubicación principal')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al eliminar ubicación',
            error: error.message
        });
    }
};
