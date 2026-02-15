-- ============================================================
-- MIGRACIÓN: Historial de estados de órdenes de trabajo
-- Registra cada transición de estado con timestamp para
-- calcular duración de montajes y desmontajes
-- ============================================================

CREATE TABLE IF NOT EXISTS orden_trabajo_historial_estados (
    id INT PRIMARY KEY AUTO_INCREMENT,
    orden_id INT NOT NULL,
    estado_anterior VARCHAR(30),
    estado_nuevo VARCHAR(30) NOT NULL,
    cambiado_por INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (orden_id) REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
    FOREIGN KEY (cambiado_por) REFERENCES empleados(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices para consultas frecuentes
CREATE INDEX idx_historial_estados_orden ON orden_trabajo_historial_estados(orden_id);
CREATE INDEX idx_historial_estados_estado ON orden_trabajo_historial_estados(estado_nuevo);
CREATE INDEX idx_historial_estados_fecha ON orden_trabajo_historial_estados(created_at);

SELECT 'Tabla orden_trabajo_historial_estados creada exitosamente' AS mensaje;
