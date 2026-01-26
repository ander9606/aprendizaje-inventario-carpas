-- ============================================================
-- MIGRACIÓN: Agregar campos para días extra e IVA
-- Agrega campos para:
-- - Días adicionales de montaje/desmontaje con cobro
-- - Desglose de subtotales (productos, transporte)
-- - Cálculo de IVA (19% Colombia)
-- ============================================================

-- ============================================================
-- PASO 1: Campos para días adicionales
-- ============================================================

-- Días extra de montaje (después de fecha_montaje)
ALTER TABLE cotizaciones
ADD COLUMN dias_montaje_extra INT DEFAULT 0 AFTER fecha_montaje;

-- Días extra de desmontaje (después de fecha_desmontaje)
ALTER TABLE cotizaciones
ADD COLUMN dias_desmontaje_extra INT DEFAULT 0 AFTER fecha_desmontaje;

-- Porcentaje de cobro por día adicional (default 15%)
ALTER TABLE cotizaciones
ADD COLUMN porcentaje_dias_extra DECIMAL(5,2) DEFAULT 15.00 AFTER dias_desmontaje_extra;

-- Monto calculado por días extra
ALTER TABLE cotizaciones
ADD COLUMN cobro_dias_extra DECIMAL(12,2) DEFAULT 0 AFTER porcentaje_dias_extra;

-- ============================================================
-- PASO 2: Campos para desglose de totales
-- ============================================================

-- Subtotal solo de productos (después de subtotal existente)
ALTER TABLE cotizaciones
ADD COLUMN subtotal_productos DECIMAL(12,2) DEFAULT 0 AFTER subtotal;

-- Subtotal solo de transporte
ALTER TABLE cotizaciones
ADD COLUMN subtotal_transporte DECIMAL(12,2) DEFAULT 0 AFTER subtotal_productos;

-- Total de descuentos aplicados (después de descuento existente)
ALTER TABLE cotizaciones
ADD COLUMN total_descuentos DECIMAL(12,2) DEFAULT 0 AFTER descuento;

-- ============================================================
-- PASO 3: Campos para IVA
-- ============================================================

-- Base gravable (subtotal - descuentos)
ALTER TABLE cotizaciones
ADD COLUMN base_gravable DECIMAL(12,2) DEFAULT 0 AFTER total_descuentos;

-- Porcentaje de IVA (default 19% Colombia)
ALTER TABLE cotizaciones
ADD COLUMN porcentaje_iva DECIMAL(5,2) DEFAULT 19.00 AFTER base_gravable;

-- Valor calculado del IVA
ALTER TABLE cotizaciones
ADD COLUMN valor_iva DECIMAL(12,2) DEFAULT 0 AFTER porcentaje_iva;

-- ============================================================
-- PASO 4: Actualizar registros existentes
-- ============================================================

-- Copiar subtotal existente a subtotal_productos para mantener compatibilidad
UPDATE cotizaciones
SET subtotal_productos = subtotal
WHERE subtotal_productos = 0 AND subtotal > 0 AND id > 0;

-- Copiar descuento existente a total_descuentos
UPDATE cotizaciones
SET total_descuentos = descuento
WHERE total_descuentos = 0 AND descuento > 0 AND id > 0;

-- Calcular base_gravable para registros existentes
UPDATE cotizaciones
SET base_gravable = (subtotal - descuento)
WHERE base_gravable = 0 AND subtotal > 0 AND id > 0;

-- Calcular IVA para registros existentes (19%)
UPDATE cotizaciones
SET valor_iva = (base_gravable * 0.19)
WHERE valor_iva = 0 AND base_gravable > 0 AND id > 0;

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
SELECT
    'Migración 21 completada' AS mensaje,
    COUNT(*) AS total_cotizaciones,
    SUM(CASE WHEN dias_montaje_extra IS NOT NULL THEN 1 ELSE 0 END) AS con_dias_extra,
    SUM(CASE WHEN valor_iva > 0 THEN 1 ELSE 0 END) AS con_iva_calculado
FROM cotizaciones;
