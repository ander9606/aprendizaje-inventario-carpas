// controllers/ofertasController.js

const { Oferta } = require('../models/ofertaModel');

// Obtener todas las ofertas
exports.obtenerOfertas = async (req, res) => {
  try {
    const ofertas = await Oferta.find();
    res.json(ofertas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las ofertas' });
  }
};

// Crear nueva oferta
exports.crearOferta = async (req, res) => {
  try {
    const nuevaOferta = new Oferta(req.body);
    const guardado = await nuevaOferta.save();
    res.status(201).json(guardado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Buscar oferta por ID
exports.obtenerOfertaPorId = async (req, res) => {
  try {
    const oferta = await Oferta.findById(req.params.id);
    if (!oferta) return res.status(404).json({ mensaje: 'Oferta no encontrada' });
    res.json(oferta);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Actualizar oferta
exports.actualizarOferta = async (req, res) => {
  try {
    const actualizada = await Oferta.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(actualizada);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Eliminar oferta
exports.eliminarOferta = async (req, res) => {
  try {
    await Oferta.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Oferta eliminada' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
