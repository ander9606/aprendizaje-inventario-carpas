// ============================================
// ROUTES: Unidades
// Responsabilidad: Definir URLs de unidades
// ============================================

const express = require('express');
const router = express.Router();
const unidadController = require('../controllers/unidadController');

// ============================================
// RUTAS ESPECIALES (van primero)
// ============================================

// GET /api/unidades/mas-usadas
router.get('/mas-usadas', unidadController.obtenerMasUsadas);

// GET /api/unidades/tipo/:tipo
router.get('/tipo/:tipo', unidadController.obtenerPorTipo);

// ============================================
// RUTAS CRUD ESTÁNDAR
// ============================================

// GET /api/unidades - Obtener todas
router.get('/', unidadController.obtenerTodas);

// GET /api/unidades/:id - Obtener una por ID
router.get('/:id', unidadController.obtenerPorId);

// POST /api/unidades - Crear nueva
router.post('/', unidadController.crear);

// PUT /api/unidades/:id - Actualizar
router.put('/:id', unidadController.actualizar);

// DELETE /api/unidades/:id - Eliminar
router.delete('/:id', unidadController.eliminar);

// ============================================
// EXPORTAR
// ============================================

module.exports = router;