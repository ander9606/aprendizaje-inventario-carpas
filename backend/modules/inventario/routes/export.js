// ============================================
// RUTAS: EXPORTACIÓN DE INVENTARIO
// ============================================

const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const { verificarToken } = require('../../auth/middleware/authMiddleware');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// Exportar inventario completo a Excel
router.get('/export/excel', exportController.exportarExcel);

module.exports = router;
