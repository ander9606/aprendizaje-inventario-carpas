-- ============================================
-- MIGRACIÓN: Fotos operativas por etapa
-- Permite registrar evidencia fotográfica en
-- cada etapa de montaje/desmontaje
-- ============================================

CREATE TABLE IF NOT EXISTS orden_trabajo_fotos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    orden_id INT NOT NULL,
    etapa ENUM('cargue', 'llegada_sitio', 'montaje_terminado', 'antes_desmontaje', 'desmontaje_terminado', 'retorno') NOT NULL,
    imagen_url VARCHAR(500) NOT NULL,
    notas TEXT,
    subido_por INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (orden_id) REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
    FOREIGN KEY (subido_por) REFERENCES empleados(id) ON DELETE SET NULL
);

CREATE INDEX idx_fotos_orden ON orden_trabajo_fotos(orden_id);
CREATE INDEX idx_fotos_etapa ON orden_trabajo_fotos(etapa);
