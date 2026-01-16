-- =====================================================
-- Migración 23: Órdenes de Trabajo
-- =====================================================
-- Propósito: Gestión de montajes y desmontajes
-- Se crean automáticamente al aprobar cotizaciones
-- Operaciones puede modificar fechas (con validación)
-- =====================================================

CREATE TABLE IF NOT EXISTS ordenes_trabajo (
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- Referencia al alquiler
    alquiler_id INT NOT NULL,

    -- Tipo de orden
    tipo ENUM('montaje', 'desmontaje') NOT NULL,

    -- Fechas
    -- fecha_programada: La fecha que Operaciones puede modificar
    -- fecha_original: La fecha inicial (para auditoría)
    fecha_original DATETIME NOT NULL,
    fecha_programada DATETIME NOT NULL,
    fecha_ejecutada DATETIME,                -- Cuando realmente se hizo

    -- Horarios operativos
    hora_salida_bodega TIME,
    hora_llegada_estimada TIME,
    hora_llegada_real TIME,
    hora_finalizacion TIME,

    -- Recursos asignados
    vehiculo_id INT,
    conductor_id INT,

    -- Estado
    estado ENUM(
        'pendiente',      -- Recién creada
        'programada',     -- Tiene equipo/vehículo asignado
        'en_ruta',        -- Salieron de bodega
        'en_sitio',       -- Llegaron al lugar
        'en_proceso',     -- Trabajando
        'completado',     -- Terminado exitosamente
        'incidencia',     -- Hubo problema
        'cancelado'       -- Se canceló
    ) DEFAULT 'pendiente',

    -- Ubicación del evento (desnormalizado para fácil acceso)
    direccion_evento TEXT,
    ciudad_evento VARCHAR(100),
    referencias_ubicacion TEXT,              -- "Puerta trasera, preguntar por Juan"

    -- Contacto en sitio
    contacto_nombre VARCHAR(100),
    contacto_telefono VARCHAR(20),

    -- Notas
    notas_internas TEXT,                     -- Para el equipo
    notas_cliente TEXT,                      -- Observaciones del cliente

    -- Aprobación de cambios (para conflictos)
    requiere_aprobacion BOOLEAN DEFAULT FALSE,
    aprobado_por INT,
    aprobado_at DATETIME,
    motivo_aprobacion TEXT,

    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,

    -- Foreign Keys
    FOREIGN KEY (alquiler_id) REFERENCES alquileres(id) ON DELETE CASCADE,
    FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id),
    FOREIGN KEY (conductor_id) REFERENCES empleados(id),
    FOREIGN KEY (aprobado_por) REFERENCES empleados(id),
    FOREIGN KEY (created_by) REFERENCES empleados(id)
);

-- Tabla para asignar múltiples empleados a una orden
CREATE TABLE IF NOT EXISTS orden_trabajo_equipo (
    id INT PRIMARY KEY AUTO_INCREMENT,
    orden_id INT NOT NULL,
    empleado_id INT NOT NULL,

    rol_en_orden ENUM('conductor', 'montador', 'ayudante', 'supervisor') DEFAULT 'montador',

    -- Estado de asistencia
    confirmado BOOLEAN DEFAULT FALSE,
    asistio BOOLEAN,

    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (orden_id) REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
    FOREIGN KEY (empleado_id) REFERENCES empleados(id),

    -- Un empleado solo puede estar una vez por orden
    UNIQUE KEY uk_orden_empleado (orden_id, empleado_id)
);

-- Tabla para historial de cambios de fecha (auditoría)
CREATE TABLE IF NOT EXISTS orden_trabajo_cambios_fecha (
    id INT PRIMARY KEY AUTO_INCREMENT,
    orden_id INT NOT NULL,

    fecha_anterior DATETIME NOT NULL,
    fecha_nueva DATETIME NOT NULL,

    motivo TEXT,
    solicitado_por INT,
    aprobado_por INT,
    rechazado BOOLEAN DEFAULT FALSE,
    motivo_rechazo TEXT,

    -- Si hubo conflicto detectado
    conflicto_detectado BOOLEAN DEFAULT FALSE,
    conflicto_descripcion TEXT,
    conflicto_severidad ENUM('info', 'advertencia', 'critico'),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (orden_id) REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
    FOREIGN KEY (solicitado_por) REFERENCES empleados(id),
    FOREIGN KEY (aprobado_por) REFERENCES empleados(id)
);

-- Índices principales
CREATE INDEX idx_ordenes_alquiler ON ordenes_trabajo(alquiler_id);
CREATE INDEX idx_ordenes_tipo ON ordenes_trabajo(tipo);
CREATE INDEX idx_ordenes_estado ON ordenes_trabajo(estado);
CREATE INDEX idx_ordenes_fecha_prog ON ordenes_trabajo(fecha_programada);
CREATE INDEX idx_ordenes_vehiculo ON ordenes_trabajo(vehiculo_id);
CREATE INDEX idx_ordenes_conductor ON ordenes_trabajo(conductor_id);

-- Índice compuesto para calendario
CREATE INDEX idx_ordenes_calendario ON ordenes_trabajo(fecha_programada, estado, tipo);

-- Índices para equipo
CREATE INDEX idx_orden_equipo_orden ON orden_trabajo_equipo(orden_id);
CREATE INDEX idx_orden_equipo_empleado ON orden_trabajo_equipo(empleado_id);

-- Índices para cambios de fecha
CREATE INDEX idx_cambios_fecha_orden ON orden_trabajo_cambios_fecha(orden_id);
CREATE INDEX idx_cambios_fecha_fecha ON orden_trabajo_cambios_fecha(created_at);

-- =====================================================
-- Notas de implementación:
-- =====================================================
-- 1. Al aprobar cotización → crear orden montaje + orden desmontaje
-- 2. fecha_original: nunca se modifica (referencia)
-- 3. fecha_programada: la que Operaciones puede cambiar
-- 4. Cambios de fecha pasan por ValidadorFechasService
-- 5. Conflictos críticos requieren aprobación de gerencia
-- =====================================================
