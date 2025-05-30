// routes/turnosRoutes.js

const express = require('express');
const router = express.Router();
const turnosController = require('../controllers/turnosController');

// Obtener todos los turnos
router.get('/', turnosController.obtenerTurnos);

// Crear un nuevo turno
router.post('/', turnosController.crearTurno);

// Obtener un turno por ID
router.get('/:id', turnosController.obtenerTurnoPorId);

// Actualizar un turno por ID
router.put('/:id', turnosController.actualizarTurno);

// Eliminar un turno por ID
router.delete('/:id', turnosController.eliminarTurno);

module.exports = router;
