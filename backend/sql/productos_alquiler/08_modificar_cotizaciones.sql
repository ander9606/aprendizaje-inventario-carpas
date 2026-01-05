-- ============================================================
-- MIGRACIÓN 08: Modificar tabla cotizaciones
-- Elimina compuesto_id (pasa a tabla pivote cotizacion_productos)
-- ============================================================

-- 1. Eliminar FK a elementos_compuestos
ALTER TABLE cotizaciones
  DROP FOREIGN KEY IF EXISTS cotizaciones_ibfk_2;

-- 2. Eliminar columna compuesto_id
ALTER TABLE cotizaciones
  DROP COLUMN IF EXISTS compuesto_id;

-- 3. Índices para búsquedas
CREATE INDEX IF NOT EXISTS idx_cotizaciones_fecha_evento ON cotizaciones(fecha_evento);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_estado ON cotizaciones(estado);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_cliente_estado ON cotizaciones(cliente_id, estado);
