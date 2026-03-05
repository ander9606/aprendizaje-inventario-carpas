-- ============================================================
-- MIGRACIÓN 30: Agregar descuento porcentual a productos individuales
-- Permite aplicar descuento % a cada producto de la cotización
-- ============================================================

-- Agregar columnas de descuento al producto de cotización
ALTER TABLE cotizacion_productos
  ADD COLUMN IF NOT EXISTS descuento_porcentaje DECIMAL(5,2) DEFAULT 0 AFTER precio_adicionales,
  ADD COLUMN IF NOT EXISTS descuento_monto DECIMAL(12,2) DEFAULT 0 AFTER descuento_porcentaje;
