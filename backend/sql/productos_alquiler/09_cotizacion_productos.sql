-- ============================================================
-- TABLA 09: cotizacion_productos
-- Permite múltiples elementos compuestos por cotización
-- ============================================================

CREATE TABLE IF NOT EXISTS cotizacion_productos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cotizacion_id INT NOT NULL,
    compuesto_id INT NOT NULL,

    -- Cantidad de este producto
    cantidad INT DEFAULT 1,

    -- Precios copiados al momento de cotizar
    precio_base DECIMAL(12,2) DEFAULT 0,
    deposito DECIMAL(12,2) DEFAULT 0,
    precio_adicionales DECIMAL(12,2) DEFAULT 0,

    -- Subtotal = (precio_base + precio_adicionales) * cantidad
    subtotal DECIMAL(12,2) DEFAULT 0,

    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_cotprod_cotizacion
      FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id) ON DELETE CASCADE,

    CONSTRAINT fk_cotprod_compuesto
      FOREIGN KEY (compuesto_id) REFERENCES elementos_compuestos(id) ON DELETE RESTRICT,

    UNIQUE KEY uk_cotizacion_producto (cotizacion_id, compuesto_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_cotprod_cotizacion ON cotizacion_productos(cotizacion_id);
CREATE INDEX idx_cotprod_compuesto ON cotizacion_productos(compuesto_id);
