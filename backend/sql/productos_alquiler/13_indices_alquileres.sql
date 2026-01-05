-- ============================================================
-- ÍNDICES ADICIONALES: Tabla alquileres
-- Mejora el rendimiento de consultas frecuentes
-- ============================================================

-- Índices para la tabla alquileres (si no existen)
CREATE INDEX IF NOT EXISTS idx_alquileres_estado ON alquileres(estado);
CREATE INDEX IF NOT EXISTS idx_alquileres_fecha_salida ON alquileres(fecha_salida);
CREATE INDEX IF NOT EXISTS idx_alquileres_fecha_retorno ON alquileres(fecha_retorno_esperado);
CREATE INDEX IF NOT EXISTS idx_alquileres_cotizacion ON alquileres(cotizacion_id);

-- Índice compuesto para dashboard de alquileres
CREATE INDEX IF NOT EXISTS idx_alquileres_estado_fecha ON alquileres(estado, fecha_salida);
