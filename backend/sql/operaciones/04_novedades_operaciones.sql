-- ============================================
-- MIGRACIÓN: Novedades en campo
-- Sistema de reporte de novedades por operarios
-- ============================================

-- Extender ENUM de alertas para incluir 'novedad'
ALTER TABLE alertas_operaciones
MODIFY COLUMN tipo ENUM('conflicto_fecha', 'conflicto_disponibilidad', 'conflicto_equipo', 'conflicto_vehiculo', 'cambio_fecha', 'incidencia', 'novedad', 'stock_disponible', 'otro') NOT NULL;

-- Tabla de novedades
CREATE TABLE IF NOT EXISTS orden_trabajo_novedades (
    id INT PRIMARY KEY AUTO_INCREMENT,
    orden_id INT NOT NULL,
    alerta_id INT,

    -- Tipo de novedad
    tipo_novedad ENUM('cancelacion_producto', 'solicitud_adicional', 'cambio_ubicacion', 'dano_elemento', 'otro') NOT NULL,

    -- Detalle
    descripcion TEXT NOT NULL,

    -- Producto/elemento afectado (opcional)
    producto_id INT,
    elemento_orden_id INT,
    cantidad_afectada INT DEFAULT 1,

    -- Foto evidencia
    imagen_url VARCHAR(500),

    -- Resolución
    estado ENUM('pendiente', 'en_revision', 'resuelta', 'rechazada') DEFAULT 'pendiente',
    resolucion TEXT,
    resuelta_por INT,
    fecha_resolucion DATETIME,

    -- Auditoría
    reportada_por INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (orden_id) REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
    FOREIGN KEY (alerta_id) REFERENCES alertas_operaciones(id) ON DELETE SET NULL,
    FOREIGN KEY (reportada_por) REFERENCES empleados(id) ON DELETE SET NULL,
    FOREIGN KEY (resuelta_por) REFERENCES empleados(id) ON DELETE SET NULL
);

CREATE INDEX idx_novedades_orden ON orden_trabajo_novedades(orden_id);
CREATE INDEX idx_novedades_estado ON orden_trabajo_novedades(estado);
CREATE INDEX idx_novedades_tipo ON orden_trabajo_novedades(tipo_novedad);
