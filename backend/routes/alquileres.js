// ============================================
// ROUTES: Alquileres
// ============================================

const express = require('express');
const router = express.Router();
const alquilerController = require('../controllers/alquilerController');
const { validateId } = require('../middleware/validator');

// GET /api/alquileres - Obtener todos
router.get('/', alquilerController.obtenerTodos);

// GET /api/alquileres/activos - Obtener activos
router.get('/activos', alquilerController.obtenerActivos);

// GET /api/alquileres/programados - Obtener programados
router.get('/programados', alquilerController.obtenerProgramados);

// GET /api/alquileres/estado/:estado - Obtener por estado
router.get('/estado/:estado', alquilerController.obtenerPorEstado);

// GET /api/alquileres/fechas?fechaInicio=X&fechaFin=Y - Por rango de fechas
router.get('/fechas', alquilerController.obtenerPorRangoFechas);

// GET /api/alquileres/:id - Obtener por ID
router.get('/:id', validateId(), alquilerController.obtenerPorId);

// POST /api/alquileres/:id/salida - Marcar salida
router.post('/:id/salida', validateId(), alquilerController.marcarSalida);

// POST /api/alquileres/:id/retorno - Marcar retorno
router.post('/:id/retorno', validateId(), alquilerController.marcarRetorno);

// POST /api/alquileres/:id/cancelar - Cancelar
router.post('/:id/cancelar', validateId(), alquilerController.cancelar);

module.exports = router;
