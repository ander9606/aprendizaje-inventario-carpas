// ============================================
// ROUTES: Materiales
// Responsabilidad: Definir URLs de materiales
// ============================================

const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');

// ============================================
// RUTAS ESPECIALES (van primero)
// ============================================

// GET /api/materiales/buscar?q=termino
router.get('/buscar', materialController.buscar);

// GET /api/materiales/mas-usados
router.get('/mas-usados', materialController.obtenerMasUsados);

// ============================================
// RUTAS CRUD ESTÁNDAR
// ============================================

// GET /api/materiales - Obtener todos
router.get('/', materialController.obtenerTodos);

// GET /api/materiales/:id - Obtener uno por ID
router.get('/:id', materialController.obtenerPorId);

// POST /api/materiales - Crear nuevo
router.post('/', materialController.crear);

// PUT /api/materiales/:id - Actualizar
router.put('/:id', materialController.actualizar);

// DELETE /api/materiales/:id - Eliminar
router.delete('/:id', materialController.eliminar);

// ============================================
// EXPORTAR
// ============================================

module.exports = router;