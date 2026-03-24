-- ============================================
-- MIGRACIÓN 29: Catálogo de departamentos
-- Crea tabla departamentos y migra datos existentes
-- ============================================

-- 1. Crear tabla departamentos
CREATE TABLE IF NOT EXISTS departamentos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_departamento_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Migrar departamentos existentes desde ciudades
INSERT IGNORE INTO departamentos (nombre)
SELECT DISTINCT departamento
FROM ciudades
WHERE departamento IS NOT NULL AND departamento != '';

-- 3. Agregar columna departamento_id a ciudades si no existe
SET @col_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ciudades'
    AND COLUMN_NAME = 'departamento_id'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE ciudades ADD COLUMN departamento_id INT DEFAULT NULL AFTER departamento',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Migrar datos: asociar ciudades con sus departamentos
UPDATE ciudades c
INNER JOIN departamentos d ON c.departamento = d.nombre
SET c.departamento_id = d.id
WHERE c.departamento IS NOT NULL AND c.departamento != '' AND c.departamento_id IS NULL;

-- 5. Agregar FK (si no existe)
SET @fk_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ciudades'
    AND CONSTRAINT_NAME = 'fk_ciudad_departamento'
);

SET @sql = IF(@fk_exists = 0,
    'ALTER TABLE ciudades ADD CONSTRAINT fk_ciudad_departamento FOREIGN KEY (departamento_id) REFERENCES departamentos(id)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 6. Índice para departamento_id
SET @idx_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ciudades'
    AND INDEX_NAME = 'idx_ciudad_departamento_id'
);

SET @sql = IF(@idx_exists = 0,
    'ALTER TABLE ciudades ADD INDEX idx_ciudad_departamento_id (departamento_id)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
