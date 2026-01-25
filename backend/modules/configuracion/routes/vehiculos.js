const express = require('express');
const router = express.Router();
const vehiculoController = require('../controllers/vehiculoController');
const { verificarToken, verificarRol } = require('../../auth/middleware/authMiddleware');

/**
 * Rutas de Vehículos
 *
 * GET    /api/vehiculos                    - Listar vehículos
 * GET    /api/vehiculos/disponibles        - Vehículos disponibles
 * GET    /api/vehiculos/estadisticas       - Estadísticas de vehículos
 * GET    /api/vehiculos/:id                - Obtener vehículo por ID
 * POST   /api/vehiculos                    - Crear vehículo
 * PUT    /api/vehiculos/:id                - Actualizar vehículo
 * DELETE /api/vehiculos/:id                - Desactivar vehículo
 * POST   /api/vehiculos/:id/uso            - Registrar uso
 * POST   /api/vehiculos/:id/mantenimiento  - Programar mantenimiento
 * PUT    /api/vehiculos/mantenimiento/:id  - Actualizar mantenimiento
 */

// Todas las rutas requieren autenticación
router.use(verificarToken);

// Rutas de consulta (operaciones puede ver)
router.get('/disponibles', verificarRol(['admin', 'gerente', 'operaciones']), vehiculoController.getDisponibles);
router.get('/estadisticas', verificarRol(['admin', 'gerente']), vehiculoController.getEstadisticas);
router.get('/', verificarRol(['admin', 'gerente', 'operaciones']), vehiculoController.getAll);
router.get('/:id', verificarRol(['admin', 'gerente', 'operaciones']), vehiculoController.getById);

// Rutas de modificación
router.post('/', verificarRol(['admin']), vehiculoController.create);
router.put('/mantenimiento/:id', verificarRol(['admin', 'gerente']), vehiculoController.actualizarMantenimiento);
router.put('/:id', verificarRol(['admin', 'gerente']), vehiculoController.update);
router.delete('/:id', verificarRol(['admin']), vehiculoController.remove);

// Rutas de operaciones
router.post('/:id/uso', verificarRol(['admin', 'gerente', 'operaciones']), vehiculoController.registrarUso);
router.post('/:id/mantenimiento', verificarRol(['admin', 'gerente']), vehiculoController.registrarMantenimiento);

module.exports = router;
