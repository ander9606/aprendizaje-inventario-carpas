const express = require('express');
const router = express.Router();
const ordenTrabajoController = require('../controllers/ordenTrabajoController');
const { verificarToken, verificarRol } = require('../../auth/middleware/authMiddleware');

/**
 * Rutas de Operaciones
 *
 * ÓRDENES DE TRABAJO:
 * GET    /api/operaciones/ordenes                           - Listar órdenes
 * GET    /api/operaciones/ordenes/:id                       - Obtener orden por ID
 * GET    /api/operaciones/ordenes/:id/completa              - Orden con info completa de cotización
 * GET    /api/operaciones/alquiler/:id/ordenes              - Órdenes de un alquiler
 * PUT    /api/operaciones/ordenes/:id                       - Actualizar orden
 * PUT    /api/operaciones/ordenes/:id/fecha                 - Cambiar fecha (con validación)
 * PUT    /api/operaciones/ordenes/:id/estado                - Cambiar estado
 * PUT    /api/operaciones/ordenes/:id/equipo                - Asignar equipo
 * PUT    /api/operaciones/ordenes/:id/vehiculo              - Asignar vehículo
 * GET    /api/operaciones/calendario                        - Vista calendario
 * GET    /api/operaciones/estadisticas                      - Estadísticas
 *
 * ELEMENTOS DE ÓRDENES:
 * GET    /api/operaciones/ordenes/:id/elementos             - Elementos de orden
 * PUT    /api/operaciones/ordenes/:id/elementos/:elemId/estado     - Cambiar estado elemento
 * POST   /api/operaciones/ordenes/:id/elementos/:elemId/incidencia - Reportar incidencia
 * POST   /api/operaciones/ordenes/:id/elementos/:elemId/foto       - Subir foto
 *
 * ALERTAS:
 * GET    /api/operaciones/alertas                           - Listar alertas
 * GET    /api/operaciones/alertas/pendientes                - Alertas pendientes
 * GET    /api/operaciones/alertas/resumen                   - Resumen de alertas
 * PUT    /api/operaciones/alertas/:id/resolver              - Resolver alerta
 *
 * VALIDACIÓN:
 * POST   /api/operaciones/validar-fecha                     - Validar cambio de fecha
 */

// Todas las rutas requieren autenticación
router.use(verificarToken);

// ============================================
// RUTAS DE ÓRDENES DE TRABAJO
// ============================================

// Rutas de consulta (operaciones, gerente, admin)
router.get(
    '/calendario',
    verificarRol(['admin', 'gerente', 'operaciones']),
    ordenTrabajoController.getCalendario
);

router.get(
    '/estadisticas',
    verificarRol(['admin', 'gerente']),
    ordenTrabajoController.getEstadisticas
);

router.get(
    '/ordenes',
    verificarRol(['admin', 'gerente', 'operaciones']),
    ordenTrabajoController.getOrdenes
);

// Crear orden manual (mantenimiento, traslado, etc.)
router.post(
    '/ordenes',
    verificarRol(['admin', 'gerente', 'operaciones']),
    ordenTrabajoController.crearOrdenManual
);

router.get(
    '/ordenes/:id',
    verificarRol(['admin', 'gerente', 'operaciones']),
    ordenTrabajoController.getOrdenById
);

router.get(
    '/ordenes/:id/completa',
    verificarRol(['admin', 'gerente', 'operaciones']),
    ordenTrabajoController.getOrdenCompleta
);

router.get(
    '/alquiler/:id/ordenes',
    verificarRol(['admin', 'gerente', 'operaciones', 'ventas']),
    ordenTrabajoController.getOrdenesPorAlquiler
);

// Rutas de modificación
router.put(
    '/ordenes/:id',
    verificarRol(['admin', 'gerente', 'operaciones']),
    ordenTrabajoController.updateOrden
);

router.put(
    '/ordenes/:id/fecha',
    verificarRol(['admin', 'gerente', 'operaciones']),
    ordenTrabajoController.cambiarFechaOrden
);

router.put(
    '/ordenes/:id/estado',
    verificarRol(['admin', 'gerente', 'operaciones']),
    ordenTrabajoController.cambiarEstadoOrden
);

router.put(
    '/ordenes/:id/equipo',
    verificarRol(['admin', 'gerente', 'operaciones']),
    ordenTrabajoController.asignarEquipo
);

router.put(
    '/ordenes/:id/vehiculo',
    verificarRol(['admin', 'gerente', 'operaciones']),
    ordenTrabajoController.asignarVehiculo
);

// ============================================
// RUTAS DE ELEMENTOS DE ÓRDENES
// ============================================

router.get(
    '/ordenes/:id/elementos',
    verificarRol(['admin', 'gerente', 'operaciones']),
    ordenTrabajoController.getElementosOrden
);

router.put(
    '/ordenes/:id/elementos/:elemId/estado',
    verificarRol(['admin', 'gerente', 'operaciones']),
    ordenTrabajoController.cambiarEstadoElemento
);

router.post(
    '/ordenes/:id/elementos/:elemId/incidencia',
    verificarRol(['admin', 'gerente', 'operaciones']),
    ordenTrabajoController.reportarIncidencia
);

router.post(
    '/ordenes/:id/elementos/:elemId/foto',
    verificarRol(['admin', 'gerente', 'operaciones']),
    ordenTrabajoController.subirFotoElemento
);

// ============================================
// RUTAS DE ALERTAS
// ============================================

router.get(
    '/alertas/pendientes',
    verificarRol(['admin', 'gerente', 'operaciones']),
    ordenTrabajoController.getAlertasPendientes
);

router.get(
    '/alertas/resumen',
    verificarRol(['admin', 'gerente']),
    ordenTrabajoController.getResumenAlertas
);

router.get(
    '/alertas',
    verificarRol(['admin', 'gerente', 'operaciones']),
    ordenTrabajoController.getAlertas
);

router.put(
    '/alertas/:id/resolver',
    verificarRol(['admin', 'gerente']),
    ordenTrabajoController.resolverAlerta
);

// ============================================
// RUTAS DE VALIDACIÓN
// ============================================

router.post(
    '/validar-fecha',
    verificarRol(['admin', 'gerente', 'operaciones']),
    ordenTrabajoController.validarCambioFecha
);

module.exports = router;
