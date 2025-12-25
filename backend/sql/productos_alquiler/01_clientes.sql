-- ============================================================
-- TABLA: clientes
-- Orden de ejecución: 1 (sin dependencias)
-- ============================================================
-- Almacena información de clientes que alquilan productos
-- Un cliente puede tener múltiples alquileres

CREATE TABLE IF NOT EXISTS clientes (
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- Identificación
    tipo_documento ENUM('CC', 'NIT', 'CE', 'PAS', 'TI') DEFAULT 'CC'
        COMMENT 'CC=Cédula, NIT=Empresa, CE=Cédula Extranjería, PAS=Pasaporte, TI=Tarjeta Identidad',
    numero_documento VARCHAR(20) NOT NULL,

    -- Información básica
    nombre VARCHAR(200) NOT NULL COMMENT 'Nombre completo o razón social',
    tipo_cliente ENUM('persona', 'empresa') DEFAULT 'persona',

    -- Contacto principal
    telefono VARCHAR(20),
    telefono_alt VARCHAR(20) COMMENT 'Teléfono alternativo',
    email VARCHAR(100),

    -- Dirección
    direccion TEXT,
    ciudad VARCHAR(100),
    barrio VARCHAR(100),

    -- Para empresas: persona de contacto
    contacto_nombre VARCHAR(100) COMMENT 'Nombre del contacto (si es empresa)',
    contacto_telefono VARCHAR(20),
    contacto_cargo VARCHAR(100),

    -- Control y notas
    notas TEXT,
    activo BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Constraints
    UNIQUE KEY uk_documento (tipo_documento, numero_documento),

    -- Índices
    INDEX idx_cliente_documento (numero_documento),
    INDEX idx_cliente_nombre (nombre(50)),
    INDEX idx_cliente_telefono (telefono),
    INDEX idx_cliente_ciudad (ciudad),
    INDEX idx_cliente_activo (activo)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Clientes que alquilan productos (personas o empresas)';


-- ============================================================
-- DATOS DE EJEMPLO
-- ============================================================

INSERT INTO clientes (tipo_documento, numero_documento, nombre, tipo_cliente, telefono, email, ciudad, direccion) VALUES
('CC', '1234567890', 'Juan Carlos Pérez García', 'persona', '300-123-4567', 'juan.perez@email.com', 'Medellín', 'Calle 10 #45-67, El Poblado'),
('CC', '9876543210', 'María Elena López Ruiz', 'persona', '310-987-6543', 'maria.lopez@email.com', 'Medellín', 'Carrera 70 #30-20, Laureles'),
('NIT', '900123456-1', 'Eventos Premium SAS', 'empresa', '604-444-5555', 'contacto@eventospremium.com', 'Medellín', 'Calle 50 #40-30, Centro')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);


-- ============================================================
-- VERIFICACIÓN
-- ============================================================

SELECT '✅ Tabla clientes creada' AS resultado;
SELECT COUNT(*) AS total_clientes FROM clientes;
