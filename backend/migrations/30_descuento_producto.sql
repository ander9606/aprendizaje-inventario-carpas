-- ============================================================
-- MIGRACIÓN 30: Agregar descuento porcentual a productos individuales
-- Permite aplicar descuento % a cada producto de la cotización
-- ============================================================

-- Agregar columnas de descuento al producto de cotización
-- Nota: MySQL no soporta IF NOT EXISTS en ADD COLUMN.
-- Se usa un procedimiento para verificar antes de agregar.
DROP PROCEDURE IF EXISTS migrar_descuento_producto;

DELIMITER //
CREATE PROCEDURE migrar_descuento_producto()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cotizacion_productos' AND COLUMN_NAME = 'descuento_porcentaje'
  ) THEN
    ALTER TABLE cotizacion_productos
      ADD COLUMN descuento_porcentaje DECIMAL(5,2) DEFAULT 0 AFTER precio_adicionales;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cotizacion_productos' AND COLUMN_NAME = 'descuento_monto'
  ) THEN
    ALTER TABLE cotizacion_productos
      ADD COLUMN descuento_monto DECIMAL(12,2) DEFAULT 0 AFTER descuento_porcentaje;
  END IF;
END //
DELIMITER ;

CALL migrar_descuento_producto();
DROP PROCEDURE IF EXISTS migrar_descuento_producto;
