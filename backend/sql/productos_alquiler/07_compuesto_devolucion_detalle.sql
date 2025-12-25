-- ============================================================
-- TABLA: compuesto_devolucion_detalle
-- Orden de ejecución: 7 (depende de: compuesto_alquileres, compuesto_componentes)
-- ============================================================
-- Registra el estado de CADA componente al momento de devolución
-- Permite saber exactamente qué se dañó, perdió o está en buen estado

CREATE TABLE IF NOT EXISTS compuesto_devolucion_detalle (
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- ═══════════════════════════════════════════════════════════
    -- Referencias
    -- ═══════════════════════════════════════════════════════════
    alquiler_id INT NOT NULL COMMENT 'Alquiler al que pertenece esta verificación',
    componente_id INT NOT NULL COMMENT 'Componente que se está verificando',

    -- ═══════════════════════════════════════════════════════════
    -- Estado reportado en la devolución
    -- ═══════════════════════════════════════════════════════════
    estado_devuelto ENUM('bueno', 'dañado', 'perdido') NOT NULL
        COMMENT 'Estado del componente al devolverlo',

    -- Para componentes por lote: cuántos de cada estado
    cantidad_buena INT DEFAULT 0 COMMENT 'Cantidad devuelta en buen estado',
    cantidad_danada INT DEFAULT 0 COMMENT 'Cantidad devuelta dañada',
    cantidad_perdida INT DEFAULT 0 COMMENT 'Cantidad perdida/no devuelta',

    -- ═══════════════════════════════════════════════════════════
    -- Detalles del daño/problema
    -- ═══════════════════════════════════════════════════════════
    notas TEXT COMMENT 'Descripción del daño o problema encontrado',
    costo_reparacion DECIMAL(12,2) COMMENT 'Costo estimado de reparación',
    costo_reposicion DECIMAL(12,2) COMMENT 'Costo de reposición si está perdido',

    -- ═══════════════════════════════════════════════════════════
    -- Seguimiento
    -- ═══════════════════════════════════════════════════════════
    requiere_reparacion BOOLEAN DEFAULT FALSE,
    reparacion_completada BOOLEAN DEFAULT FALSE,
    fecha_reparacion DATE COMMENT 'Fecha en que se completó la reparación',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Keys
    CONSTRAINT fk_devolucion_alquiler
        FOREIGN KEY (alquiler_id) REFERENCES compuesto_alquileres(id) ON DELETE CASCADE,
    CONSTRAINT fk_devolucion_componente
        FOREIGN KEY (componente_id) REFERENCES compuesto_componentes(id) ON DELETE CASCADE,

    -- Índices
    INDEX idx_devolucion_alquiler (alquiler_id),
    INDEX idx_devolucion_componente (componente_id),
    INDEX idx_devolucion_estado (estado_devuelto),
    INDEX idx_devolucion_reparacion (requiere_reparacion, reparacion_completada)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Detalle del estado de cada componente en la devolución';


-- ============================================================
-- VERIFICACIÓN
-- ============================================================

SELECT '✅ Tabla compuesto_devolucion_detalle creada' AS resultado;

DESCRIBE compuesto_devolucion_detalle;
