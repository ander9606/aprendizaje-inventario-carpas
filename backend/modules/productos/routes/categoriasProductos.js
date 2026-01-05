// ============================================
// ROUTES: Categorías de Productos
// ============================================

const express = require('express');
const router = express.Router();
const categoriaProductoController = require('../controllers/categoriaProductoController');
const { validateId } = require('../../../middleware/validator');

// GET /api/categorias-productos - Obtener todas (plano)
router.get('/', categoriaProductoController.obtenerTodas);

// GET /api/categorias-productos/activas - Obtener solo activas (plano)
router.get('/activas', categoriaProductoController.obtenerActivas);

// GET /api/categorias-productos/arbol - Obtener todas en árbol jerárquico
router.get('/arbol', categoriaProductoController.obtenerArbol);

// GET /api/categorias-productos/activas/arbol - Obtener activas en árbol
router.get('/activas/arbol', categoriaProductoController.obtenerActivasArbol);

// GET /api/categorias-productos/:id - Obtener por ID
router.get('/:id', validateId(), categoriaProductoController.obtenerPorId);

// GET /api/categorias-productos/:id/hijos - Obtener subcategorías
router.get('/:id/hijos', validateId(), categoriaProductoController.obtenerHijos);

// POST /api/categorias-productos - Crear
router.post('/', categoriaProductoController.crear);

// PUT /api/categorias-productos/:id - Actualizar
router.put('/:id', validateId(), categoriaProductoController.actualizar);

// DELETE /api/categorias-productos/:id - Eliminar
router.delete('/:id', validateId(), categoriaProductoController.eliminar);

module.exports = router;
