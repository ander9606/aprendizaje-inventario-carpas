-- =====================================================
-- Migración 25: Sistema de Alertas de Operaciones
-- =====================================================
-- Propósito: Gestión de conflictos, advertencias y notificaciones
-- Permite escalar problemas a gerencia cuando es necesario
-- =====================================================

CREATE TABLE IF NOT EXISTS alertas_operaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- Contexto de la alerta
    orden_id INT,                            -- Orden relacionada (opcional)
    alquiler_id INT,                         -- Alquiler relacionado (opcional)
    elemento_id INT,                         -- Elemento específico (opcional)

    -- Clasificación
    tipo ENUM(
        -- Conflictos de disponibilidad
        'conflicto_fecha',            -- Cambio de fecha genera conflicto
        'elemento_no_disponible',     -- Elemento reservado para otra fecha
        'solapamiento_eventos',       -- Dos eventos en mismo tiempo/recurso

        -- Problemas operativos
        'incidencia_elemento',        -- Daño o problema con elemento
        'retraso_montaje',            -- No llegaron a tiempo
        'falta_recursos',             -- No hay equipo/vehículo

        -- Aprobaciones requeridas
        'requiere_aprobacion',        -- Cambio necesita visto bueno
        'aprobacion_urgente',         -- Necesita respuesta rápida

        -- Mantenimiento
        'mantenimiento_requerido',    -- Elemento necesita revisión
        'vehiculo_revision',          -- Vehículo necesita servicio

        -- Documentación
        'documento_vencido',          -- SOAT, tecnomecánica, etc.

        -- Otros
        'informativa',                -- Solo información
        'otro'
    ) NOT NULL,

    -- Severidad
    severidad ENUM('info', 'advertencia', 'critico') DEFAULT 'info',

    -- Contenido
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    datos_contexto JSON,                     -- Datos adicionales estructurados

    -- Destinatarios
    para_rol VARCHAR(50),                    -- 'gerente', 'operaciones', etc.
    para_empleado_id INT,                    -- Empleado específico (opcional)

    -- Estado
    estado ENUM('pendiente', 'vista', 'en_proceso', 'resuelta', 'escalada', 'expirada') DEFAULT 'pendiente',

    -- Resolución
    resuelta BOOLEAN DEFAULT FALSE,
    resuelta_por INT,
    resuelta_at DATETIME,
    resolucion TEXT,
    accion_tomada ENUM('aprobado', 'rechazado', 'modificado', 'ignorado', 'otro'),

    -- Expiración automática
    expira_at DATETIME,

    -- Auditoría
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Foreign Keys
    FOREIGN KEY (orden_id) REFERENCES ordenes_trabajo(id) ON DELETE SET NULL,
    FOREIGN KEY (alquiler_id) REFERENCES alquileres(id) ON DELETE SET NULL,
    FOREIGN KEY (para_empleado_id) REFERENCES empleados(id),
    FOREIGN KEY (resuelta_por) REFERENCES empleados(id),
    FOREIGN KEY (created_by) REFERENCES empleados(id)
);

-- Tabla para notificaciones push/email (cola de envío)
CREATE TABLE IF NOT EXISTS notificaciones_pendientes (
    id INT PRIMARY KEY AUTO_INCREMENT,

    alerta_id INT,                           -- Alerta relacionada (opcional)
    empleado_id INT NOT NULL,                -- Destinatario

    -- Tipo de notificación
    canal ENUM('push', 'email', 'sms', 'interno') NOT NULL,

    -- Contenido
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    datos JSON,                              -- Datos para la notificación

    -- Estado de envío
    estado ENUM('pendiente', 'enviada', 'fallida', 'cancelada') DEFAULT 'pendiente',
    intentos INT DEFAULT 0,
    ultimo_intento DATETIME,
    error_mensaje TEXT,

    -- Lectura
    leida BOOLEAN DEFAULT FALSE,
    leida_at DATETIME,

    -- Programación
    enviar_at DATETIME,                      -- Para notificaciones programadas

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (alerta_id) REFERENCES alertas_operaciones(id) ON DELETE SET NULL,
    FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE
);

-- Tabla para preferencias de notificación por empleado
CREATE TABLE IF NOT EXISTS empleado_notificaciones_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    empleado_id INT NOT NULL,

    -- Preferencias por tipo de alerta
    conflicto_fecha BOOLEAN DEFAULT TRUE,
    incidencia_elemento BOOLEAN DEFAULT TRUE,
    requiere_aprobacion BOOLEAN DEFAULT TRUE,
    informativa BOOLEAN DEFAULT FALSE,

    -- Canales habilitados
    push_enabled BOOLEAN DEFAULT TRUE,
    email_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,

    -- Horarios de no molestar
    dnd_inicio TIME,                         -- Ej: 22:00
    dnd_fin TIME,                            -- Ej: 07:00

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE,
    UNIQUE KEY uk_empleado_config (empleado_id)
);

-- Índices principales
CREATE INDEX idx_alertas_orden ON alertas_operaciones(orden_id);
CREATE INDEX idx_alertas_alquiler ON alertas_operaciones(alquiler_id);
CREATE INDEX idx_alertas_tipo ON alertas_operaciones(tipo);
CREATE INDEX idx_alertas_severidad ON alertas_operaciones(severidad);
CREATE INDEX idx_alertas_estado ON alertas_operaciones(estado);
CREATE INDEX idx_alertas_para_rol ON alertas_operaciones(para_rol);
CREATE INDEX idx_alertas_para_empleado ON alertas_operaciones(para_empleado_id);
CREATE INDEX idx_alertas_pendientes ON alertas_operaciones(estado, severidad);
CREATE INDEX idx_alertas_fecha ON alertas_operaciones(created_at);

-- Índices para notificaciones
CREATE INDEX idx_notif_empleado ON notificaciones_pendientes(empleado_id);
CREATE INDEX idx_notif_estado ON notificaciones_pendientes(estado);
CREATE INDEX idx_notif_enviar ON notificaciones_pendientes(enviar_at, estado);

-- =====================================================
-- Uso típico:
-- =====================================================
-- 1. ValidadorFechasService detecta conflicto
-- 2. Crea alerta tipo='conflicto_fecha', severidad='critico'
-- 3. para_rol='gerente' (requiere aprobación)
-- 4. Gerente ve alerta en dashboard
-- 5. Resuelve: aprobado/rechazado
-- 6. Se actualiza estado de la orden
-- =====================================================
