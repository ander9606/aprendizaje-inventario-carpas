-- ============================================================
-- MIGRACIÓN: Modificar tabla cotizaciones
-- Permite múltiples productos (compuesto_id pasa a tabla pivote)
-- El transporte se maneja en tabla separada: cotizacion_transportes
-- ============================================================

-- IMPORTANTE: Ejecutar ANTES de agregar datos nuevos
-- Si ya tienes cotizaciones con compuesto_id, primero migrar esos datos

-- 1. Eliminar la FK a elementos_compuestos (si existe)
-- Nota: El nombre de la FK puede variar, verificar con SHOW CREATE TABLE cotizaciones
ALTER TABLE cotizaciones
  DROP FOREIGN KEY IF EXISTS cotizaciones_ibfk_2;

-- 2. Eliminar columna compuesto_id (ahora será en tabla pivote)
ALTER TABLE cotizaciones
  DROP COLUMN IF EXISTS compuesto_id;

-- 3. Agregar índices para búsquedas frecuentes
CREATE INDEX idx_cotizaciones_fecha_evento ON cotizaciones(fecha_evento);
CREATE INDEX idx_cotizaciones_estado ON cotizaciones(estado);
CREATE INDEX idx_cotizaciones_cliente_estado ON cotizaciones(cliente_id, estado);
