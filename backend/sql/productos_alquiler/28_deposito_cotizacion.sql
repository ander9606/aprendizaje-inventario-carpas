-- ============================================
-- MIGRACIÓN 28: Agregar campos de depósito a cotizaciones
-- Permite controlar si se cobra depósito y almacenar el valor calculado
-- ============================================

-- Campo para indicar si se debe cobrar depósito (1 = sí, 0 = no)
ALTER TABLE cotizaciones
ADD COLUMN cobrar_deposito TINYINT(1) NOT NULL DEFAULT 1
AFTER valor_iva;

-- Campo para almacenar el valor total del depósito calculado
ALTER TABLE cotizaciones
ADD COLUMN valor_deposito DECIMAL(12, 2) NOT NULL DEFAULT 0
AFTER cobrar_deposito;
