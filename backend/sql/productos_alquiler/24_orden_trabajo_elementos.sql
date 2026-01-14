-- ============================================
-- MIGRACIÓN: Tabla de elementos en órdenes de trabajo
-- Tracking de cada elemento en montaje/desmontaje
-- ============================================

CREATE TABLE IF NOT EXISTS orden_trabajo_elementos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    orden_id INT NOT NULL,
    alquiler_elemento_id INT NOT NULL,

    -- Estado operativo del elemento
    estado ENUM(
        'pendiente',          -- No se ha procesado
        'verificado',         -- Verificado en bodega antes de cargar
        'cargado',            -- Cargado en vehículo
        'descargado',         -- Descargado en destino
        'montado',            -- Montado/instalado
        'desmontado',         -- Desmontado
        'cargado_retorno',    -- Cargado para volver a bodega
        'recibido',           -- Recibido en bodega
        'revision',           -- En revisión por posible daño
        'mantenimiento',      -- Enviado a mantenimiento
        'danado',             -- Confirmado como dañado
        'perdido'             -- No se encontró
    ) DEFAULT 'pendiente',

    -- Verificación
    verificado_por INT,               -- Empleado que verificó
    fecha_verificacion DATETIME,

    -- Evidencia
    foto_salida_url VARCHAR(500),     -- Foto al salir de bodega
    foto_montado_url VARCHAR(500),    -- Foto montado
    foto_retorno_url VARCHAR(500),    -- Foto al volver

    -- Incidencias
    tiene_incidencia BOOLEAN DEFAULT FALSE,
    descripcion_incidencia TEXT,
    costo_incidencia DECIMAL(12,2),

    -- Checklist de montaje (JSON para flexibilidad)
    checklist JSON,                   -- Ej: {"anclajes": true, "tensores": true, "limpieza": false}

    -- Notas
    notas TEXT,

    -- Ubicación destino (puede cambiar de la original)
    ubicacion_destino_id INT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (orden_id) REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
    FOREIGN KEY (alquiler_elemento_id) REFERENCES alquiler_elementos(id),
    FOREIGN KEY (verificado_por) REFERENCES empleados(id),
    FOREIGN KEY (ubicacion_destino_id) REFERENCES ubicaciones(id),

    INDEX idx_orden_elemento_orden (orden_id),
    INDEX idx_orden_elemento_estado (estado),
    INDEX idx_orden_elemento_incidencia (tiene_incidencia),

    -- Un elemento solo puede aparecer una vez por orden
    UNIQUE KEY uk_orden_elemento (orden_id, alquiler_elemento_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Actualizar alquiler_elementos para agregar estado operativo
ALTER TABLE alquiler_elementos
ADD COLUMN estado_operativo ENUM(
    'reservado',           -- Asignado pero en bodega
    'en_preparacion',      -- Siendo preparado para salir
    'en_transito_ida',     -- Camino al evento
    'en_evento',           -- En la ubicación del evento
    'montado',             -- Montado/instalado
    'en_transito_retorno', -- Volviendo a bodega
    'recibido',            -- De vuelta en bodega
    'en_revision',         -- Siendo revisado
    'mantenimiento',       -- En reparación
    'disponible'           -- Listo para próximo uso
) DEFAULT 'reservado' AFTER estado_retorno;

-- Índice para el nuevo campo
CREATE INDEX idx_alquiler_elem_estado_op ON alquiler_elementos(estado_operativo);
