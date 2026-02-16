-- ============================================
-- MIGRACIÓN 27: Agregar columna imagen a elementos y elementos_compuestos
-- ============================================

-- Imagen para elementos del inventario
ALTER TABLE elementos
ADD COLUMN imagen VARCHAR(500) DEFAULT NULL
AFTER descripcion;

-- Imagen para plantillas de productos de alquiler
ALTER TABLE elementos_compuestos
ADD COLUMN imagen VARCHAR(500) DEFAULT NULL
AFTER descripcion;
