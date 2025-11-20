// ============================================
// ROUTES: Ubicaciones
// Responsabilidad: Definir URLs de ubicaciones
// ============================================

const express = require('express');
const router = express.Router();
const ubicacionController = require('../controllers/ubicacionController');

// ============================================
// RUTAS ESPECIALES (van primero)
// ============================================

// GET /api/ubicaciones/activas - Obtener solo ubicaciones activas
router.get('/activas', ubicacionController.obtenerActivas);

// GET /api/ubicaciones/inventario - Obtener ubicaciones con conteo de inventario
router.get('/inventario', ubicacionController.obtenerConInventario);

// GET /api/ubicaciones/tipo/:tipo - Obtener ubicaciones por tipo
router.get('/tipo/:tipo', ubicacionController.obtenerPorTipo);

// GET /api/ubicaciones/:id/inventario - Obtener detalle de inventario de una ubicación
router.get('/:id/inventario', ubicacionController.obtenerDetalleInventario);

// ============================================
// RUTAS CRUD ESTÁNDAR
// ============================================

// GET /api/ubicaciones - Obtener todas las ubicaciones
router.get('/', ubicacionController.obtenerTodas);

// GET /api/ubicaciones/:id - Obtener una ubicación por ID
router.get('/:id', ubicacionController.obtenerPorId);

// POST /api/ubicaciones - Crear nueva ubicación
router.post('/', ubicacionController.crear);

// PUT /api/ubicaciones/:id - Actualizar ubicación
router.put('/:id', ubicacionController.actualizar);

// PATCH /api/ubicaciones/:id/desactivar - Desactivar ubicación (soft delete)
router.patch('/:id/desactivar', ubicacionController.desactivar);

// PATCH /api/ubicaciones/:id/activar - Activar ubicación
router.patch('/:id/activar', ubicacionController.activar);

// DELETE /api/ubicaciones/:id - Eliminar ubicación (solo si no tiene inventario)
router.delete('/:id', ubicacionController.eliminar);

// ============================================
// EXPORTAR
// ============================================

module.exports = router;