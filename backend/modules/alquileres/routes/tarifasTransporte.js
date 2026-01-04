// ============================================
// ROUTES: Tarifas de Transporte
// ============================================

const express = require('express');
const router = express.Router();
const tarifaTransporteController = require('../controllers/tarifaTransporteController');
const { validateId } = require('../../../middleware/validator');

// GET /api/tarifas-transporte - Obtener todas
router.get('/', tarifaTransporteController.obtenerTodas);

// GET /api/tarifas-transporte/ciudades - Obtener ciudades únicas
router.get('/ciudades', tarifaTransporteController.obtenerCiudades);

// GET /api/tarifas-transporte/tipos - Obtener tipos de camión únicos
router.get('/tipos', tarifaTransporteController.obtenerTiposCamion);

// GET /api/tarifas-transporte/ciudad/:ciudadId - Obtener por ciudad ID
router.get('/ciudad/:ciudadId', tarifaTransporteController.obtenerPorCiudadId);

// GET /api/tarifas-transporte/buscar?tipoCamion=X&ciudad=Y - Buscar tarifa específica
router.get('/buscar', tarifaTransporteController.buscarTarifa);

// GET /api/tarifas-transporte/:id - Obtener por ID
router.get('/:id', validateId(), tarifaTransporteController.obtenerPorId);

// POST /api/tarifas-transporte - Crear
router.post('/', tarifaTransporteController.crear);

// PUT /api/tarifas-transporte/:id - Actualizar
router.put('/:id', validateId(), tarifaTransporteController.actualizar);

// DELETE /api/tarifas-transporte/:id - Eliminar
router.delete('/:id', validateId(), tarifaTransporteController.eliminar);

module.exports = router;
