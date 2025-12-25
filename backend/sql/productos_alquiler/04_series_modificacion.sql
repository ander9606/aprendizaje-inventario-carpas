-- ============================================================
-- MODIFICACIÓN: tabla series
-- Orden de ejecución: 4 (depende de: elementos_compuestos)
-- ============================================================
-- Agrega campo compuesto_id para marcar qué series están asignadas
-- a un elemento compuesto específico
--
-- Una serie con compuesto_id = NULL está disponible para asignar
-- Una serie con compuesto_id = X está reservada para ese producto

-- ============================================================
-- AGREGAR COLUMNA compuesto_id
-- ============================================================

-- Verificar si la columna ya existe
SET @columnExists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'series'
      AND COLUMN_NAME = 'compuesto_id'
);

-- Solo agregar si no existe
SET @sql = IF(@columnExists = 0,
    'ALTER TABLE series ADD COLUMN compuesto_id INT DEFAULT NULL COMMENT ''ID del elemento compuesto al que pertenece (NULL=disponible para asignar)''',
    'SELECT ''La columna compuesto_id ya existe en series'' AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- ============================================================
-- AGREGAR FOREIGN KEY
-- ============================================================

SET @fkExists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'series'
      AND CONSTRAINT_NAME = 'fk_serie_compuesto'
);

SET @sql = IF(@fkExists = 0,
    'ALTER TABLE series ADD CONSTRAINT fk_serie_compuesto FOREIGN KEY (compuesto_id) REFERENCES elementos_compuestos(id) ON DELETE SET NULL',
    'SELECT ''La FK fk_serie_compuesto ya existe'' AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- ============================================================
-- AGREGAR ÍNDICE
-- ============================================================

SET @idxExists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'series'
      AND INDEX_NAME = 'idx_serie_compuesto'
);

SET @sql = IF(@idxExists = 0,
    'ALTER TABLE series ADD INDEX idx_serie_compuesto (compuesto_id)',
    'SELECT ''El índice idx_serie_compuesto ya existe'' AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- ============================================================
-- VERIFICACIÓN
-- ============================================================

SELECT '✅ Tabla series modificada (campo compuesto_id)' AS resultado;

-- Mostrar estructura actualizada
SELECT
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'series'
  AND COLUMN_NAME = 'compuesto_id';
