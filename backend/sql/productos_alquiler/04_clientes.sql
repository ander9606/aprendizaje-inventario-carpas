-- ============================================================
-- TABLA: clientes
-- Clientes para cotizaciones y alquileres
-- ============================================================

CREATE TABLE IF NOT EXISTS clientes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tipo_documento ENUM('CC', 'NIT', 'CE') DEFAULT 'CC',
    numero_documento VARCHAR(20) NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion TEXT,
    ciudad VARCHAR(100),
    notas TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_documento (tipo_documento, numero_documento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
