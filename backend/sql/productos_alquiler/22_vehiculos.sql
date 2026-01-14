-- ============================================
-- MIGRACIÓN: Tabla de vehículos
-- Flota de vehículos para transporte
-- ============================================

CREATE TABLE IF NOT EXISTS vehiculos (
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- Identificación
    placa VARCHAR(10) NOT NULL UNIQUE,
    tipo ENUM('camion', 'camioneta', 'furgon', 'trailer', 'otro') DEFAULT 'camion',
    marca VARCHAR(50),
    modelo VARCHAR(50),
    ano INT,
    color VARCHAR(30),

    -- Capacidad
    capacidad_peso DECIMAL(10,2),     -- En kg
    capacidad_volumen DECIMAL(10,2),  -- En m³
    capacidad_descripcion TEXT,       -- Ej: "5 carpas 10x10" o "100 sillas"

    -- Documentación
    soat_vencimiento DATE,
    tecnomecanica_vencimiento DATE,
    seguro_vencimiento DATE,

    -- Conductor asignado (opcional)
    conductor_id INT,                 -- FK a empleados

    -- Estado
    estado ENUM('disponible', 'en_uso', 'mantenimiento', 'fuera_servicio') DEFAULT 'disponible',
    ubicacion_actual VARCHAR(200),    -- Dónde está el vehículo
    kilometraje INT,

    -- Costos
    costo_por_viaje DECIMAL(12,2),    -- Costo base por viaje
    consumo_combustible DECIMAL(5,2), -- km/galón

    notas TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (conductor_id) REFERENCES empleados(id),
    INDEX idx_vehiculo_estado (estado),
    INDEX idx_vehiculo_tipo (tipo),
    INDEX idx_vehiculo_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Historial de uso de vehículos
CREATE TABLE IF NOT EXISTS vehiculo_usos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vehiculo_id INT NOT NULL,
    conductor_id INT,
    orden_trabajo_id INT,             -- FK a ordenes_trabajo (se crea después)

    fecha_salida DATETIME NOT NULL,
    fecha_retorno DATETIME,
    kilometraje_salida INT,
    kilometraje_retorno INT,

    destino VARCHAR(200),
    motivo TEXT,

    combustible_cargado DECIMAL(10,2),
    costo_combustible DECIMAL(12,2),
    otros_gastos DECIMAL(12,2),
    notas TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id),
    FOREIGN KEY (conductor_id) REFERENCES empleados(id),
    INDEX idx_uso_vehiculo (vehiculo_id),
    INDEX idx_uso_fecha (fecha_salida)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
