// ============================================
// ROUTES: Categorías
// Responsabilidad: Definir las URLs y conectar con controllers
// ============================================

const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoriaController');

// ============================================
// DEFINIR RUTAS
// ============================================

// GET /api/categorias - Obtener todas
router.get('/', categoriaController.obtenerTodas);

// GET /api/categorias/padres - Obtener solo las padre
router.get('/padres', categoriaController.obtenerPadres);

// GET /api/categorias/:id - Obtener una por ID
router.get('/:id', categoriaController.obtenerPorId);

// GET /api/categorias/:id/hijas - Obtener subcategorías
router.get('/:id/hijas', categoriaController.obtenerHijas);

// POST /api/categorias - Crear nueva
router.post('/', categoriaController.crear);

// PUT /api/categorias/:id - Actualizar
router.put('/:id', categoriaController.actualizar);

// DELETE /api/categorias/:id - Eliminar
router.delete('/:id', categoriaController.eliminar);

// ============================================
// EXPORTAR
// ============================================

module.exports = router;