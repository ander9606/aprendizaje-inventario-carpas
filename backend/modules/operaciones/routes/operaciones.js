const express = require('express');
const router = express.Router();
const ordenTrabajoController = require('../controllers/ordenTrabajoController');
const novedadController = require('../controllers/novedadController');
const { verificarToken, verificarRol } = require('../../auth/middleware/authMiddleware');
const verificarAccesoOrden = require('../middleware/verificarAccesoOrden');

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
 * POST   /api/operaciones/ordenes/:id/auto-asignar          - Auto-asignarse
 * PUT    /api/operaciones/ordenes/:id/responder-asignacion  - Aceptar/rechazar asignación
 * GET    /api/operaciones/mis-alertas                       - Alertas del empleado
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

// Rutas sin :id (listados, calendario, estadísticas)
router.get(
    '/calendario',
    verificarRol(['admin', 'gerente', 'operaciones', 'bodega']),
    ordenTrabajoController.getCalendario
);

router.get(
    '/estadisticas',
    verificarRol(['admin', 'gerente']),
    ordenTrabajoController.getEstadisticas
);

router.get(
    '/ordenes',
    verificarRol(['admin', 'gerente', 'operaciones', 'bodega']),
    ordenTrabajoController.getOrdenes
);

// Crear orden manual (mantenimiento, traslado, etc.)
router.post(
    '/ordenes',
    verificarRol(['admin', 'gerente', 'operaciones']),
    ordenTrabajoController.crearOrdenManual
);

// Mis alertas (asignaciones pendientes del empleado actual)
router.get(
    '/mis-alertas',
    verificarRol(['admin', 'gerente', 'operaciones', 'bodega']),
    ordenTrabajoController.getMisAlertas
);

// Órdenes de un alquiler
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

// ============================================
// RUTAS DE ASIGNACIÓN (sin verificarAccesoOrden)
// Estas rutas necesitan funcionar antes de que el
// empleado tenga acceso aceptado a la orden
// ============================================

// Asignar equipo (admin/gerente asigna responsables)
router.put(
    '/ordenes/:id/equipo',
    verificarRol(['admin', 'gerente', 'operaciones']),
    ordenTrabajoController.asignarEquipo
);

// Auto-asignarse como responsable (no requiere acceso previo)
router.post(
    '/ordenes/:id/auto-asignar',
    verificarRol(['operaciones', 'bodega']),
    ordenTrabajoController.autoAsignarse
);

// Aceptar o rechazar asignación (empleado con asignación pendiente)
router.put(
    '/ordenes/:id/responder-asignacion',
    verificarRol(['admin', 'gerente', 'operaciones', 'bodega']),
    ordenTrabajoController.responderAsignacion
);

// ============================================
// RUTAS PROTEGIDAS POR verificarAccesoOrden
// Solo responsables asignados (aceptados) o admin/gerente
// ============================================

// Consulta de orden
router.get(
    '/ordenes/:id',
    verificarRol(['admin', 'gerente', 'operaciones', 'bodega']),
    verificarAccesoOrden,
    ordenTrabajoController.getOrdenById
);

router.get(
    '/ordenes/:id/completa',
    verificarRol(['admin', 'gerente', 'operaciones', 'bodega']),
    verificarAccesoOrden,
    ordenTrabajoController.getOrdenCompleta
);

// Modificación de orden
router.put(
    '/ordenes/:id',
    verificarRol(['admin', 'gerente', 'operaciones']),
    verificarAccesoOrden,
    ordenTrabajoController.updateOrden
);

router.put(
    '/ordenes/:id/fecha',
    verificarRol(['admin', 'gerente', 'operaciones']),
    verificarAccesoOrden,
    ordenTrabajoController.cambiarFechaOrden
);

router.put(
    '/ordenes/:id/estado',
    verificarRol(['admin', 'gerente', 'operaciones']),
    verificarAccesoOrden,
    ordenTrabajoController.cambiarEstadoOrden
);

router.put(
    '/ordenes/:id/vehiculo',
    verificarRol(['admin', 'gerente', 'operaciones']),
    verificarAccesoOrden,
    ordenTrabajoController.asignarVehiculo
);

// ============================================
// RUTAS DE PREPARACIÓN Y EJECUCIÓN
// ============================================

router.get(
    '/ordenes/:id/elementos-disponibles',
    verificarRol(['admin', 'gerente', 'operaciones']),
    verificarAccesoOrden,
    ordenTrabajoController.getElementosDisponibles
);

router.post(
    '/ordenes/:id/preparar-elementos',
    verificarRol(['admin', 'gerente', 'operaciones']),
    verificarAccesoOrden,
    ordenTrabajoController.prepararElementos
);

router.post(
    '/ordenes/:id/ejecutar-salida',
    verificarRol(['admin', 'gerente', 'operaciones']),
    verificarAccesoOrden,
    ordenTrabajoController.ejecutarSalida
);

router.post(
    '/ordenes/:id/ejecutar-retorno',
    verificarRol(['admin', 'gerente', 'operaciones']),
    verificarAccesoOrden,
    ordenTrabajoController.ejecutarRetorno
);

router.get(
    '/ordenes/:id/alertas',
    verificarRol(['admin', 'gerente', 'operaciones']),
    verificarAccesoOrden,
    ordenTrabajoController.getAlertasPorOrden
);

// ============================================
// RUTAS DE INVENTARIO CLIENTE
// ============================================

