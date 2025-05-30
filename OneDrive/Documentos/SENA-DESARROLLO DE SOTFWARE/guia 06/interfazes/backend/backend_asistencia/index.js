const express = require('express');
const app = express();
const mongoose = require('mongoose');

// Middleware para leer JSON
app.use(express.json());

// Importar rutas
const usuariosRoutes = require('./routes/usuariosRoutes');
const ofertasRoutes = require('./routes/ofertasRoutes');
const turnosRoutes = require('./routes/turnosRoutes');
const asistenciasRoutes = require('./routes/asistenciasRoutes');

// Usar rutas
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/ofertas', ofertasRoutes);
app.use('/api/turnos', turnosRoutes);
app.use('/api/asistencias', asistenciasRoutes);

// Conectar a MongoDB y escuchar servidor
mongoose.connect('mongodb://localhost:27017/asistencia_eventos')
  .then(() => {
    app.listen(3000, () => console.log('Servidor corriendo en puerto 3000'));
  })
  .catch(err => console.error('Error conectando a MongoDB:', err));
// Exportar la aplicación para pruebas
module.exports = app;