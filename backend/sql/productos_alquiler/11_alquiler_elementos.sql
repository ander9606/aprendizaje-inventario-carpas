-- ============================================================
-- TABLA 11: alquiler_elementos
-- Rastreo de series/lotes asignados a cada alquiler
-- ============================================================

CREATE TABLE IF NOT EXISTS alquiler_elementos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    alquiler_id INT NOT NULL,
    elemento_id INT NOT NULL,

    -- Si requiere series: serie específica
    serie_id INT DEFAULT NULL,

    -- Si NO requiere series: lote y cantidad
    lote_id INT DEFAULT NULL,
    cantidad_lote INT DEFAULT NULL,

    -- Estado al salir
    estado_salida ENUM('nuevo', 'bueno', 'mantenimiento') DEFAULT 'bueno',

    -- Estado al retornar
    estado_retorno ENUM('nuevo', 'bueno', 'dañado', 'perdido') DEFAULT NULL,
    costo_dano DECIMAL(12,2) DEFAULT 0,
    notas_retorno TEXT,

    -- Ubicación original (para retornar después)
    ubicacion_original_id INT DEFAULT NULL,

    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_retorno TIMESTAMP NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_alqelem_alquiler
      FOREIGN KEY (alquiler_id) REFERENCES alquileres(id) ON DELETE CASCADE,

    CONSTRAINT fk_alqelem_elemento
      FOREIGN KEY (elemento_id) REFERENCES elementos(id) ON DELETE RESTRICT,

    CONSTRAINT fk_alqelem_serie
      FOREIGN KEY (serie_id) REFERENCES series(id) ON DELETE RESTRICT,

    CONSTRAINT fk_alqelem_lote
      FOREIGN KEY (lote_id) REFERENCES lotes(id) ON DELETE RESTRICT,

    CONSTRAINT fk_alqelem_ubicacion
      FOREIGN KEY (ubicacion_original_id) REFERENCES ubicaciones(id) ON DELETE SET NULL,

    UNIQUE KEY uk_alquiler_serie (alquiler_id, serie_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_alqelem_alquiler ON alquiler_elementos(alquiler_id);
CREATE INDEX idx_alqelem_elemento ON alquiler_elementos(elemento_id);
CREATE INDEX idx_alqelem_serie ON alquiler_elementos(serie_id);
CREATE INDEX idx_alqelem_lote ON alquiler_elementos(lote_id);
