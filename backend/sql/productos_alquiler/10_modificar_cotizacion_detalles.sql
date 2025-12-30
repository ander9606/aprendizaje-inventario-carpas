-- ============================================================
-- MIGRACIÓN: Modificar tabla cotizacion_detalles
-- Ahora referencia a cotizacion_productos para saber a qué
-- producto pertenece cada componente seleccionado
-- ============================================================

-- 1. Agregar columna para referenciar al producto de la cotización
ALTER TABLE cotizacion_detalles
  ADD COLUMN cotizacion_producto_id INT DEFAULT NULL AFTER cotizacion_id;

-- 2. Agregar FK a cotizacion_productos
ALTER TABLE cotizacion_detalles
  ADD CONSTRAINT fk_cotdet_producto
  FOREIGN KEY (cotizacion_producto_id) REFERENCES cotizacion_productos(id)
  ON DELETE CASCADE;

-- 3. Agregar columna para tipo de componente (heredado de compuesto_componentes)
ALTER TABLE cotizacion_detalles
  ADD COLUMN tipo ENUM('fijo', 'alternativa', 'adicional') DEFAULT 'fijo' AFTER grupo;

-- 4. Índice para búsquedas
CREATE INDEX idx_cotdet_producto ON cotizacion_detalles(cotizacion_producto_id);
