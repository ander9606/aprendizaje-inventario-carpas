-- =====================================================
-- Migración 22: Tabla de Vehículos
-- =====================================================
-- Propósito: Catálogo de flota de vehículos para transportes
-- Se usará en órdenes de trabajo para asignar vehículos
-- =====================================================

CREATE TABLE IF NOT EXISTS vehiculos (
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- Identificación
    placa VARCHAR(10) NOT NULL UNIQUE,
    nombre VARCHAR(100),                     -- Nombre interno: "Camión Rojo", "Furgón 2"

    -- Especificaciones
    tipo ENUM('camion', 'furgon', 'camioneta', 'otro') NOT NULL,
    marca VARCHAR(50),
    modelo VARCHAR(50),
    año INT,
    color VARCHAR(30),

    -- Capacidad
    capacidad_peso_kg DECIMAL(10,2),         -- Capacidad en kg
    capacidad_volumen_m3 DECIMAL(10,2),      -- Capacidad en m³

    -- Estado
    estado ENUM('disponible', 'en_uso', 'mantenimiento', 'fuera_servicio') DEFAULT 'disponible',
    kilometraje_actual INT,

    -- Documentación
    soat_vencimiento DATE,
    tecnomecanica_vencimiento DATE,
    seguro_vencimiento DATE,

    -- Conductor asignado por defecto (opcional)
    conductor_habitual_id INT,

    -- Control
    activo BOOLEAN DEFAULT TRUE,
    notas TEXT,

    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Foreign Keys
    FOREIGN KEY (conductor_habitual_id) REFERENCES empleados(id)
);

-- Tabla para registro de uso de vehículos (historial)
CREATE TABLE IF NOT EXISTS vehiculo_uso_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vehiculo_id INT NOT NULL,

    -- Tipo de uso
    tipo ENUM('orden_trabajo', 'mantenimiento', 'otro') NOT NULL,
    referencia_id INT,                       -- ID de orden_trabajo u otra referencia

    -- Período
    fecha_salida DATETIME NOT NULL,
    fecha_retorno DATETIME,

    -- Kilometraje
    km_salida INT,
    km_retorno INT,

    -- Responsable
    conductor_id INT,

    -- Estado al retorno
    estado_retorno ENUM('ok', 'con_novedad', 'requiere_mantenimiento'),
    notas TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id),
    FOREIGN KEY (conductor_id) REFERENCES empleados(id)
);

-- Tabla para mantenimientos programados y realizados
CREATE TABLE IF NOT EXISTS vehiculo_mantenimientos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vehiculo_id INT NOT NULL,

    tipo ENUM('preventivo', 'correctivo', 'revision') NOT NULL,
    descripcion TEXT NOT NULL,

    -- Programación
    fecha_programada DATE,
    km_programado INT,                       -- "Al llegar a X km"

    -- Ejecución
    fecha_realizado DATE,
    km_realizado INT,
    costo DECIMAL(10,2),
    proveedor VARCHAR(200),

    -- Estado
    estado ENUM('pendiente', 'en_proceso', 'completado', 'cancelado') DEFAULT 'pendiente',

    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id)
);

-- Índices
CREATE INDEX idx_vehiculos_placa ON vehiculos(placa);
CREATE INDEX idx_vehiculos_estado ON vehiculos(estado);
CREATE INDEX idx_vehiculos_tipo ON vehiculos(tipo);
CREATE INDEX idx_vehiculo_uso_vehiculo ON vehiculo_uso_log(vehiculo_id);
CREATE INDEX idx_vehiculo_uso_fechas ON vehiculo_uso_log(fecha_salida, fecha_retorno);
CREATE INDEX idx_vehiculo_mant_vehiculo ON vehiculo_mantenimientos(vehiculo_id);
CREATE INDEX idx_vehiculo_mant_estado ON vehiculo_mantenimientos(estado);

-- Datos de ejemplo (opcional - comentar si no se necesitan)
-- INSERT INTO vehiculos (placa, nombre, tipo, marca, modelo, capacidad_peso_kg) VALUES
-- ('ABC-123', 'Camión Principal', 'camion', 'Chevrolet', 'NHR', 3500.00),
-- ('DEF-456', 'Furgón 1', 'furgon', 'Hyundai', 'H100', 1500.00);
