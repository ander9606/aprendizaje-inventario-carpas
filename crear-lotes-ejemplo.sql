-- ============================================
-- Script para crear lotes de ejemplo
-- ============================================

-- Este script crea lotes para los 3 elementos existentes
-- en la subcategoría "estaca metalica"

-- Lote para elemento 19
INSERT INTO lotes (elemento_id, lote_numero, cantidad, estado, ubicacion, fecha_creacion)
VALUES
  (19, 'LOTE-19-001', 50, 'bueno', 'Bodega A', CURDATE()),
  (19, 'LOTE-19-002', 30, 'nuevo', 'Bodega B', CURDATE());

-- Lote para elemento 21
INSERT INTO lotes (elemento_id, lote_numero, cantidad, estado, ubicacion, fecha_creacion)
VALUES
  (21, 'LOTE-21-001', 100, 'bueno', 'Bodega A', CURDATE()),
  (21, 'LOTE-21-002', 20, 'mantenimiento', 'Taller', CURDATE());

-- Lote para elemento 23
INSERT INTO lotes (elemento_id, lote_numero, cantidad, estado, ubicacion, fecha_creacion)
VALUES
  (23, 'LOTE-23-001', 75, 'nuevo', 'Bodega Principal', CURDATE());

-- Verificar los lotes creados
SELECT
  e.id AS elemento_id,
  e.nombre AS elemento,
  l.lote_numero,
  l.cantidad,
  l.estado,
  l.ubicacion
FROM lotes l
JOIN elementos e ON l.elemento_id = e.id
WHERE e.categoria_id = 25
ORDER BY e.id, l.id;
