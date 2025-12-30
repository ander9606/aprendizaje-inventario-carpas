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

-- ============================================================
-- DATOS DE EJEMPLO
-- ============================================================

INSERT INTO tarifas_transporte (tipo_camion, ciudad, precio) VALUES
-- Camión 350
('Camión 350', 'Bogotá', 200000),
('Camión 350', 'Chía', 300000),
('Camión 350', 'Zipaquirá', 400000),
('Camión 350', 'Cajicá', 350000),
('Camión 350', 'Soacha', 250000),
('Camión 350', 'Girardot', 700000),
('Camión 350', 'Melgar', 750000),
('Camión 350', 'Villavicencio', 900000),

-- Turbo
('Turbo', 'Bogotá', 150000),
('Turbo', 'Chía', 220000),
('Turbo', 'Zipaquirá', 300000),
('Turbo', 'Cajicá', 260000),
('Turbo', 'Soacha', 180000),
('Turbo', 'Girardot', 500000),
('Turbo', 'Melgar', 550000),
('Turbo', 'Villavicencio', 650000),

-- Sencillo
('Sencillo', 'Bogotá', 120000),
('Sencillo', 'Chía', 180000),
('Sencillo', 'Zipaquirá', 250000),
('Sencillo', 'Cajicá', 200000),
('Sencillo', 'Soacha', 150000),
('Sencillo', 'Girardot', 400000),
('Sencillo', 'Melgar', 450000),
('Sencillo', 'Villavicencio', 550000);
