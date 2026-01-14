-- ============================================
-- MIGRACIÓN: Tabla de órdenes de trabajo
-- Corazón del módulo de operaciones
-- ============================================

CREATE TABLE IF NOT EXISTS ordenes_trabajo (
    id INT PRIMARY KEY AUTO_INCREMENT,
    alquiler_id INT NOT NULL,

    -- Tipo de orden
    tipo ENUM('montaje', 'desmontaje') NOT NULL,

    -- Fechas (las que Operaciones puede modificar)
    fecha_programada DATETIME NOT NULL,
    fecha_inicio_real DATETIME,       -- Cuándo empezó realmente
    fecha_fin_real DATETIME,          -- Cuándo terminó realmente

    -- Buffer operativo
    buffer_horas_antes INT DEFAULT 2, -- Horas antes del evento para montaje
    buffer_horas_despues INT DEFAULT 2, -- Horas después para desmontaje

    -- Estado de la orden
    estado ENUM(
        'pendiente',                   -- Programada, sin asignar
        'asignada',                    -- Equipo asignado
        'en_preparacion',              -- Cargando en bodega
        'en_transito',                 -- Camino al evento
        'en_proceso',                  -- Ejecutando montaje/desmontaje
        'completada',                  -- Terminada exitosamente
        'completada_con_incidencia',   -- Terminada pero con problemas
        'cancelada'                    -- Cancelada
    ) DEFAULT 'pendiente',

    -- Equipo asignado (JSON para flexibilidad)
    equipo_ids JSON,                  -- Array de empleado_ids

    -- Vehículo asignado
    vehiculo_id INT,

    -- Responsable de la orden
    responsable_id INT,               -- Empleado responsable

    -- Dirección de trabajo (puede diferir de la cotización)
    direccion_trabajo TEXT,
    indicaciones_acceso TEXT,
    contacto_sitio VARCHAR(100),
    telefono_sitio VARCHAR(20),

    -- Notas y observaciones
    notas_operativas TEXT,            -- Notas para el equipo
    notas_cliente TEXT,               -- Notas del cliente
    observaciones_ejecucion TEXT,     -- Observaciones al ejecutar

    -- Métricas
    tiempo_estimado_horas DECIMAL(5,2),
    tiempo_real_horas DECIMAL(5,2),

    -- Auditoría
    creado_por INT,                   -- Empleado que creó
    modificado_por INT,               -- Último que modificó

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (alquiler_id) REFERENCES alquileres(id) ON DELETE CASCADE,
    FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id),
    FOREIGN KEY (responsable_id) REFERENCES empleados(id),
    FOREIGN KEY (creado_por) REFERENCES empleados(id),
    FOREIGN KEY (modificado_por) REFERENCES empleados(id),

    INDEX idx_orden_alquiler (alquiler_id),
    INDEX idx_orden_tipo (tipo),
    INDEX idx_orden_fecha (fecha_programada),
    INDEX idx_orden_estado (estado),
    INDEX idx_orden_vehiculo (vehiculo_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Agregar FK de vehiculo_usos a ordenes_trabajo
ALTER TABLE vehiculo_usos
ADD FOREIGN KEY (orden_trabajo_id) REFERENCES ordenes_trabajo(id);

-- Historial de cambios en órdenes (para auditoría)
CREATE TABLE IF NOT EXISTS ordenes_trabajo_historial (
    id INT PRIMARY KEY AUTO_INCREMENT,
    orden_id INT NOT NULL,
    empleado_id INT,

    campo_modificado VARCHAR(50) NOT NULL,
    valor_anterior TEXT,
    valor_nuevo TEXT,
    motivo TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (orden_id) REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
    FOREIGN KEY (empleado_id) REFERENCES empleados(id),
    INDEX idx_historial_orden (orden_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
