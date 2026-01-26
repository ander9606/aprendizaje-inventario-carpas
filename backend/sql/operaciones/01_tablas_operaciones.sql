-- ============================================================
-- MÓDULO: OPERACIONES
-- Tablas para órdenes de trabajo, alertas y gestión operativa
-- ============================================================

-- ------------------------------------------------------------
-- Tabla: ordenes_trabajo
-- Órdenes de montaje y desmontaje para alquileres
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ordenes_trabajo (
    id INT PRIMARY KEY AUTO_INCREMENT,
    alquiler_id INT NOT NULL,

    -- Tipo de orden
    tipo ENUM('montaje', 'desmontaje') NOT NULL,

    -- Estado del flujo de trabajo
    estado ENUM('pendiente', 'confirmado', 'en_preparacion', 'en_ruta', 'en_sitio', 'en_proceso', 'completado', 'cancelado') DEFAULT 'pendiente',

    -- Programación
    fecha_programada DATETIME NOT NULL,

    -- Prioridad
    prioridad ENUM('baja', 'normal', 'alta', 'urgente') DEFAULT 'normal',

    -- Vehículo asignado (opcional)
    vehiculo_id INT,

    -- Notas adicionales
    notas TEXT,

    -- Auditoría
    creado_por INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (alquiler_id) REFERENCES alquileres(id) ON DELETE CASCADE,
    FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON DELETE SET NULL,
    FOREIGN KEY (creado_por) REFERENCES empleados(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Tabla: orden_trabajo_equipo
-- Empleados asignados a cada orden de trabajo
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orden_trabajo_equipo (
    id INT PRIMARY KEY AUTO_INCREMENT,
    orden_id INT NOT NULL,
    empleado_id INT NOT NULL,
    rol_en_orden ENUM('responsable', 'operario', 'conductor', 'auxiliar') DEFAULT 'operario',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (orden_id) REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
    FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE,

    UNIQUE KEY uk_orden_empleado (orden_id, empleado_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Tabla: orden_trabajo_elementos
-- Elementos incluidos en cada orden de trabajo
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orden_trabajo_elementos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    orden_id INT NOT NULL,
    elemento_id INT NOT NULL,
    serie_id INT,
    lote_id INT,
    cantidad INT DEFAULT 1,

    -- Estado del elemento en la orden
    estado ENUM('pendiente', 'cargado', 'descargado', 'instalado', 'verificado', 'con_problema') DEFAULT 'pendiente',

    -- Verificaciones
    verificado_salida BOOLEAN DEFAULT FALSE,
    verificado_retorno BOOLEAN DEFAULT FALSE,

    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (orden_id) REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
    FOREIGN KEY (elemento_id) REFERENCES elementos(id) ON DELETE CASCADE,
    FOREIGN KEY (serie_id) REFERENCES series(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Tabla: orden_trabajo_cambios_fecha
-- Historial de cambios de fecha en órdenes
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orden_trabajo_cambios_fecha (
    id INT PRIMARY KEY AUTO_INCREMENT,
    orden_id INT NOT NULL,
    fecha_anterior DATETIME NOT NULL,
    fecha_nueva DATETIME NOT NULL,
    motivo TEXT,
    aprobado_por INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (orden_id) REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
    FOREIGN KEY (aprobado_por) REFERENCES empleados(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Tabla: alertas_operaciones
-- Sistema de alertas para conflictos y notificaciones
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alertas_operaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    orden_id INT,

    -- Clasificación de alerta
    tipo ENUM('conflicto_fecha', 'conflicto_disponibilidad', 'conflicto_equipo', 'conflicto_vehiculo', 'cambio_fecha', 'incidencia', 'otro') NOT NULL,
    severidad ENUM('baja', 'media', 'alta', 'critica') DEFAULT 'media',

    -- Contenido
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT,

    -- Estado de la alerta
    estado ENUM('pendiente', 'resuelta', 'descartada', 'escalada') DEFAULT 'pendiente',

    -- Resolución
    resuelta_por INT,
    fecha_resolucion DATETIME,
    notas_resolucion TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (orden_id) REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
    FOREIGN KEY (resuelta_por) REFERENCES empleados(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- ÍNDICES para optimización de consultas
-- ------------------------------------------------------------
CREATE INDEX idx_ordenes_fecha ON ordenes_trabajo(fecha_programada);
CREATE INDEX idx_ordenes_estado ON ordenes_trabajo(estado);
CREATE INDEX idx_ordenes_tipo ON ordenes_trabajo(tipo);
CREATE INDEX idx_ordenes_alquiler ON ordenes_trabajo(alquiler_id);
CREATE INDEX idx_alertas_estado ON alertas_operaciones(estado);
CREATE INDEX idx_alertas_severidad ON alertas_operaciones(severidad);

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
SELECT 'Tablas de operaciones creadas exitosamente' AS mensaje;
