-- ============================================================
-- TABLA: cotizacion_detalles
-- Componentes elegidos en cada cotización
-- ============================================================

CREATE TABLE IF NOT EXISTS cotizacion_detalles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cotizacion_id INT NOT NULL,
    elemento_id INT NOT NULL,

    -- Cantidad elegida por el cliente
    cantidad INT DEFAULT 1,

    -- Precio unitario adicional (copiado al momento de cotizar)
    precio_unitario DECIMAL(12,2) DEFAULT 0,

    -- Subtotal = cantidad × precio_unitario
    subtotal DECIMAL(12,2) DEFAULT 0,

    -- Referencia al grupo si es alternativa
    grupo VARCHAR(50) DEFAULT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id) ON DELETE CASCADE,
    FOREIGN KEY (elemento_id) REFERENCES elementos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
