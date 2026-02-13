// ============================================
// ROUTES: Lotes
// Responsabilidad: Definir URLs de lotes
// ============================================

const express = require('express');
const router = express.Router();
const loteController = require('../controllers/loteController');

// ============================================
// RUTAS ESPECIALES (van primero)
// ============================================

// POST /api/lotes/movimiento - Mover cantidad entre lotes (PRINCIPAL)
router.post('/movimiento', loteController.moverCantidad);

// GET /api/lotes/resumen - Resumen de disponibilidad de todos los elementos
router.get('/resumen', loteController.obtenerResumenDisponibilidad);

// GET /api/lotes/estado/:estado - Obtener lotes por estado
router.get('/estado/:estado', loteController.obtenerPorEstado);

// GET /api/lotes/verificar-existe - Verificar si existe lote con misma ubicación+estado
router.get('/verificar-existe', loteController.verificarExistencia);

// GET /api/lotes/elemento/:elementoId - Obtener lotes de un elemento
router.get('/elemento/:elementoId', loteController.obtenerPorElemento);

// GET /api/lotes/elemento/:elementoId/contexto - Lotes con info de eventos ✨ NUEVO
router.get('/elemento/:elementoId/contexto', loteController.obtenerPorElementoConContexto);

// GET /api/lotes/elemento/:elementoId/alquileres - Desglose por eventos ✨ NUEVO
router.get('/elemento/:elementoId/alquileres', loteController.obtenerDesgloseAlquileres);

// ============================================
// RUTAS CRUD ESTÁNDAR
// ============================================

// GET /api/lotes - Obtener todos los lotes
router.get('/', loteController.obtenerTodos);

// GET /api/lotes/:id - Obtener un lote por ID
router.get('/:id', loteController.obtenerPorId);

// GET /api/lotes/:id/historial - Obtener historial de movimientos de un lote
router.get('/:id/historial', loteController.obtenerHistorial);

// POST /api/lotes - Crear lote manualmente
router.post('/', loteController.crear);

// PUT /api/lotes/:id - Actualizar lote (cantidad, ubicación)
router.put('/:id', loteController.actualizar);

// DELETE /api/lotes/:id - Eliminar lote (solo si cantidad = 0)
router.delete('/:id', loteController.eliminar);

// ============================================
// EXPORTAR
// ============================================

module.exports = router;