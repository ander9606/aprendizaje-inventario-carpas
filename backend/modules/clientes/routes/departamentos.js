// ============================================
// ROUTES: Departamentos
// ============================================

const express = require('express');
const router = express.Router();
const departamentoController = require('../controllers/departamentoController');
const { validateId } = require('../../../middleware/validator');
const { verificarToken } = require('../../auth/middleware/authMiddleware');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// GET /api/departamentos - Obtener todos
router.get('/', departamentoController.obtenerTodos);

// GET /api/departamentos/activos - Obtener solo activos
router.get('/activos', departamentoController.obtenerActivos);

// GET /api/departamentos/:id - Obtener por ID
router.get('/:id', validateId(), departamentoController.obtenerPorId);

// POST /api/departamentos - Crear
router.post('/', departamentoController.crear);

// PUT /api/departamentos/:id - Actualizar
router.put('/:id', validateId(), departamentoController.actualizar);

// DELETE /api/departamentos/:id - Eliminar
router.delete('/:id', validateId(), departamentoController.eliminar);

module.exports = router;
