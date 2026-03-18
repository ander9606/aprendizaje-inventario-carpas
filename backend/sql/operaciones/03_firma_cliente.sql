-- ============================================
-- MIGRACIÓN: Firma digital del cliente
-- Permite capturar firma al entregar inventario
-- ============================================

ALTER TABLE ordenes_trabajo
ADD COLUMN firma_cliente_url VARCHAR(500) DEFAULT NULL,
ADD COLUMN firma_cliente_fecha DATETIME DEFAULT NULL,
ADD COLUMN firma_cliente_nombre VARCHAR(200) DEFAULT NULL;
