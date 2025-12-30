-- ============================================================
-- MIGRACIÓN: Modificar tabla cotizaciones
-- Permite múltiples productos y agrega campos de transporte
-- ============================================================

-- IMPORTANTE: Ejecutar este script ANTES de agregar datos nuevos
-- Si ya tienes cotizaciones con compuesto_id, primero migrar esos datos

-- 1. Eliminar la FK a elementos_compuestos (si existe)
-- Nota: El nombre de la FK puede variar, verificar con SHOW CREATE TABLE cotizaciones
ALTER TABLE cotizaciones
  DROP FOREIGN KEY IF EXISTS cotizaciones_ibfk_2;

-- 2. Eliminar columna compuesto_id (ahora será en tabla pivote)
ALTER TABLE cotizaciones
  DROP COLUMN IF EXISTS compuesto_id;

-- 3. Agregar campos de transporte y ubicación
ALTER TABLE cotizaciones
  ADD COLUMN ubicacion_id INT DEFAULT NULL AFTER evento_ciudad,
  ADD COLUMN cantidad_camiones INT DEFAULT 1 AFTER ubicacion_id,
  ADD COLUMN costo_transporte_unitario DECIMAL(12,2) DEFAULT 0 AFTER cantidad_camiones,
  ADD COLUMN costo_transporte DECIMAL(12,2) DEFAULT 0 AFTER costo_transporte_unitario;

-- 4. Agregar FK a ubicaciones
ALTER TABLE cotizaciones
  ADD CONSTRAINT fk_cotizaciones_ubicacion
  FOREIGN KEY (ubicacion_id) REFERENCES ubicaciones(id)
  ON DELETE SET NULL;

-- 5. Agregar índices para búsquedas frecuentes
CREATE INDEX idx_cotizaciones_fecha_evento ON cotizaciones(fecha_evento);
CREATE INDEX idx_cotizaciones_estado ON cotizaciones(estado);
CREATE INDEX idx_cotizaciones_cliente_estado ON cotizaciones(cliente_id, estado);
