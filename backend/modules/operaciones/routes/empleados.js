const express = require('express');
const router = express.Router();
const empleadoController = require('../controllers/empleadoController');
const { verificarToken, verificarRol } = require('../../auth/middleware/authMiddleware');

/**
 * Rutas de Empleados
 *
 * GET    /api/empleados                    - Listar empleados
 * GET    /api/empleados/roles              - Listar roles disponibles
 * GET    /api/empleados/estadisticas       - Estadísticas de empleados
 * GET    /api/empleados/disponibles/campo  - Empleados disponibles para campo
 * GET    /api/empleados/:id                - Obtener empleado por ID
 * POST   /api/empleados                    - Crear empleado
 * PUT    /api/empleados/:id                - Actualizar empleado
 * PUT    /api/empleados/:id/reactivar      - Reactivar empleado
 * PUT    /api/empleados/:id/password       - Cambiar contraseña (admin)
 * DELETE /api/empleados/:id                - Desactivar empleado
 */

// Todas las rutas requieren autenticación
router.use(verificarToken);

// Rutas de consulta (gerente puede ver)
router.get('/roles', empleadoController.getRoles);
router.get('/estadisticas', verificarRol(['admin', 'gerente']), empleadoController.getEstadisticas);
router.get('/disponibles/campo', verificarRol(['admin', 'gerente', 'operaciones']), empleadoController.getDisponiblesCampo);
router.get('/', verificarRol(['admin', 'gerente']), empleadoController.getAll);
router.get('/:id', verificarRol(['admin', 'gerente']), empleadoController.getById);

// Rutas de modificación (solo admin)
router.post('/', verificarRol(['admin']), empleadoController.create);
router.put('/:id', verificarRol(['admin']), empleadoController.update);
router.put('/:id/reactivar', verificarRol(['admin']), empleadoController.reactivar);
router.put('/:id/password', verificarRol(['admin']), empleadoController.cambiarPassword);
router.delete('/:id', verificarRol(['admin']), empleadoController.remove);

module.exports = router;
