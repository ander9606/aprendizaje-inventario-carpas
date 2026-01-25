const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verificarToken } = require('../middleware/authMiddleware');

/**
 * Rutas de Autenticación
 *
 * POST   /api/auth/login      - Iniciar sesión
 * POST   /api/auth/logout     - Cerrar sesión
 * POST   /api/auth/logout-all - Cerrar todas las sesiones
 * POST   /api/auth/refresh    - Renovar access token
 * GET    /api/auth/me         - Obtener perfil actual
 * PUT    /api/auth/password   - Cambiar contraseña
 * GET    /api/auth/sessions   - Ver sesiones activas
 */

// Rutas públicas (no requieren autenticación)
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);

// Rutas protegidas (requieren autenticación)
router.post('/logout', verificarToken, authController.logout);
router.post('/logout-all', verificarToken, authController.logoutAll);
router.get('/me', verificarToken, authController.me);
router.put('/password', verificarToken, authController.cambiarPassword);
router.get('/sessions', verificarToken, authController.getSessions);

module.exports = router;
