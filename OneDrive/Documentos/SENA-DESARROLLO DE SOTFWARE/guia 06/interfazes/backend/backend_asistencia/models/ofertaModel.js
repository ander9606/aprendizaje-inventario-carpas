const mongoose = require('mongoose');
/* Modelo: Oferta (Oferta de trabajo para un evento)                           */
/* -------------------------------------------------------------------------- */
const ofertaSchema = new mongoose.Schema({
  // Título o nombre de la oferta de trabajo (ej. "Montaje carpa concierto")
  titulo: { 
    type: String,
    enum: ["Montaje","Desmontaje","Custodio","Lavado","Mantenimiento"],
    defaul: "Montaje",
    required: true },

  // Descripción detallada de las labores o requisitos
  descripcion: { type: String },

  // Fecha en que se llevará a cabo el evento
  fechaEvento: { type: Date, required: true },

  // Lugar donde se realiza el evento (ciudad, dirección, etc.)
  lugarEvento: { type: String, required: true },

  // Número de trabajadores requeridos para el montaje
  cupos: { type: Number, required: true, min: 1 },

  // Estado actual de la oferta
  estado: {
    type: String,
    enum: ['Abierta', 'Asignada', 'Cerrada'],
    default: 'Abierta',
  },

  // Usuario (Administrador/Coordinador) que creó la oferta
  creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
}, {
  timestamps: true,
});

module.exports.Oferta = mongoose.model('Oferta', ofertaSchema);
