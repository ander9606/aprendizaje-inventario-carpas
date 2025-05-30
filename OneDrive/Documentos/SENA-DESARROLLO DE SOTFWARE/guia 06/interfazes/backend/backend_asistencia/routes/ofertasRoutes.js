// routes/ofertasRoutes.js

const express = require('express');
const router = express.Router();
const ofertasController = require('../controllers/ofertasController');

// Obtener todas las ofertas
router.get('/', ofertasController.obtenerOfertas);

// Crear una nueva oferta
router.post('/', ofertasController.crearOferta);

// Obtener una oferta por ID
router.get('/:id', ofertasController.obtenerOfertaPorId);

// Actualizar una oferta por ID
router.put('/:id', ofertasController.actualizarOferta);

// Eliminar una oferta por ID
router.delete('/:id', ofertasController.eliminarOferta);

module.exports = router;
// Exporta el router para usarlo en otros archivos
// routes/ofertasRoutes.js