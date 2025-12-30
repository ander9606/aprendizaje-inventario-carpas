-- ============================================================
-- MIGRACIÓN 10: Modificar tabla cotizacion_detalles
-- Agrega referencia a cotizacion_productos
-- ============================================================

-- 1. Agregar columna para referenciar al producto
ALTER TABLE cotizacion_detalles
  ADD COLUMN IF NOT EXISTS cotizacion_producto_id INT DEFAULT NULL AFTER cotizacion_id;

-- 2. Agregar FK
ALTER TABLE cotizacion_detalles
  ADD CONSTRAINT fk_cotdet_producto
  FOREIGN KEY (cotizacion_producto_id) REFERENCES cotizacion_productos(id) ON DELETE CASCADE;

-- 3. Agregar tipo de componente
ALTER TABLE cotizacion_detalles
  ADD COLUMN IF NOT EXISTS tipo ENUM('fijo', 'alternativa', 'adicional') DEFAULT 'fijo' AFTER grupo;

-- 4. Índice
CREATE INDEX idx_cotdet_producto ON cotizacion_detalles(cotizacion_producto_id);
