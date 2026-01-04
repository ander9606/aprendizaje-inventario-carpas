-- ============================================================
-- MIGRACIÓN 19: Migración completa a ciudad_id
-- Ejecutar este script para completar la transición
-- ============================================================

-- ============================================
-- PASO 1: Crear tabla ciudades si no existe
-- ============================================
CREATE TABLE IF NOT EXISTS ciudades (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    departamento VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_ciudad_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PASO 2: Migrar ciudades existentes
-- ============================================
INSERT IGNORE INTO ciudades (nombre)
SELECT DISTINCT ciudad FROM tarifas_transporte WHERE ciudad IS NOT NULL AND ciudad != '';

INSERT IGNORE INTO ciudades (nombre)
SELECT DISTINCT ciudad FROM ubicaciones WHERE ciudad IS NOT NULL AND ciudad != '';

-- ============================================
-- PASO 3: Hacer ciudad nullable en tarifas_transporte
-- ============================================
ALTER TABLE tarifas_transporte MODIFY COLUMN ciudad VARCHAR(100) NULL;

-- ============================================
-- PASO 4: Agregar ciudad_id a tarifas_transporte (si no existe)
-- ============================================
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                   WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'tarifas_transporte'
                   AND COLUMN_NAME = 'ciudad_id');

SET @sql = IF(@col_exists = 0,
              'ALTER TABLE tarifas_transporte ADD COLUMN ciudad_id INT AFTER tipo_camion',
              'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- PASO 5: Migrar datos a ciudad_id
-- ============================================
UPDATE tarifas_transporte t
INNER JOIN ciudades c ON t.ciudad = c.nombre
SET t.ciudad_id = c.id
WHERE t.ciudad_id IS NULL;

-- ============================================
-- PASO 6: Hacer ciudad nullable en ubicaciones
-- ============================================
ALTER TABLE ubicaciones MODIFY COLUMN ciudad VARCHAR(100) NULL;

-- ============================================
-- PASO 7: Agregar ciudad_id a ubicaciones (si no existe)
-- ============================================
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                   WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'ubicaciones'
                   AND COLUMN_NAME = 'ciudad_id');

SET @sql = IF(@col_exists = 0,
              'ALTER TABLE ubicaciones ADD COLUMN ciudad_id INT AFTER ciudad',
              'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- PASO 8: Migrar datos de ubicaciones a ciudad_id
-- ============================================
UPDATE ubicaciones u
INNER JOIN ciudades c ON u.ciudad = c.nombre
SET u.ciudad_id = c.id
WHERE u.ciudad_id IS NULL;

-- ============================================
-- PASO 9: Eliminar columnas antiguas y constraints
-- ============================================

-- Eliminar índice único antiguo de tarifas_transporte si existe
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
                     WHERE TABLE_SCHEMA = DATABASE()
                     AND TABLE_NAME = 'tarifas_transporte'
                     AND INDEX_NAME = 'uk_tipo_ciudad');

SET @sql = IF(@index_exists > 0,
              'ALTER TABLE tarifas_transporte DROP INDEX uk_tipo_ciudad',
              'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Eliminar columna ciudad de tarifas_transporte
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                   WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'tarifas_transporte'
                   AND COLUMN_NAME = 'ciudad');

SET @sql = IF(@col_exists > 0,
              'ALTER TABLE tarifas_transporte DROP COLUMN ciudad',
              'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Eliminar columna ciudad de ubicaciones
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                   WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'ubicaciones'
                   AND COLUMN_NAME = 'ciudad');

SET @sql = IF(@col_exists > 0,
              'ALTER TABLE ubicaciones DROP COLUMN ciudad',
              'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- PASO 10: Crear índices y FKs
-- ============================================

-- Índice único para tarifas (si no existe)
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
                     WHERE TABLE_SCHEMA = DATABASE()
                     AND TABLE_NAME = 'tarifas_transporte'
                     AND INDEX_NAME = 'uk_tipo_ciudad_id');

SET @sql = IF(@index_exists = 0,
              'ALTER TABLE tarifas_transporte ADD UNIQUE KEY uk_tipo_ciudad_id (tipo_camion, ciudad_id)',
              'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- FK tarifas -> ciudades (si no existe)
SET @fk_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
                  WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'tarifas_transporte'
                  AND CONSTRAINT_NAME = 'fk_tarifa_ciudad');

SET @sql = IF(@fk_exists = 0,
              'ALTER TABLE tarifas_transporte ADD CONSTRAINT fk_tarifa_ciudad FOREIGN KEY (ciudad_id) REFERENCES ciudades(id)',
              'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- FK ubicaciones -> ciudades (si no existe)
SET @fk_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
                  WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'ubicaciones'
                  AND CONSTRAINT_NAME = 'fk_ubicacion_ciudad');

SET @sql = IF(@fk_exists = 0,
              'ALTER TABLE ubicaciones ADD CONSTRAINT fk_ubicacion_ciudad FOREIGN KEY (ciudad_id) REFERENCES ciudades(id)',
              'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Índices de búsqueda
CREATE INDEX IF NOT EXISTS idx_tarifa_ciudad_id ON tarifas_transporte(ciudad_id);
CREATE INDEX IF NOT EXISTS idx_ubicacion_ciudad_id ON ubicaciones(ciudad_id);

-- ============================================
-- VERIFICACIÓN
-- ============================================
SELECT 'Migración completada. Estructura actual:' as mensaje;

SELECT 'Ciudades:' as tabla, COUNT(*) as registros FROM ciudades
UNION ALL
SELECT 'Tarifas con ciudad_id:' as tabla, COUNT(*) as registros FROM tarifas_transporte WHERE ciudad_id IS NOT NULL
UNION ALL
SELECT 'Ubicaciones con ciudad_id:' as tabla, COUNT(*) as registros FROM ubicaciones WHERE ciudad_id IS NOT NULL;
