-- ============================================================
-- MODIFICACIÓN: Quitar UNIQUE KEY de cotizacion_productos
-- Permite agregar el mismo producto múltiples veces con
-- configuraciones diferentes (adicionales distintos)
-- ============================================================

-- Quitar el índice único
ALTER TABLE cotizacion_productos
DROP INDEX uk_cotizacion_producto;

-- Agregar índice normal para consultas
CREATE INDEX idx_cotprod_cotizacion_compuesto
ON cotizacion_productos(cotizacion_id, compuesto_id);
