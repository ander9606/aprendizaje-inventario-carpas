const mongoose = require('mongoose'); 
/* -------------------------------------------------------------------------- */
/* Modelo: Asistencia (Registro de asistencia de un turno)                     */
/* -------------------------------------------------------------------------- */
const asistenciaSchema = new mongoose.Schema({
  // Trabajador que registró la asistencia
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },

  // Turno al que corresponde la asistencia
  turno: { type: mongoose.Schema.Types.ObjectId, ref: 'Turno', required: true },

  // Hora exacta de entrada
  horaEntrada: { type: Date, required: true },

  // Hora exacta de salida (puede ser null hasta que se registre la salida)
  horaSalida: { type: Date },

  // Estado de la asistencia
  estado: {
    type: String,
    enum: ['Presente', 'Tarde', 'Ausente'],
    default: 'Presente',
  },
}, {
  timestamps: true,
});

module.exports.Asistencia = mongoose.model('Asistencia', asistenciaSchema);

