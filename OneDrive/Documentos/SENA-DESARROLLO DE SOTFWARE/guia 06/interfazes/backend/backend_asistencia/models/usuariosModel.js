const mongoose = require('mongoose');

/* -------------------------------------------------------------------------- */
/* Modelo: Usuario                                                             */
/* -------------------------------------------------------------------------- */
const usuarioSchema = new mongoose.Schema({
  // Nombre completo del usuario
  nombre: { type: String, required: true },

  // Rol dentro de la empresa. Solo se aceptan los valores indicados.
  rol: {
    type: String,
    enum: ['AuxiliarLogistico', 'Coordinador', 'Administrador', 'JefeMontaje'],
    required: true,
  },

  // Correo electrónico único con validación de formato
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Correo electrónico no válido'],
  },

  // Contraseña (en texto plano por ahora, sin encriptación)
  contraseña: {
    type: String,
    required: true,
    select: false,
  },
}, {
  timestamps: true, // createdAt, updatedAt
});

// Se exporta como parte del módulo
module.exports.Usuario = mongoose.model('Usuario', usuarioSchema);