-- ============================================================
-- TABLA 12: tarifas_transporte
-- Precio por tipo de camión y ciudad
-- ============================================================

CREATE TABLE IF NOT EXISTS tarifas_transporte (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tipo_camion VARCHAR(100) NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    precio DECIMAL(12,2) NOT NULL,

    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_tipo_ciudad (tipo_camion, ciudad)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_tarifa_ciudad ON tarifas_transporte(ciudad);
CREATE INDEX idx_tarifa_tipo ON tarifas_transporte(tipo_camion);
