// ============================================
// ROUTES: Elementos
// Responsabilidad: Definir URLs de elementos
// ============================================

const express = require('express');
const router = express.Router();
const elementoController = require('../controllers/elementoController');
const { uploadElementoImagen } = require('../../../middleware/upload');

// ============================================
// RUTAS ESPECIALES (van primero)
// ============================================

// GET /api/elementos/buscar?q=termino
router.get('/buscar', elementoController.buscar);

// GET /api/elementos/con-series
router.get('/con-series', elementoController.obtenerConSeries);

// GET /api/elementos/sin-series
router.get('/sin-series', elementoController.obtenerSinSeries);

// GET /api/elementos/categoria/:categoriaId
router.get('/categoria/:categoriaId', elementoController.obtenerPorCategoria);

// GET /api/elementos/subcategoria/:subcategoriaId (alias para mejor semántica)
router.get('/subcategoria/:subcategoriaId', elementoController.obtenerPorCategoria);

// GET /api/elementos/alertas-stock - Alertas de stock bajo
router.get('/alertas-stock', elementoController.obtenerAlertasStock);

// GET /api/elementos/estadisticas-inventario - Estadisticas para dashboard
router.get('/estadisticas-inventario', elementoController.obtenerEstadisticasInventario);

// ============================================
// RUTAS CRUD ESTÁNDAR
// ============================================




// GET /api/elementos - Obtener todos
router.get('/', elementoController.obtenerTodos);

// GET /api/elementos/:id - Obtener uno por ID
router.get('/:id', elementoController.obtenerPorId);

// POST /api/elementos - Crear nuevo
router.post('/', elementoController.crear);

// PUT /api/elementos/:id - Actualizar
router.put('/:id', elementoController.actualizar);

// DELETE /api/elementos/:id - Eliminar
router.delete('/:id', elementoController.eliminar);

// ============================================
// RUTAS DE IMAGEN
// ============================================

// POST /api/elementos/:id/imagen - Subir imagen
router.post('/:id/imagen', uploadElementoImagen, elementoController.subirImagen);

// DELETE /api/elementos/:id/imagen - Eliminar imagen
router.delete('/:id/imagen', elementoController.eliminarImagen);

// ============================================
// EXPORTAR
// ============================================

module.exports = router;