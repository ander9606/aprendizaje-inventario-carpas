// routes/asistenciasRoutes.js

const express = require('express');
const router = express.Router();
const asistenciasController = require('../controllers/asistenciasController');

// Obtener todas las asistencias
router.get('/', asistenciasController.obtenerAsistencias);

// Crear una nueva asistencia
router.post('/', asistenciasController.crearAsistencia);

// Obtener una asistencia por su ID
router.get('/:id', asistenciasController.obtenerAsistenciaPorId);

// Actualizar una asistencia por ID
router.put('/:id', asistenciasController.actualizarAsistencia);

// Eliminar una asistencia por ID
router.delete('/:id', asistenciasController.eliminarAsistencia);

module.exports = router;
