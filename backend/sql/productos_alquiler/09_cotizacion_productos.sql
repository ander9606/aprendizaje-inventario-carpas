-- ============================================================
-- TABLA: cotizacion_productos
-- Permite múltiples elementos compuestos por cotización
-- ============================================================

CREATE TABLE IF NOT EXISTS cotizacion_productos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cotizacion_id INT NOT NULL,
    compuesto_id INT NOT NULL,

    -- Cantidad de este producto en la cotización
    cantidad INT DEFAULT 1,

    -- Precios copiados al momento de cotizar (para histórico)
    precio_base DECIMAL(12,2) DEFAULT 0,
    deposito DECIMAL(12,2) DEFAULT 0,

    -- Precio por configuración especial (alternativas, adicionales)
    precio_adicionales DECIMAL(12,2) DEFAULT 0,

    -- Subtotal = (precio_base + precio_adicionales) * cantidad
    subtotal DECIMAL(12,2) DEFAULT 0,

    -- Notas específicas de este producto en la cotización
    notas TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- FKs
    CONSTRAINT fk_cotprod_cotizacion
      FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id)
      ON DELETE CASCADE,

    CONSTRAINT fk_cotprod_compuesto
      FOREIGN KEY (compuesto_id) REFERENCES elementos_compuestos(id)
      ON DELETE RESTRICT,

    -- Un mismo producto puede aparecer solo una vez por cotización
    UNIQUE KEY uk_cotizacion_producto (cotizacion_id, compuesto_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices
CREATE INDEX idx_cotprod_cotizacion ON cotizacion_productos(cotizacion_id);
CREATE INDEX idx_cotprod_compuesto ON cotizacion_productos(compuesto_id);
