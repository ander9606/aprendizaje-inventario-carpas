-- ============================================================
-- TABLA: compuesto_componentes
-- Componentes de cada plantilla (fijos, alternativas, adicionales)
-- ============================================================

CREATE TABLE IF NOT EXISTS compuesto_componentes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    compuesto_id INT NOT NULL,
    elemento_id INT NOT NULL,
    cantidad INT DEFAULT 1,

    -- Tipo: 'fijo' | 'alternativa' | 'adicional'
    tipo ENUM('fijo', 'alternativa', 'adicional') DEFAULT 'fijo',

    -- Para alternativas: nombre del grupo (ej: "anclajes", "postes")
    grupo VARCHAR(50) DEFAULT NULL,

    -- Para alternativas: TRUE = opción incluida en precio base
    es_default BOOLEAN DEFAULT FALSE,

    -- Precio adicional por unidad ($0 para fijos y defaults)
    precio_adicional DECIMAL(12,2) DEFAULT 0,

    orden INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (compuesto_id) REFERENCES elementos_compuestos(id) ON DELETE CASCADE,
    FOREIGN KEY (elemento_id) REFERENCES elementos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
