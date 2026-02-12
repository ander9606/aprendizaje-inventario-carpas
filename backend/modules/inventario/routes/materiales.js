// ============================================
// RUTAS: MATERIALES
// ============================================

const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');

// Obtener todos los materiales
router.get('/', materialController.obtenerTodos);

// Obtener un material por ID
router.get('/:id', materialController.obtenerPorId);

// Crear material
router.post('/', materialController.crear);

// Actualizar material
router.put('/:id', materialController.actualizar);

// Eliminar material
router.delete('/:id', materialController.eliminar);

module.exports = router;
