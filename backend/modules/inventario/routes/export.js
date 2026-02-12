// ============================================
// RUTAS: EXPORTACIÓN DE INVENTARIO
// ============================================

const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');

// Exportar inventario completo a Excel
router.get('/export/excel', exportController.exportarExcel);

module.exports = router;
