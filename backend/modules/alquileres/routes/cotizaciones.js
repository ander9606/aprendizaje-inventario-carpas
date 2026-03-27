// ============================================
// ROUTES: Cotizaciones
// ============================================

const express = require('express');
const router = express.Router();
const cotizacionController = require('../controllers/cotizacionController');
const descuentoController = require('../controllers/descuentoController');
const { validateId } = require('../../../middleware/validator');
const { verificarToken } = require('../../auth/middleware/authMiddleware');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// GET /api/cotizaciones - Obtener todas
router.get('/', cotizacionController.obtenerTodas);

// GET /api/cotizaciones/estado/:estado - Obtener por estado
router.get('/estado/:estado', cotizacionController.obtenerPorEstado);

// GET /api/cotizaciones/cliente/:clienteId - Obtener por cliente
router.get('/cliente/:clienteId', cotizacionController.obtenerPorCliente);

// GET /api/cotizaciones/cliente/:clienteId/ubicaciones - Ubicaciones usadas por cliente
router.get('/cliente/:clienteId/ubicaciones', cotizacionController.obtenerUbicacionesCliente);

// GET /api/cotizaciones/:id - Obtener por ID
router.get('/:id', validateId(), cotizacionController.obtenerPorId);

// GET /api/cotizaciones/:id/completa - Obtener completa (productos + transporte)
router.get('/:id/completa', validateId(), cotizacionController.obtenerCompleta);

// GET /api/cotizaciones/:id/disponibilidad - Verificar disponibilidad de elementos
router.get('/:id/disponibilidad', validateId(), cotizacionController.verificarDisponibilidad);

// GET /api/cotizaciones/:id/pdf - Generar y descargar PDF
router.get('/:id/pdf', validateId(), cotizacionController.generarPDF);

// POST /api/cotizaciones - Crear
router.post('/', cotizacionController.crear);

// PUT /api/cotizaciones/:id - Actualizar
router.put('/:id', validateId(), cotizacionController.actualizar);

// PATCH /api/cotizaciones/:id/estado - Cambiar estado
router.patch('/:id/estado', validateId(), cotizacionController.cambiarEstado);

// PATCH /api/cotizaciones/:id/confirmar-fechas - Confirmar fechas de un borrador
router.patch('/:id/confirmar-fechas', validateId(), cotizacionController.confirmarFechas);

// PATCH /api/cotizaciones/:id/deposito - Actualizar cobro de depósito
router.patch('/:id/deposito', validateId(), cotizacionController.actualizarCobrarDeposito);

// PATCH /api/cotizaciones/:id/evento - Asignar/desvincular evento
router.patch('/:id/evento', validateId(), cotizacionController.asignarEvento);

// POST /api/cotizaciones/:id/aprobar - Aprobar y crear alquiler
router.post('/:id/aprobar', validateId(), cotizacionController.aprobarYCrearAlquiler);

// DELETE /api/cotizaciones/:id - Eliminar
router.delete('/:id', validateId(), cotizacionController.eliminar);

// ============================================
// PRODUCTOS
// ============================================

// POST /api/cotizaciones/:id/productos - Agregar producto
router.post('/:id/productos', validateId(), cotizacionController.agregarProducto);

// DELETE /api/cotizaciones/:id/productos/:productoId - Eliminar producto
router.delete('/:id/productos/:productoId', validateId(), cotizacionController.eliminarProducto);

// ============================================
// TRANSPORTE
// ============================================

// POST /api/cotizaciones/:id/transporte - Agregar transporte
router.post('/:id/transporte', validateId(), cotizacionController.agregarTransporte);

// DELETE /api/cotizaciones/:id/transporte/:transporteId - Eliminar transporte
router.delete('/:id/transporte/:transporteId', validateId(), cotizacionController.eliminarTransporte);

// ============================================
// RECARGOS POR PRODUCTO
// ============================================

// GET /api/cotizaciones/:id/productos/:productoId/recargos - Obtener recargos
router.get('/:id/productos/:productoId/recargos', validateId(), cotizacionController.obtenerRecargosProducto);

// POST /api/cotizaciones/:id/productos/:productoId/recargos - Agregar recargo
router.post('/:id/productos/:productoId/recargos', validateId(), cotizacionController.agregarRecargoProducto);

// PUT /api/cotizaciones/:id/productos/:productoId/recargos/:recargoId - Actualizar recargo
router.put('/:id/productos/:productoId/recargos/:recargoId', validateId(), cotizacionController.actualizarRecargoProducto);

// DELETE /api/cotizaciones/:id/productos/:productoId/recargos/:recargoId - Eliminar recargo
router.delete('/:id/productos/:productoId/recargos/:recargoId', validateId(), cotizacionController.eliminarRecargoProducto);

// ============================================
// DUPLICAR
// ============================================

// POST /api/cotizaciones/:id/duplicar - Duplicar cotización
router.post('/:id/duplicar', validateId(), cotizacionController.duplicar);

// ============================================
// SEGUIMIENTO
// ============================================

// GET /api/cotizaciones/:id/seguimiento - Obtener datos de seguimiento
router.get('/:id/seguimiento', validateId(), cotizacionController.obtenerSeguimiento);

// POST /api/cotizaciones/:id/seguimiento - Registrar seguimiento
router.post('/:id/seguimiento', validateId(), cotizacionController.registrarSeguimiento);

// ============================================
// DESCUENTOS
// ============================================

// GET /api/cotizaciones/:id/descuentos - Obtener descuentos de una cotización
router.get('/:id/descuentos', validateId(), descuentoController.obtenerDeCotizacion);

// POST /api/cotizaciones/:id/descuentos - Aplicar descuento a cotización
router.post('/:id/descuentos', validateId(), descuentoController.aplicarACotizacion);

// DELETE /api/cotizaciones/:id/descuentos/:descuentoAplicadoId - Eliminar descuento de cotización
router.delete('/:id/descuentos/:descuentoAplicadoId', validateId(), descuentoController.eliminarDeCotizacion);

module.exports = router;
