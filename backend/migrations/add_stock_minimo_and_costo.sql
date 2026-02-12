-- ============================================
-- MIGRACION: Agregar stock minimo y costo de adquisicion
-- Columnas opcionales con defaults seguros
-- ============================================

-- Agregar stock minimo a elementos (0 = sin alerta)
ALTER TABLE elementos ADD COLUMN stock_minimo INT DEFAULT 0 AFTER cantidad;

-- Agregar costo de adquisicion a elementos (NULL = sin costo registrado)
ALTER TABLE elementos ADD COLUMN costo_adquisicion DECIMAL(12,2) DEFAULT NULL AFTER stock_minimo;
