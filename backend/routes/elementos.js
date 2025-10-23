// ============================================
// ROUTES: Elementos
// Responsabilidad: Definir URLs de elementos
// ============================================

const express = require('express');
const router = express.Router();
const elementoController = require('../controllers/elementoController');

// ============================================
// RUTAS ESPECIALES (van primero)
// ============================================

// GET /api/elementos/buscar?q=termino
router.get('/buscar', elementoController.buscar);

// GET /api/elementos/con-series
router.get('/con-series', elementoController.obtenerConSeries);

// GET /api/elementos/sin-series
router.get('/sin-series', elementoController.obtenerSinSeries);

// GET /api/elementos/categoria/:categoriaId
router.get('/categoria/:categoriaId', elementoController.obtenerPorCategoria);

// ============================================
// RUTAS CRUD ESTÁNDAR
// ============================================

// GET /api/elementos - Obtener todos
router.get('/', elementoController.obtenerTodos);

// GET /api/elementos/:id - Obtener uno por ID
router.get('/:id', elementoController.obtenerPorId);

// POST /api/elementos - Crear nuevo
router.post('/', elementoController.crear);

// PUT /api/elementos/:id - Actualizar
router.put('/:id', elementoController.actualizar);

// DELETE /api/elementos/:id - Eliminar
router.delete('/:id', elementoController.eliminar);

// ============================================
// EXPORTAR
// ============================================

module.exports = router;