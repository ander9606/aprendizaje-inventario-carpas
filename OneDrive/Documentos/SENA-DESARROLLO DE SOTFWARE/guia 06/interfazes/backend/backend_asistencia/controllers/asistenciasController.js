// controllers/asistenciasController.js

const { Asistencia } = require('../models/asistenciaModel');

// Obtener todas las asistencias
exports.obtenerAsistencias = async (req, res) => {
  try {
    const asistencias = await Asistencia.find();
    res.json(asistencias);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las asistencias' });
  }
};

// Crear nueva asistencia
exports.crearAsistencia = async (req, res) => {
  try {
    const nuevaAsistencia = new Asistencia(req.body);
    const guardado = await nuevaAsistencia.save();
    res.status(201).json(guardado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Buscar asistencia por ID
exports.obtenerAsistenciaPorId = async (req, res) => {
  try {
    const asistencia = await Asistencia.findById(req.params.id);
    if (!asistencia) return res.status(404).json({ mensaje: 'Asistencia no encontrada' });
    res.json(asistencia);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Actualizar asistencia
exports.actualizarAsistencia = async (req, res) => {
  try {
    const actualizada = await Asistencia.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(actualizada);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Eliminar asistencia
exports.eliminarAsistencia = async (req, res) => {
  try {
    await Asistencia.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Asistencia eliminada' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
// Exportar el controlador