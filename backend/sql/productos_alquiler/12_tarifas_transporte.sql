-- ============================================================
-- TABLA: tarifas_transporte
-- Precios de transporte por ciudad/zona
-- Permite calcular automáticamente el costo según destino
-- ============================================================

CREATE TABLE IF NOT EXISTS tarifas_transporte (
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- Ciudad destino (debe coincidir con evento_ciudad de cotizaciones)
    ciudad VARCHAR(100) NOT NULL,

    -- Zona dentro de la ciudad (opcional, para ciudades grandes)
    zona VARCHAR(100) DEFAULT NULL,

    -- Precio por camión (ida y vuelta incluido)
    precio_camion DECIMAL(12,2) NOT NULL,

    -- Tiempo estimado de viaje (horas, solo referencia)
    tiempo_estimado_horas DECIMAL(5,2) DEFAULT NULL,

    -- Distancia aproximada en km (solo referencia)
    distancia_km DECIMAL(8,2) DEFAULT NULL,

    -- Notas adicionales
    notas TEXT,

    -- Estado
    activo BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Ciudad + zona debe ser único
    UNIQUE KEY uk_ciudad_zona (ciudad, zona)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices
CREATE INDEX idx_tarifa_ciudad ON tarifas_transporte(ciudad);
CREATE INDEX idx_tarifa_activo ON tarifas_transporte(activo);

-- ============================================================
-- DATOS DE EJEMPLO (ajustar según tus ciudades reales)
-- ============================================================

INSERT INTO tarifas_transporte (ciudad, zona, precio_camion, tiempo_estimado_horas, distancia_km) VALUES
('Bogotá', 'Norte', 150000, 1.0, 15),
('Bogotá', 'Sur', 180000, 1.5, 25),
('Bogotá', 'Centro', 120000, 0.5, 10),
('Bogotá', 'Occidente', 160000, 1.0, 20),
('Chía', NULL, 250000, 1.5, 30),
('Zipaquirá', NULL, 350000, 2.0, 50),
('Cajicá', NULL, 280000, 1.5, 35),
('La Calera', NULL, 300000, 2.0, 25),
('Soacha', NULL, 200000, 1.5, 20),
('Fusagasugá', NULL, 450000, 2.5, 65),
('Girardot', NULL, 600000, 3.0, 130),
('Melgar', NULL, 650000, 3.5, 150),
('Villavicencio', NULL, 800000, 4.0, 120);

-- Para ciudades no registradas, usar tarifa base
-- Esto se maneja en la aplicación
