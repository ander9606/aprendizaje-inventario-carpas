// ============================================
// ROUTES: Eventos
// ============================================

const express = require('express');
const router = express.Router();
const eventoController = require('../controllers/eventoController');
const { validateId } = require('../../../middleware/validator');
const { verificarToken } = require('../../auth/middleware/authMiddleware');

// Todas las rutas requieren autenticación
router.use(verificarToken);

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

// GET /api/eventos/:id/novedades - Novedades consolidadas del evento
router.get('/:id/novedades', validateId(), eventoController.obtenerNovedadesEvento);

// POST /api/eventos - Crear
router.post('/', eventoController.crear);

// POST /api/eventos/:id/repetir - Repetir evento con nuevas fechas y mismos productos
router.post('/:id/repetir', validateId(), eventoController.repetir);

// PUT /api/eventos/:id - Actualizar
router.put('/:id', validateId(), eventoController.actualizar);

// PATCH /api/eventos/:id/estado - Cambiar estado
router.patch('/:id/estado', validateId(), eventoController.cambiarEstado);

// DELETE /api/eventos/:id - Eliminar
router.delete('/:id', validateId(), eventoController.eliminar);

module.exports = router;
