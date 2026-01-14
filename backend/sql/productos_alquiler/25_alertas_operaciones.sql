-- ============================================
-- MIGRACIÓN: Tabla de alertas de operaciones
-- Sistema de alertas y notificaciones
-- ============================================

CREATE TABLE IF NOT EXISTS alertas_operaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- Contexto de la alerta
    orden_id INT,
    alquiler_id INT,
    elemento_id INT,                  -- Elemento involucrado (opcional)

    -- Tipo y severidad
    tipo ENUM(
        'conflicto_fecha',            -- Cambio de fecha genera conflicto
        'elemento_no_disponible',     -- Elemento no está disponible
        'requiere_aprobacion',        -- Acción requiere aprobación de gerencia
        'incidencia_elemento',        -- Problema con un elemento
        'vehiculo_no_disponible',     -- Vehículo asignado no disponible
        'equipo_incompleto',          -- Falta personal para la orden
        'atraso_orden',               -- Orden no se completó a tiempo
        'mantenimiento_urgente',      -- Elemento requiere mantenimiento urgente
        'documento_vencido',          -- SOAT, Tecnomecánica, etc.
        'otro'
    ) NOT NULL,

    severidad ENUM(
        'info',                       -- Informativo, no requiere acción
        'advertencia',                -- Advertencia, revisar
        'critico'                     -- Crítico, requiere acción inmediata
    ) DEFAULT 'info',

    -- Contenido
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    datos_contexto JSON,              -- Datos adicionales para mostrar

    -- Destinatarios
    destinatario_rol_id INT,          -- Rol que debe ver esta alerta
    destinatario_empleado_id INT,     -- Empleado específico (opcional)

    -- Estado de la alerta
    leida BOOLEAN DEFAULT FALSE,
    leida_por INT,
    leida_fecha DATETIME,

    resuelta BOOLEAN DEFAULT FALSE,
    resuelta_por INT,
    resuelta_fecha DATETIME,
    resolucion TEXT,                  -- Cómo se resolvió

    -- Si requiere aprobación
    requiere_aprobacion BOOLEAN DEFAULT FALSE,
    aprobada BOOLEAN,
    aprobada_por INT,
    aprobada_fecha DATETIME,
    motivo_rechazo TEXT,

    -- Expiración (para alertas temporales)
    fecha_expiracion DATETIME,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (orden_id) REFERENCES ordenes_trabajo(id) ON DELETE SET NULL,
    FOREIGN KEY (alquiler_id) REFERENCES alquileres(id) ON DELETE SET NULL,
    FOREIGN KEY (elemento_id) REFERENCES elementos(id) ON DELETE SET NULL,
    FOREIGN KEY (destinatario_rol_id) REFERENCES roles(id),
    FOREIGN KEY (destinatario_empleado_id) REFERENCES empleados(id),
    FOREIGN KEY (leida_por) REFERENCES empleados(id),
    FOREIGN KEY (resuelta_por) REFERENCES empleados(id),
    FOREIGN KEY (aprobada_por) REFERENCES empleados(id),

    INDEX idx_alerta_tipo (tipo),
    INDEX idx_alerta_severidad (severidad),
    INDEX idx_alerta_leida (leida),
    INDEX idx_alerta_resuelta (resuelta),
    INDEX idx_alerta_destinatario_rol (destinatario_rol_id),
    INDEX idx_alerta_orden (orden_id),
    INDEX idx_alerta_fecha (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vista para alertas pendientes por rol
CREATE OR REPLACE VIEW v_alertas_pendientes AS
SELECT
    a.*,
    r.nombre AS rol_nombre,
    e.nombre AS empleado_nombre,
    o.tipo AS orden_tipo,
    o.fecha_programada AS orden_fecha
FROM alertas_operaciones a
LEFT JOIN roles r ON a.destinatario_rol_id = r.id
LEFT JOIN empleados e ON a.destinatario_empleado_id = e.id
LEFT JOIN ordenes_trabajo o ON a.orden_id = o.id
WHERE a.resuelta = FALSE
  AND (a.fecha_expiracion IS NULL OR a.fecha_expiracion > NOW())
ORDER BY
    CASE a.severidad
        WHEN 'critico' THEN 1
        WHEN 'advertencia' THEN 2
        ELSE 3
    END,
    a.created_at DESC;
