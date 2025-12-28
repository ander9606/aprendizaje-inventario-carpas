// ============================================
// ROUTES: Elementos Compuestos (Plantillas)
// ============================================

const express = require('express');
const router = express.Router();
const elementoCompuestoController = require('../controllers/elementoCompuestoController');
const { validateId } = require('../../../middleware/validator');

// GET /api/elementos-compuestos - Obtener todos
router.get('/', elementoCompuestoController.obtenerTodos);

// GET /api/elementos-compuestos/buscar?q=termino - Buscar
router.get('/buscar', elementoCompuestoController.buscar);

// GET /api/elementos-compuestos/categoria/:categoriaId - Obtener por categoría
router.get('/categoria/:categoriaId', elementoCompuestoController.obtenerPorCategoria);

// GET /api/elementos-compuestos/:id - Obtener por ID
router.get('/:id', validateId(), elementoCompuestoController.obtenerPorId);

// GET /api/elementos-compuestos/:id/completo - Obtener con componentes
router.get('/:id/completo', validateId(), elementoCompuestoController.obtenerPorIdConComponentes);

// GET /api/elementos-compuestos/:id/componentes - Obtener componentes agrupados
router.get('/:id/componentes', validateId(), elementoCompuestoController.obtenerComponentesAgrupados);

// POST /api/elementos-compuestos - Crear
router.post('/', elementoCompuestoController.crear);

// PUT /api/elementos-compuestos/:id - Actualizar
router.put('/:id', validateId(), elementoCompuestoController.actualizar);

// DELETE /api/elementos-compuestos/:id - Eliminar
router.delete('/:id', validateId(), elementoCompuestoController.eliminar);

// ============================================
// RUTAS DE COMPONENTES
// ============================================

// POST /api/elementos-compuestos/:id/componentes - Agregar componente
router.post('/:id/componentes', validateId(), elementoCompuestoController.agregarComponente);

// PUT /api/elementos-compuestos/:id/componentes - Reemplazar todos los componentes
router.put('/:id/componentes', validateId(), elementoCompuestoController.actualizarComponentes);

// DELETE /api/elementos-compuestos/:id/componentes/:componenteId - Eliminar componente
router.delete('/:id/componentes/:componenteId', validateId(), elementoCompuestoController.eliminarComponente);

module.exports = router;
