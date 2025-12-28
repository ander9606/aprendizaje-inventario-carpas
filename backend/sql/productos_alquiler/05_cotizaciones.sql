-- ============================================================
-- TABLA: cotizaciones
-- Cotizaciones generadas para clientes
-- ============================================================

CREATE TABLE IF NOT EXISTS cotizaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cliente_id INT NOT NULL,
    compuesto_id INT NOT NULL,

    -- Fechas del evento
    fecha_evento DATE NOT NULL,
    fecha_fin_evento DATE,

    -- Información del evento
    evento_nombre VARCHAR(200),
    evento_direccion TEXT,
    evento_ciudad VARCHAR(100),

    -- Totales calculados
    subtotal DECIMAL(12,2) DEFAULT 0,
    descuento DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,

    -- Estado: pendiente, aprobada, rechazada, vencida
    estado ENUM('pendiente', 'aprobada', 'rechazada', 'vencida') DEFAULT 'pendiente',

    vigencia_dias INT DEFAULT 15,
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (compuesto_id) REFERENCES elementos_compuestos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
