const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verificarToken } = require('../middleware/authMiddleware');

/**
 * Rutas de Autenticación
 *
 * POST   /api/auth/login            - Iniciar sesión
 * POST   /api/auth/logout           - Cerrar sesión
 * POST   /api/auth/logout-all       - Cerrar todas las sesiones
 * POST   /api/auth/refresh          - Renovar access token
 * GET    /api/auth/me               - Obtener perfil actual
 * PUT    /api/auth/perfil           - Actualizar perfil
 * PUT    /api/auth/password         - Cambiar contraseña
 * GET    /api/auth/sessions         - Ver sesiones activas
 * GET    /api/auth/historial        - Ver historial de actividad
 * POST   /api/auth/registro         - Paso 1: Enviar código de verificación
 * POST   /api/auth/verificar-email  - Paso 2: Verificar código y crear solicitud
 * POST   /api/auth/reenviar-codigo  - Reenviar código de verificación
 * GET    /api/auth/roles-registro   - Roles disponibles para registro
 */

// Rutas públicas (no requieren autenticación)
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/registro', authController.registro);
router.post('/verificar-email', authController.verificarEmail);
router.post('/reenviar-codigo', authController.reenviarCodigo);
router.get('/roles-registro', authController.getRolesRegistro);

// Rutas protegidas (requieren autenticación)
router.post('/logout', verificarToken, authController.logout);
router.post('/logout-all', verificarToken, authController.logoutAll);
router.get('/me', verificarToken, authController.me);
router.put('/perfil', verificarToken, authController.actualizarPerfil);
router.put('/password', verificarToken, authController.cambiarPassword);
router.get('/sessions', verificarToken, authController.getSessions);
router.get('/historial', verificarToken, authController.obtenerHistorial);

module.exports = router;
