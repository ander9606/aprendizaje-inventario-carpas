-- ============================================================
-- MIGRACIÓN 18: Agregar ciudad_id a tarifas_transporte y ubicaciones
-- Relacionar tablas con el catálogo de ciudades
-- ============================================================

-- ============================================
-- PASO 1: Agregar columna ciudad_id a tarifas_transporte
-- ============================================
ALTER TABLE tarifas_transporte
ADD COLUMN ciudad_id INT AFTER tipo_camion;

-- Migrar datos existentes
UPDATE tarifas_transporte t
INNER JOIN ciudades c ON t.ciudad = c.nombre
SET t.ciudad_id = c.id;

-- Agregar FK después de migrar datos
ALTER TABLE tarifas_transporte
ADD CONSTRAINT fk_tarifa_ciudad FOREIGN KEY (ciudad_id) REFERENCES ciudades(id);

-- Eliminar columna antigua (opcional - descomentar cuando esté listo)
-- ALTER TABLE tarifas_transporte DROP COLUMN ciudad;

-- Actualizar índice único
ALTER TABLE tarifas_transporte DROP INDEX uk_tipo_ciudad;
ALTER TABLE tarifas_transporte ADD UNIQUE KEY uk_tipo_ciudad_id (tipo_camion, ciudad_id);

-- ============================================
-- PASO 2: Agregar columna ciudad_id a ubicaciones
-- ============================================
ALTER TABLE ubicaciones
ADD COLUMN ciudad_id INT AFTER ciudad;

-- Migrar datos existentes
UPDATE ubicaciones u
INNER JOIN ciudades c ON u.ciudad = c.nombre
SET u.ciudad_id = c.id;

-- Agregar FK después de migrar datos
ALTER TABLE ubicaciones
ADD CONSTRAINT fk_ubicacion_ciudad FOREIGN KEY (ciudad_id) REFERENCES ciudades(id);

-- Eliminar columna antigua (opcional - descomentar cuando esté listo)
-- ALTER TABLE ubicaciones DROP COLUMN ciudad;

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX idx_tarifa_ciudad_id ON tarifas_transporte(ciudad_id);
CREATE INDEX idx_ubicacion_ciudad_id ON ubicaciones(ciudad_id);
