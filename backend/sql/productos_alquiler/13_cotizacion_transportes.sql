-- ============================================================
-- TABLA 13: cotizacion_transportes
-- Camiones asignados a una cotización
-- ============================================================

CREATE TABLE IF NOT EXISTS cotizacion_transportes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cotizacion_id INT NOT NULL,
    tarifa_id INT NOT NULL,

    -- Cantidad de camiones de este tipo
    cantidad INT DEFAULT 1,

    -- Precio copiado al momento de cotizar
    precio_unitario DECIMAL(12,2) NOT NULL,

    -- Subtotal = precio_unitario * cantidad
    subtotal DECIMAL(12,2) NOT NULL,

    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_cottrans_cotizacion
      FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id) ON DELETE CASCADE,

    CONSTRAINT fk_cottrans_tarifa
      FOREIGN KEY (tarifa_id) REFERENCES tarifas_transporte(id) ON DELETE RESTRICT

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_cottrans_cotizacion ON cotizacion_transportes(cotizacion_id);
