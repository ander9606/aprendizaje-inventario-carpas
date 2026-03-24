-- ============================================
-- MIGRACIÓN 30: Agregar ubicacion_id a cotizaciones
-- Permite vincular cotizaciones con ubicaciones del catálogo
-- para trazabilidad y dashboard (eventos por ubicación, etc.)
-- ============================================

-- Agregar columna ubicacion_id si no existe
SET @existe_col = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cotizaciones' AND COLUMN_NAME = 'ubicacion_id');

SET @sql_col = IF(@existe_col = 0,
  'ALTER TABLE cotizaciones ADD COLUMN ubicacion_id INT NULL DEFAULT NULL AFTER evento_direccion',
  'SELECT 1');
PREPARE stmt FROM @sql_col;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar FK si no existe
SET @existe_fk = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cotizaciones' AND CONSTRAINT_NAME = 'fk_cotizaciones_ubicacion');

SET @sql_fk = IF(@existe_fk = 0,
  'ALTER TABLE cotizaciones ADD CONSTRAINT fk_cotizaciones_ubicacion FOREIGN KEY (ubicacion_id) REFERENCES ubicaciones(id) ON DELETE SET NULL',
  'SELECT 1');
PREPARE stmt FROM @sql_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar índice si no existe
SET @existe_idx = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cotizaciones' AND INDEX_NAME = 'idx_cotizaciones_ubicacion');

SET @sql_idx = IF(@existe_idx = 0,
  'CREATE INDEX idx_cotizaciones_ubicacion ON cotizaciones(ubicacion_id)',
  'SELECT 1');
PREPARE stmt FROM @sql_idx;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
