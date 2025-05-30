const mongoose = require('mongoose');
/* -------------------------------------------------------------------------- */
/* Modelo: Turno (Asignación de un trabajador para una oferta)                */
/* -------------------------------------------------------------------------- */
const turnoSchema = new mongoose.Schema({
  // Trabajador asignado al turno
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },

  // Oferta a la que pertenece el turno (evento específico)
  oferta: { type: mongoose.Schema.Types.ObjectId, ref: 'Oferta', required: true },

  // Hora exacta de inicio del turno
  horaInicio: { type: Date, required: true },

  // Hora exacta de fin del turno (puede completarse al finalizar)
  horaFin: { type: Date },

  // Estado del turno (útil para seguimiento del personal)
  estado: {
    type: String,
    enum: ['Programado', 'Iniciado', 'Finalizado'],
    default: 'Programado',
  },
}, {
  timestamps: true,
});

module.exports.Turno = mongoose.model('Turno', turnoSchema);