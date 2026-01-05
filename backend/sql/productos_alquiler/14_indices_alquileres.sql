-- ============================================================
-- ÍNDICES 14: Tabla alquileres
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_alquileres_estado ON alquileres(estado);
CREATE INDEX IF NOT EXISTS idx_alquileres_fecha_salida ON alquileres(fecha_salida);
CREATE INDEX IF NOT EXISTS idx_alquileres_fecha_retorno ON alquileres(fecha_retorno_esperado);
CREATE INDEX IF NOT EXISTS idx_alquileres_cotizacion ON alquileres(cotizacion_id);
CREATE INDEX IF NOT EXISTS idx_alquileres_estado_fecha ON alquileres(estado, fecha_salida);
