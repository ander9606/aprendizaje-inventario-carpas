-- ============================================
-- MIGRACION: Agregar precio unitario a elementos
-- Precio de venta/alquiler por unidad (separado del costo de adquisicion)
-- ============================================

ALTER TABLE elementos ADD COLUMN precio_unitario DECIMAL(12,2) DEFAULT NULL AFTER costo_adquisicion;
