-- ============================================
-- MIGRACIÓN 30: Agregar ubicacion_id a cotizaciones
-- Permite vincular cotizaciones con ubicaciones del catálogo
-- para trazabilidad y dashboard (eventos por ubicación, etc.)
-- ============================================

ALTER TABLE cotizaciones
ADD COLUMN ubicacion_id INT NULL DEFAULT NULL AFTER evento_direccion,
ADD CONSTRAINT fk_cotizaciones_ubicacion
  FOREIGN KEY (ubicacion_id) REFERENCES ubicaciones(id)
  ON DELETE SET NULL;

-- Índice para consultas de dashboard
CREATE INDEX idx_cotizaciones_ubicacion ON cotizaciones(ubicacion_id);
