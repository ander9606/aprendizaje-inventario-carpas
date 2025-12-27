// ============================================
// ROUTES: Series
// Responsabilidad: Definir URLs de series
// ============================================

const express = require('express');
const router = express.Router();
const serieController = require('../controllers/serieController');

// ============================================
// RUTAS ESPECIALES (van primero)
// ============================================

// GET /api/series/disponibles
router.get('/disponibles', serieController.obtenerDisponibles);

// GET /api/series/alquiladas
router.get('/alquiladas', serieController.obtenerAlquiladas);

// GET /api/series/estado/:estado
router.get('/estado/:estado', serieController.obtenerPorEstado);

// GET /api/series/elemento/:elementoId
router.get('/elemento/:elementoId', serieController.obtenerPorElemento);

// GET /api/series/numero/:numeroSerie
router.get('/numero/:numeroSerie', serieController.obtenerPorNumeroSerie);

// ============================================
// RUTAS CRUD ESTÁNDAR
// ============================================

// GET /api/series - Obtener todas
router.get('/', serieController.obtenerTodas);

// GET /api/series/:id - Obtener una por ID
router.get('/:id', serieController.obtenerPorId);

// POST /api/series - Crear nueva
router.post('/', serieController.crear);

// PUT /api/series/:id - Actualizar
router.put('/:id', serieController.actualizar);

// PATCH /api/series/:id/estado - Cambiar solo el estado
router.patch('/:id/estado', serieController.cambiarEstado);

// DELETE /api/series/:id - Eliminar
router.delete('/:id', serieController.eliminar);

// ============================================
// EXPORTAR
// ============================================

module.exports = router;