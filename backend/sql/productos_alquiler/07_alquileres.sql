-- ============================================================
-- TABLA: alquileres
-- Alquileres confirmados (cotización aprobada)
-- ============================================================

CREATE TABLE IF NOT EXISTS alquileres (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cotizacion_id INT NOT NULL,

    -- Fechas reales
    fecha_salida DATETIME,
    fecha_retorno_esperado DATETIME,
    fecha_retorno_real DATETIME,

    -- Montos
    total DECIMAL(12,2) NOT NULL,
    deposito_cobrado DECIMAL(12,2) DEFAULT 0,
    costo_danos DECIMAL(12,2) DEFAULT 0,

    -- Estado: programado, activo, finalizado, cancelado
    estado ENUM('programado', 'activo', 'finalizado', 'cancelado') DEFAULT 'programado',

    notas_salida TEXT,
    notas_retorno TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
