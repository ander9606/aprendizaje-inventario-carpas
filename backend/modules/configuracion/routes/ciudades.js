// ============================================
// ROUTES: Ciudades
// ============================================

const express = require('express');
const router = express.Router();
const ciudadController = require('../controllers/ciudadController');
const { validateId } = require('../../../middleware/validator');

// GET /api/ciudades - Obtener todas
router.get('/', ciudadController.obtenerTodas);

// GET /api/ciudades/activas - Obtener solo activas
router.get('/activas', ciudadController.obtenerActivas);

// GET /api/ciudades/:id - Obtener por ID
router.get('/:id', validateId(), ciudadController.obtenerPorId);

// POST /api/ciudades - Crear
router.post('/', ciudadController.crear);

// PUT /api/ciudades/:id - Actualizar
router.put('/:id', validateId(), ciudadController.actualizar);

// DELETE /api/ciudades/:id - Eliminar
router.delete('/:id', validateId(), ciudadController.eliminar);

// PATCH /api/ciudades/:id/desactivar - Desactivar
router.patch('/:id/desactivar', validateId(), ciudadController.desactivar);

module.exports = router;
