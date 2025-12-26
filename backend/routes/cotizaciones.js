// ============================================
// ROUTES: Cotizaciones
// ============================================

const express = require('express');
const router = express.Router();
const cotizacionController = require('../controllers/cotizacionController');
const { validateId } = require('../middleware/validator');

// GET /api/cotizaciones - Obtener todas
router.get('/', cotizacionController.obtenerTodas);

// GET /api/cotizaciones/estado/:estado - Obtener por estado
router.get('/estado/:estado', cotizacionController.obtenerPorEstado);

// GET /api/cotizaciones/cliente/:clienteId - Obtener por cliente
router.get('/cliente/:clienteId', cotizacionController.obtenerPorCliente);

// GET /api/cotizaciones/:id - Obtener por ID
router.get('/:id', validateId(), cotizacionController.obtenerPorId);

// GET /api/cotizaciones/:id/detalles - Obtener con detalles
router.get('/:id/detalles', validateId(), cotizacionController.obtenerPorIdConDetalles);

// POST /api/cotizaciones - Crear
router.post('/', cotizacionController.crear);

// PUT /api/cotizaciones/:id - Actualizar
router.put('/:id', validateId(), cotizacionController.actualizar);

// PATCH /api/cotizaciones/:id/estado - Cambiar estado
router.patch('/:id/estado', validateId(), cotizacionController.cambiarEstado);

// POST /api/cotizaciones/:id/aprobar - Aprobar y crear alquiler
router.post('/:id/aprobar', validateId(), cotizacionController.aprobarYCrearAlquiler);

// DELETE /api/cotizaciones/:id - Eliminar
router.delete('/:id', validateId(), cotizacionController.eliminar);

module.exports = router;
