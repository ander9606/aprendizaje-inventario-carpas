-- ============================================================
-- TABLA: cotizacion_transportes
-- Servicio de transporte personalizable por cotización
-- ============================================================

CREATE TABLE IF NOT EXISTS cotizacion_transportes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cotizacion_id INT NOT NULL,

    -- Ubicación destino
    ubicacion_id INT DEFAULT NULL,
    direccion_destino TEXT,
    ciudad_destino VARCHAR(100),

    -- Vehículos
    cantidad_camiones INT DEFAULT 1,
    tipo_vehiculo VARCHAR(100) DEFAULT NULL,  -- Ej: 'Camión 5 ton', 'Furgón', etc.

    -- Costos
    tarifa_id INT DEFAULT NULL,               -- Referencia a tarifa usada
    precio_unitario DECIMAL(12,2) DEFAULT 0,  -- Precio por camión
    subtotal DECIMAL(12,2) DEFAULT 0,         -- precio_unitario * cantidad_camiones

    -- Fechas de transporte (pueden diferir del evento)
    fecha_entrega DATE DEFAULT NULL,
    hora_entrega TIME DEFAULT NULL,
    fecha_recogida DATE DEFAULT NULL,
    hora_recogida TIME DEFAULT NULL,

    -- Información adicional
    requiere_montaje BOOLEAN DEFAULT FALSE,
    costo_montaje DECIMAL(12,2) DEFAULT 0,
    notas TEXT,

    -- Para expansión futura
    -- conductor_id INT DEFAULT NULL,
    -- vehiculo_id INT DEFAULT NULL,
    -- estado ENUM('pendiente','en_ruta','entregado','recogido') DEFAULT 'pendiente',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- FKs
    CONSTRAINT fk_cottrans_cotizacion
      FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id)
      ON DELETE CASCADE,

    CONSTRAINT fk_cottrans_ubicacion
      FOREIGN KEY (ubicacion_id) REFERENCES ubicaciones(id)
      ON DELETE SET NULL,

    CONSTRAINT fk_cottrans_tarifa
      FOREIGN KEY (tarifa_id) REFERENCES tarifas_transporte(id)
      ON DELETE SET NULL

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices
CREATE INDEX idx_cottrans_cotizacion ON cotizacion_transportes(cotizacion_id);
CREATE INDEX idx_cottrans_fecha_entrega ON cotizacion_transportes(fecha_entrega);
