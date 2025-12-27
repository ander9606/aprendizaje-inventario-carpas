// ============================================
// ROUTES: Clientes
// ============================================

const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');
const { validateId } = require('../../../middleware/validator');

// GET /api/clientes - Obtener todos
router.get('/', clienteController.obtenerTodos);

// GET /api/clientes/activos - Obtener solo activos
router.get('/activos', clienteController.obtenerActivos);

// GET /api/clientes/buscar?q=termino - Buscar
router.get('/buscar', clienteController.buscar);

// GET /api/clientes/:id - Obtener por ID
router.get('/:id', validateId(), clienteController.obtenerPorId);

// POST /api/clientes - Crear
router.post('/', clienteController.crear);

// PUT /api/clientes/:id - Actualizar
router.put('/:id', validateId(), clienteController.actualizar);

// DELETE /api/clientes/:id - Eliminar
router.delete('/:id', validateId(), clienteController.eliminar);

module.exports = router;
