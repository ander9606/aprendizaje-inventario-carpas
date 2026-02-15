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

// Estado de sincronización de un alquiler
router.get(
    '/alquiler/:id/sincronizacion',
    verificarRol(['admin', 'gerente', 'operaciones']),
    ordenTrabajoController.getEstadoSincronizacion
);

// Verificar consistencia entre orden y alquiler
router.get(
    '/alquiler/:id/verificar-consistencia',
    verificarRol(['admin', 'gerente']),
    ordenTrabajoController.verificarConsistencia
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
// RUTAS DE PREPARACIÓN Y EJECUCIÓN
// ============================================

// Obtener elementos disponibles para asignar a la orden
router.get(
    '/ordenes/:id/elementos-disponibles',
    verificarRol(['admin', 'gerente', 'operaciones']),
    ordenTrabajoController.getElementosDisponibles
);

// Preparar orden: asignar elementos (series/lotes)
router.post(
    '/ordenes/:id/preparar-elementos',
    verificarRol(['admin', 'gerente', 'operaciones']),
    ordenTrabajoController.prepararElementos
);

// Ejecutar salida (para órdenes de montaje)
router.post(
    '/ordenes/:id/ejecutar-salida',
    verificarRol(['admin', 'gerente', 'operaciones']),
    ordenTrabajoController.ejecutarSalida
);

// Ejecutar retorno (para órdenes de desmontaje)
router.post(
    '/ordenes/:id/ejecutar-retorno',
    verificarRol(['admin', 'gerente', 'operaciones']),
    ordenTrabajoController.ejecutarRetorno
);

// Alertas de una orden específica
router.get(
    '/ordenes/:id/alertas',
    verificarRol(['admin', 'gerente', 'operaciones']),
    ordenTrabajoController.getAlertasPorOrden
);

// ============================================
// RUTAS DE INVENTARIO CLIENTE
// ============================================

// Generar inventario para el cliente (montaje completado)
router.get(
    '/ordenes/:id/inventario-cliente',
    verificarRol(['admin', 'gerente', 'operaciones']),
    ordenTrabajoController.getInventarioCliente
);

// ============================================
// RUTAS DE DURACIONES
// ============================================

// Obtener historial de estados y duraciones de una orden
router.get(
    '/ordenes/:id/duraciones',
    verificarRol(['admin', 'gerente', 'operaciones']),
    ordenTrabajoController.getDuracionesOrden
);

// ============================================
// RUTAS DE CHECKLIST CARGUE / DESCARGUE
// ============================================

// Obtener estado del checklist de la orden
router.get(
    '/ordenes/:id/checklist',
    verificarRol(['admin', 'gerente', 'operaciones']),
    ordenTrabajoController.getChecklistOrden
);

// Toggle verificación de cargue de un elemento
router.put(
    '/ordenes/:id/elementos/:elemId/verificar-cargue',
    verificarRol(['admin', 'gerente', 'operaciones']),
    ordenTrabajoController.verificarElementoCargue
);

// Toggle verificación de descargue de un elemento
router.put(
    '/ordenes/:id/elementos/:elemId/verificar-descargue',
    verificarRol(['admin', 'gerente', 'operaciones']),
    ordenTrabajoController.verificarElementoDescargue
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

// Cambiar estado de múltiples elementos (operaciones masivas)
router.put(
    '/ordenes/:id/elementos/estado-masivo',
    verificarRol(['admin', 'gerente', 'operaciones']),
    ordenTrabajoController.cambiarEstadoElementosMasivo
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

router.post(
    '/alertas',
    verificarRol(['admin', 'gerente', 'operaciones']),
    ordenTrabajoController.crearAlerta
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
