// ============================================
// ROUTES: Descuentos
// ============================================

const express = require('express');
const router = express.Router();
const descuentoController = require('../controllers/descuentoController');
const { validateId } = require('../../../middleware/validator');

// ============================================
// CATÁLOGO DE DESCUENTOS
// ============================================

// GET /api/descuentos - Obtener todos los descuentos
router.get('/', descuentoController.obtenerTodos);

// GET /api/descuentos/:id - Obtener descuento por ID
router.get('/:id', validateId(), descuentoController.obtenerPorId);

// POST /api/descuentos - Crear nuevo descuento
router.post('/', descuentoController.crear);

// PUT /api/descuentos/:id - Actualizar descuento
router.put('/:id', validateId(), descuentoController.actualizar);

// DELETE /api/descuentos/:id - Eliminar descuento (soft delete)
router.delete('/:id', validateId(), descuentoController.eliminar);

module.exports = router;
