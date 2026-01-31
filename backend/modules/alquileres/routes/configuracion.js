// ============================================
// ROUTES: Configuración de Alquileres
// ============================================

const express = require('express');
const router = express.Router();
const configuracionController = require('../controllers/configuracionController');

// GET /api/configuracion - Obtener todas las configuraciones
router.get('/', configuracionController.obtenerTodas);

// GET /api/configuracion/completa - Obtener configuración como objeto
router.get('/completa', configuracionController.obtenerConfiguracionCompleta);

// GET /api/configuracion/categorias - Obtener lista de categorías
router.get('/categorias', configuracionController.obtenerCategorias);

// GET /api/configuracion/categoria/:categoria - Obtener por categoría
router.get('/categoria/:categoria', configuracionController.obtenerPorCategoria);

// GET /api/configuracion/:clave - Obtener valor específico
router.get('/:clave', configuracionController.obtenerValor);

// PUT /api/configuracion/:clave - Actualizar valor específico
router.put('/:clave', configuracionController.actualizarValor);

// PUT /api/configuracion - Actualizar múltiples valores
router.put('/', configuracionController.actualizarValores);

module.exports = router;
