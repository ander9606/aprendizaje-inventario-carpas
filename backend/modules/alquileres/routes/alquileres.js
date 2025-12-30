// ============================================
// ROUTES: Alquileres
// ============================================

const express = require('express');
const router = express.Router();
const alquilerController = require('../controllers/alquilerController');
const { validateId } = require('../../../middleware/validator');

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

// GET /api/alquileres/estadisticas - Obtener estadísticas
router.get('/estadisticas', alquilerController.obtenerEstadisticas);

// GET /api/alquileres/:id - Obtener por ID
router.get('/:id', validateId(), alquilerController.obtenerPorId);

// GET /api/alquileres/:id/completo - Obtener con productos y elementos
router.get('/:id/completo', validateId(), alquilerController.obtenerCompleto);

// GET /api/alquileres/:id/elementos - Obtener elementos asignados
router.get('/:id/elementos', validateId(), alquilerController.obtenerElementos);

// POST /api/alquileres/:id/salida - Marcar salida
router.post('/:id/salida', validateId(), alquilerController.marcarSalida);

// POST /api/alquileres/:id/retorno - Marcar retorno
router.post('/:id/retorno', validateId(), alquilerController.marcarRetorno);

// POST /api/alquileres/:id/cancelar - Cancelar
router.post('/:id/cancelar', validateId(), alquilerController.cancelar);

// ============================================
// ELEMENTOS (Series/Lotes)
// ============================================

// POST /api/alquileres/:id/elementos - Asignar elementos
router.post('/:id/elementos', validateId(), alquilerController.asignarElementos);

// POST /api/alquileres/:id/elementos/:elementoId/retorno - Registrar retorno de elemento
router.post('/:id/elementos/:elementoId/retorno', validateId(), alquilerController.registrarRetornoElemento);

module.exports = router;
