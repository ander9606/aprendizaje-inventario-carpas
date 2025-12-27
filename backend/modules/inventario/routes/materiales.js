// ============================================
// RUTAS: MATERIALES
// ============================================

const express = require('express')
const router = express.Router()
const MaterialController = require('../controllers/materialController')

// Obtener todos los materiales
router.get('/', MaterialController.obtenerTodos)

// Obtener un material por ID
router.get('/:id', MaterialController.obtenerPorId)

// Crear material
router.post('/', MaterialController.crear)

// Actualizar material
router.put('/:id', MaterialController.actualizar)

// Eliminar material
router.delete('/:id', MaterialController.eliminar)

module.exports = router
