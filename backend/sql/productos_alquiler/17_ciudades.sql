-- ============================================================
-- TABLA 17: ciudades
-- Catálogo maestro de ciudades
-- ============================================================

CREATE TABLE IF NOT EXISTS ciudades (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    departamento VARCHAR(100),

    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_ciudad_nombre (nombre)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar ciudades existentes desde tarifas_transporte y ubicaciones
INSERT IGNORE INTO ciudades (nombre)
SELECT DISTINCT ciudad FROM tarifas_transporte WHERE ciudad IS NOT NULL AND ciudad != ''
UNION
SELECT DISTINCT ciudad FROM ubicaciones WHERE ciudad IS NOT NULL AND ciudad != '';