router.get(
    '/ordenes/:id/inventario-cliente',
    verificarRol(['admin', 'gerente', 'operaciones']),
    verificarAccesoOrden,
    ordenTrabajoController.getInventarioCliente
);

// ============================================
// RUTAS DE DURACIONES
// ============================================

router.get(
    '/ordenes/:id/duraciones',
    verificarRol(['admin', 'gerente', 'operaciones']),
    verificarAccesoOrden,
    ordenTrabajoController.getDuracionesOrden
);

// ============================================
// RUTAS DE CHECKLIST CARGUE / DESCARGUE
// ============================================

router.get(
    '/ordenes/:id/checklist',
    verificarRol(['admin', 'gerente', 'operaciones']),
    verificarAccesoOrden,
    ordenTrabajoController.getChecklistOrden
);

router.put(
    '/ordenes/:id/elementos/:elemId/verificar-cargue',
    verificarRol(['admin', 'gerente', 'operaciones']),
    verificarAccesoOrden,
    ordenTrabajoController.verificarElementoCargue
);

router.put(
    '/ordenes/:id/elementos/:elemId/verificar-descargue',
    verificarRol(['admin', 'gerente', 'operaciones']),
    verificarAccesoOrden,
    ordenTrabajoController.verificarElementoDescargue
);

router.put(
    '/ordenes/:id/elementos/:elemId/verificar-bodega',
    verificarRol(['admin', 'gerente', 'operaciones']),
    verificarAccesoOrden,
    ordenTrabajoController.verificarElementoBodega
);

// Marcar/desmarcar daño en elemento del checklist
router.put(
    '/ordenes/:id/elementos/:elemId/marcar-dano',
    verificarRol(['admin', 'gerente', 'operaciones']),
    verificarAccesoOrden,
    ordenTrabajoController.marcarDanoElemento
);

// Generar orden de mantenimiento desde elementos dañados
router.post(
    '/ordenes/:id/generar-mantenimiento',
    verificarRol(['admin', 'gerente', 'operaciones']),
    verificarAccesoOrden,
    ordenTrabajoController.generarOrdenMantenimiento
);

// Completar orden de mantenimiento con resultados por elemento
router.post(
    '/ordenes/:id/completar-mantenimiento',
    verificarRol(['admin', 'gerente', 'operaciones']),
    verificarAccesoOrden,
    ordenTrabajoController.completarMantenimiento
);

// ============================================
// RUTAS DE NOVEDADES
// ============================================

router.post(
    '/ordenes/:id/novedades',
    verificarRol(['admin', 'gerente', 'operaciones']),
    verificarAccesoOrden,
    novedadController.crearNovedad
);

router.get(
    '/ordenes/:id/novedades',
    verificarRol(['admin', 'gerente', 'operaciones']),
    verificarAccesoOrden,
    novedadController.obtenerNovedadesOrden
);

router.get(
    '/novedades/pendientes',
    verificarRol(['admin', 'gerente']),
    novedadController.obtenerNovedadesPendientes
);

router.put(
    '/novedades/:id/resolver',
    verificarRol(['admin', 'gerente']),
    novedadController.resolverNovedad
);

// ============================================
// RUTAS DE FIRMA CLIENTE
// ============================================

router.post(
    '/ordenes/:id/firma-cliente',
    verificarRol(['admin', 'gerente', 'operaciones']),
    verificarAccesoOrden,
    ordenTrabajoController.guardarFirmaCliente
);

router.get(
    '/ordenes/:id/firma-cliente',
    verificarRol(['admin', 'gerente', 'operaciones']),
    verificarAccesoOrden,
    ordenTrabajoController.obtenerFirmaCliente
);

// ============================================
// RUTAS DE FOTOS OPERATIVAS
// ============================================

router.post(
    '/ordenes/:id/fotos',
    verificarRol(['admin', 'gerente', 'operaciones']),
    verificarAccesoOrden,
    ordenTrabajoController.subirFotoOrden
);

router.get(
    '/ordenes/:id/fotos',
    verificarRol(['admin', 'gerente', 'operaciones']),
    verificarAccesoOrden,
    ordenTrabajoController.obtenerFotosOrden
);

router.delete(
    '/ordenes/:id/fotos/:fotoId',
    verificarRol(['admin', 'gerente']),
    ordenTrabajoController.eliminarFotoOrden
);

// ============================================
// RUTAS DE ELEMENTOS DE ÓRDENES
// ============================================

router.get(
    '/ordenes/:id/elementos',
    verificarRol(['admin', 'gerente', 'operaciones']),
    verificarAccesoOrden,
    ordenTrabajoController.getElementosOrden
);

router.put(
    '/ordenes/:id/elementos/:elemId/estado',
    verificarRol(['admin', 'gerente', 'operaciones']),
    verificarAccesoOrden,
    ordenTrabajoController.cambiarEstadoElemento
);

router.put(
    '/ordenes/:id/elementos/estado-masivo',
    verificarRol(['admin', 'gerente', 'operaciones']),
    verificarAccesoOrden,
    ordenTrabajoController.cambiarEstadoElementosMasivo
);

router.post(
    '/ordenes/:id/elementos/:elemId/incidencia',
    verificarRol(['admin', 'gerente', 'operaciones']),
    verificarAccesoOrden,
    ordenTrabajoController.reportarIncidencia
);

router.post(
    '/ordenes/:id/elementos/:elemId/foto',
    verificarRol(['admin', 'gerente', 'operaciones']),
    verificarAccesoOrden,
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
