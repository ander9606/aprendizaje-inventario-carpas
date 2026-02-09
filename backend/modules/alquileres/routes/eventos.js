// ============================================
// ROUTES: Eventos
// ============================================

const express = require('express');
const router = express.Router();
const eventoController = require('../controllers/eventoController');
const { validateId } = require('../../../middleware/validator');

// GET /api/eventos - Obtener todos
router.get('/', eventoController.obtenerTodos);

// GET /api/eventos/estado/:estado - Obtener por estado
router.get('/estado/:estado', eventoController.obtenerPorEstado);

// GET /api/eventos/cliente/:clienteId - Obtener por cliente
router.get('/cliente/:clienteId', eventoController.obtenerPorCliente);

// GET /api/eventos/:id - Obtener por ID
router.get('/:id', validateId(), eventoController.obtenerPorId);

// GET /api/eventos/:id/cotizaciones - Obtener cotizaciones del evento
router.get('/:id/cotizaciones', validateId(), eventoController.obtenerCotizaciones);

// GET /api/eventos/:id/puede-agregar-cotizacion - Verificar si se pueden agregar cotizaciones
router.get('/:id/puede-agregar-cotizacion', validateId(), eventoController.puedeAgregarCotizacion);

// POST /api/eventos - Crear
router.post('/', eventoController.crear);

// PUT /api/eventos/:id - Actualizar
router.put('/:id', validateId(), eventoController.actualizar);

// PATCH /api/eventos/:id/estado - Cambiar estado
router.patch('/:id/estado', validateId(), eventoController.cambiarEstado);

// DELETE /api/eventos/:id - Eliminar
router.delete('/:id', validateId(), eventoController.eliminar);

module.exports = router;
