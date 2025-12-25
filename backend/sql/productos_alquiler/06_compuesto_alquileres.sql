-- ============================================================
-- TABLA: compuesto_alquileres
-- Orden de ejecución: 6 (depende de: elementos_compuestos, clientes)
-- ============================================================
-- Registra el historial de cada alquiler de un producto compuesto
-- Cada registro representa un evento/alquiler específico

CREATE TABLE IF NOT EXISTS compuesto_alquileres (
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- ═══════════════════════════════════════════════════════════
    -- Referencias principales
    -- ═══════════════════════════════════════════════════════════
    compuesto_id INT NOT NULL COMMENT 'Producto que se alquila',
    cliente_id INT NOT NULL COMMENT 'Cliente que alquila',

    -- ═══════════════════════════════════════════════════════════
    -- Información del evento (específica de ESTE alquiler)
    -- ═══════════════════════════════════════════════════════════
    evento_nombre VARCHAR(200) COMMENT 'Nombre del evento: Boda García, Fiesta Empresarial',
    evento_tipo VARCHAR(100) COMMENT 'Tipo: boda, cumpleaños, corporativo, feria',
    evento_direccion TEXT COMMENT 'Dirección donde se realizará',
    evento_ciudad VARCHAR(100),

    -- Contacto para ESTE evento (puede ser diferente al cliente)
    contacto_evento VARCHAR(200) COMMENT 'Persona de contacto en el evento',
    telefono_evento VARCHAR(20) COMMENT 'Teléfono de contacto para el evento',

    -- ═══════════════════════════════════════════════════════════
    -- Fechas del alquiler
    -- ═══════════════════════════════════════════════════════════
    fecha_inicio DATE NOT NULL COMMENT 'Fecha de entrega/inicio',
    fecha_fin_estimada DATE NOT NULL COMMENT 'Fecha estimada de devolución',
    fecha_devolucion DATE COMMENT 'Fecha real de devolución (NULL si no devuelto)',

    -- ═══════════════════════════════════════════════════════════
    -- Estado del alquiler
    -- ═══════════════════════════════════════════════════════════
    estado ENUM('reservado', 'activo', 'devuelto', 'vencido', 'cancelado')
           DEFAULT 'reservado'
           COMMENT 'reservado=confirmado pero no entregado, activo=entregado al cliente',

    -- ═══════════════════════════════════════════════════════════
    -- Información financiera
    -- ═══════════════════════════════════════════════════════════
    precio_acordado DECIMAL(12,2) COMMENT 'Precio final acordado',
    deposito_cobrado DECIMAL(12,2) COMMENT 'Depósito cobrado al cliente',
    deposito_devuelto DECIMAL(12,2) COMMENT 'Depósito devuelto (después de verificar)',

    -- Descuentos y extras
    descuento DECIMAL(12,2) DEFAULT 0 COMMENT 'Descuento aplicado',
    extras DECIMAL(12,2) DEFAULT 0 COMMENT 'Cargos adicionales',

    -- ═══════════════════════════════════════════════════════════
    -- Notas
    -- ═══════════════════════════════════════════════════════════
    notas_alquiler TEXT COMMENT 'Notas al momento de alquilar',
    notas_devolucion TEXT COMMENT 'Notas al momento de devolver',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Foreign Keys
    CONSTRAINT fk_alquiler_compuesto
        FOREIGN KEY (compuesto_id) REFERENCES elementos_compuestos(id) ON DELETE CASCADE,
    CONSTRAINT fk_alquiler_cliente
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT,

    -- Índices
    INDEX idx_alquiler_compuesto (compuesto_id),
    INDEX idx_alquiler_cliente (cliente_id),
    INDEX idx_alquiler_estado (estado),
    INDEX idx_alquiler_fechas (fecha_inicio, fecha_fin_estimada),
    INDEX idx_alquiler_devolucion (fecha_devolucion)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Historial de alquileres de productos compuestos';


-- ============================================================
-- VERIFICACIÓN
-- ============================================================

SELECT '✅ Tabla compuesto_alquileres creada' AS resultado;

DESCRIBE compuesto_alquileres;
