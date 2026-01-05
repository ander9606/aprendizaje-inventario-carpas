-- ============================================================
-- MODIFICACIÓN: alquiler_elementos
-- Agregar campo para rastrear lote con estado 'alquilado'
-- ============================================================

-- Agregar campo lote_alquilado_id
ALTER TABLE alquiler_elementos
  ADD COLUMN lote_alquilado_id INT DEFAULT NULL AFTER lote_id;

-- Agregar FK
ALTER TABLE alquiler_elementos
  ADD CONSTRAINT fk_alqelem_lote_alquilado
    FOREIGN KEY (lote_alquilado_id) REFERENCES lotes(id) ON DELETE SET NULL;

-- Índice para búsquedas
CREATE INDEX idx_alqelem_lote_alquilado ON alquiler_elementos(lote_alquilado_id);
