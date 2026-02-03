// ============================================
// RUTAS: Alertas de Alquileres
// ============================================

const express = require('express');
const router = express.Router();
const alertasController = require('../controllers/alertasController');
const { verificarToken, verificarRol } = require('../../auth/middleware/authMiddleware');

/**
 * Rutas de Alertas de Alquileres
 *
 * GET  /api/alertas/alquileres           - Obtener todas las alertas
 * GET  /api/alertas/alquileres/criticas  - Solo alertas críticas
 * GET  /api/alertas/alquileres/resumen   - Resumen con conteos
 * POST /api/alertas/alquileres/ignorar   - Ignorar alerta por X días
 * POST /api/alertas/alquileres/limpiar   - Limpiar alertas expiradas (admin)
 */

// Todas las rutas requieren autenticación
router.use(verificarToken);

// Obtener todas las alertas
router.get(
  '/',
  verificarRol(['admin', 'gerente', 'operaciones', 'ventas']),
  alertasController.getAlertas
);

// Obtener solo alertas críticas
router.get(
  '/criticas',
  verificarRol(['admin', 'gerente', 'operaciones', 'ventas']),
  alertasController.getAlertasCriticas
);

// Obtener resumen de alertas
router.get(
  '/resumen',
  verificarRol(['admin', 'gerente', 'operaciones', 'ventas']),
  alertasController.getResumen
);

// Ignorar una alerta
router.post(
  '/ignorar',
  verificarRol(['admin', 'gerente', 'operaciones', 'ventas']),
  alertasController.ignorarAlerta
);

// Limpiar alertas expiradas (solo admin)
router.post(
  '/limpiar',
  verificarRol(['admin']),
  alertasController.limpiarExpiradas
);

module.exports = router;
