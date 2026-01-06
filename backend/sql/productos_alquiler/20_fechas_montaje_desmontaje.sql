-- ============================================================
-- MIGRACIÓN: Agregar fechas de montaje y desmontaje
-- Modifica la tabla cotizaciones para tener 3 fechas:
-- - fecha_montaje: cuando se monta
-- - fecha_evento: el evento (ya existe)
-- - fecha_desmontaje: cuando se desmonta (renombra fecha_fin_evento)
-- ============================================================

-- Agregar columna fecha_montaje antes de fecha_evento
ALTER TABLE cotizaciones
ADD COLUMN fecha_montaje DATE NULL AFTER evento_ciudad;

-- Renombrar fecha_fin_evento a fecha_desmontaje
ALTER TABLE cotizaciones
CHANGE COLUMN fecha_fin_evento fecha_desmontaje DATE NULL;

-- Actualizar registros existentes: si no tienen fecha_montaje, usar fecha_evento
UPDATE cotizaciones
SET fecha_montaje = fecha_evento
WHERE fecha_montaje IS NULL;

-- Actualizar registros existentes: si no tienen fecha_desmontaje, usar fecha_evento
UPDATE cotizaciones
SET fecha_desmontaje = fecha_evento
WHERE fecha_desmontaje IS NULL;
