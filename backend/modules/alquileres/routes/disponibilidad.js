// ============================================
// RUTAS: Disponibilidad
// /api/disponibilidad
// ============================================

const express = require('express');
const router = express.Router();
const disponibilidadController = require('../controllers/disponibilidadController');

// POST /api/disponibilidad/verificar - Verificar disponibilidad de productos (sin cotización)
router.post('/verificar', disponibilidadController.verificarProductos);

// GET /api/disponibilidad/cotizacion/:id - Verificar disponibilidad de cotización existente
router.get('/cotizacion/:id', disponibilidadController.verificarCotizacion);

// GET /api/disponibilidad/calendario - Obtener calendario de ocupación
router.get('/calendario', disponibilidadController.obtenerCalendario);

// POST /api/disponibilidad/descomponer - Descomponer productos en elementos
router.post('/descomponer', disponibilidadController.descomponerProductos);

module.exports = router;
