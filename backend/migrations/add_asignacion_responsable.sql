-- ============================================
-- MIGRACIÓN: Asignación de responsables con aceptación/rechazo
-- ============================================

-- 1. Agregar estado de aceptación a la asignación de equipo
ALTER TABLE orden_trabajo_equipo
    ADD COLUMN estado_asignacion ENUM('pendiente', 'aceptada', 'rechazada') DEFAULT 'pendiente' AFTER rol_en_orden,
    ADD COLUMN motivo_rechazo TEXT NULL AFTER estado_asignacion,
    ADD COLUMN fecha_respuesta DATETIME NULL AFTER motivo_rechazo;

-- 2. Agregar destinatario a alertas (para alertas dirigidas a un empleado)
ALTER TABLE alertas_operaciones
    ADD COLUMN destinatario_id INT NULL AFTER orden_id,
    ADD FOREIGN KEY (destinatario_id) REFERENCES empleados(id) ON DELETE SET NULL;

-- 3. Agregar nuevos tipos de alerta
ALTER TABLE alertas_operaciones
    MODIFY COLUMN tipo ENUM(
        'conflicto_fecha', 'conflicto_disponibilidad', 'conflicto_equipo',
        'conflicto_vehiculo', 'cambio_fecha', 'incidencia', 'novedad',
        'stock_disponible', 'asignacion', 'rechazo_asignacion', 'otro'
    ) NOT NULL;

-- 4. Índice para consultas de alertas por destinatario
CREATE INDEX idx_alertas_destinatario ON alertas_operaciones(destinatario_id);

-- 5. Marcar asignaciones existentes como aceptadas (retrocompatibilidad)
UPDATE orden_trabajo_equipo SET estado_asignacion = 'aceptada' WHERE estado_asignacion = 'pendiente';

SELECT 'Migración de asignación de responsables completada' AS mensaje;
