-- ============================================================
-- TABLA: alquiler_elementos
-- Registra QUÉ series o lotes específicos se asignan a cada alquiler
-- Esta tabla es clave para el rastreo de inventario físico
-- ============================================================

CREATE TABLE IF NOT EXISTS alquiler_elementos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    alquiler_id INT NOT NULL,

    -- Referencia al elemento base (tipo de item)
    elemento_id INT NOT NULL,

    -- Si el elemento requiere series: se asigna serie específica
    serie_id INT DEFAULT NULL,

    -- Si el elemento NO requiere series: se asigna cantidad de un lote
    lote_id INT DEFAULT NULL,
    cantidad_lote INT DEFAULT NULL,

    -- Estado del elemento al momento de SALIDA
    estado_salida ENUM('nuevo', 'bueno', 'mantenimiento') DEFAULT 'bueno',

    -- Estado del elemento al momento de RETORNO
    estado_retorno ENUM('nuevo', 'bueno', 'dañado', 'perdido') DEFAULT NULL,

    -- Costo por daño o pérdida
    costo_dano DECIMAL(12,2) DEFAULT 0,

    -- Notas del retorno (descripción del daño, etc)
    notas_retorno TEXT,

    -- Ubicación original del elemento (para retornarlo después)
    ubicacion_original_id INT DEFAULT NULL,

    -- Fechas de movimiento
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_retorno TIMESTAMP NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- FKs
    CONSTRAINT fk_alqelem_alquiler
      FOREIGN KEY (alquiler_id) REFERENCES alquileres(id)
      ON DELETE CASCADE,

    CONSTRAINT fk_alqelem_elemento
      FOREIGN KEY (elemento_id) REFERENCES elementos(id)
      ON DELETE RESTRICT,

    CONSTRAINT fk_alqelem_serie
      FOREIGN KEY (serie_id) REFERENCES series(id)
      ON DELETE RESTRICT,

    CONSTRAINT fk_alqelem_lote
      FOREIGN KEY (lote_id) REFERENCES lotes(id)
      ON DELETE RESTRICT,

    CONSTRAINT fk_alqelem_ubicacion
      FOREIGN KEY (ubicacion_original_id) REFERENCES ubicaciones(id)
      ON DELETE SET NULL,

    -- Una serie solo puede estar en un alquiler activo a la vez
    -- (esto se valida a nivel de aplicación, pero el índice ayuda)
    UNIQUE KEY uk_alquiler_serie (alquiler_id, serie_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices para consultas frecuentes
CREATE INDEX idx_alqelem_alquiler ON alquiler_elementos(alquiler_id);
CREATE INDEX idx_alqelem_elemento ON alquiler_elementos(elemento_id);
CREATE INDEX idx_alqelem_serie ON alquiler_elementos(serie_id);
CREATE INDEX idx_alqelem_lote ON alquiler_elementos(lote_id);
CREATE INDEX idx_alqelem_estado_retorno ON alquiler_elementos(estado_retorno);
