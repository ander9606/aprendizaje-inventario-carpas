-- ============================================
-- SCRIPT: Limpiar lotes con cantidad 0
-- ============================================
-- Este script elimina todos los lotes que tienen cantidad = 0
-- Estos lotes deberían haberse eliminado automáticamente,
-- pero pueden existir por movimientos antiguos o migraciones.

USE aprendizaje_inventario;

-- Mostrar lotes que serán eliminados (para verificar)
SELECT
    l.id,
    l.lote_numero,
    l.cantidad,
    l.estado,
    l.ubicacion,
    e.nombre AS elemento_nombre
FROM lotes l
LEFT JOIN elementos e ON l.elemento_id = e.id
WHERE l.cantidad = 0;

-- DESCOMENTAR LA SIGUIENTE LÍNEA PARA ELIMINAR
-- DELETE FROM lotes WHERE cantidad = 0;

-- Verificar que no quedan lotes vacíos
-- SELECT COUNT(*) AS lotes_vacios_restantes FROM lotes WHERE cantidad = 0;
