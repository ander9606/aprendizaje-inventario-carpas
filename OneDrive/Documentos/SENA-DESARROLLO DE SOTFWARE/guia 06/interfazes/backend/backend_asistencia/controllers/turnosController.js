// controllers/turnosController.js

const { Turno } = require('../models/turnoModel');

// Obtener todos los turnos
exports.obtenerTurnos = async (req, res) => {
  try {
    const turnos = await Turno.find();
    res.json(turnos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los turnos' });
  }
};

// Crear nuevo turno
exports.crearTurno = async (req, res) => {
  try {
    const nuevoTurno = new Turno(req.body);
    const guardado = await nuevoTurno.save();
    res.status(201).json(guardado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Buscar turno por ID
exports.obtenerTurnoPorId = async (req, res) => {
  try {
    const turno = await Turno.findById(req.params.id);
    if (!turno) return res.status(404).json({ mensaje: 'Turno no encontrado' });
    res.json(turno);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Actualizar turno
exports.actualizarTurno = async (req, res) => {
  try {
    const actualizado = await Turno.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(actualizado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Eliminar turno
exports.eliminarTurno = async (req, res) => {
  try {
    await Turno.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Turno eliminado' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
