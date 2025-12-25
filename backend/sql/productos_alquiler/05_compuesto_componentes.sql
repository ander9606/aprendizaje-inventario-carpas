-- ============================================================
-- TABLA: compuesto_componentes
-- Orden de ejecución: 5 (depende de: elementos_compuestos, series, elementos)
-- ============================================================
-- Define qué componentes tiene cada producto compuesto
-- Soporta dos tipos de componentes:
--   - tipo='serie': componente individual con número de serie (ej: TELA-007)
--   - tipo='lote': componente por cantidad (ej: 8 estacas)

CREATE TABLE IF NOT EXISTS compuesto_componentes (
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- Referencia al producto padre
    compuesto_id INT NOT NULL COMMENT 'Producto compuesto al que pertenece',

    -- Tipo de componente
    tipo_componente ENUM('serie', 'lote') NOT NULL
        COMMENT 'serie=individual con número único, lote=por cantidad',

    -- ═══════════════════════════════════════════════════════════
    -- Para tipo='serie': referencia a una serie específica
    -- ═══════════════════════════════════════════════════════════
    serie_id INT COMMENT 'ID de la serie específica (ej: TELA-007)',

    -- ═══════════════════════════════════════════════════════════
    -- Para tipo='lote': referencia al elemento + cantidad requerida
    -- ═══════════════════════════════════════════════════════════
    elemento_id INT COMMENT 'ID del elemento (ej: Estacas 30cm)',
    cantidad INT DEFAULT 1 COMMENT 'Cantidad requerida (ej: 8 estacas)',

    -- Configuración
    es_obligatorio BOOLEAN DEFAULT TRUE
        COMMENT 'TRUE=obligatorio para funcionar, FALSE=opcional/mejora',

    -- Notas adicionales
    notas VARCHAR(255) COMMENT 'Notas sobre este componente',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Keys
    CONSTRAINT fk_componente_compuesto
        FOREIGN KEY (compuesto_id) REFERENCES elementos_compuestos(id) ON DELETE CASCADE,
    CONSTRAINT fk_componente_serie
        FOREIGN KEY (serie_id) REFERENCES series(id) ON DELETE SET NULL,
    CONSTRAINT fk_componente_elemento
        FOREIGN KEY (elemento_id) REFERENCES elementos(id) ON DELETE SET NULL,

    -- Índices
    INDEX idx_componente_compuesto (compuesto_id),
    INDEX idx_componente_serie (serie_id),
    INDEX idx_componente_elemento (elemento_id),
    INDEX idx_componente_tipo (tipo_componente),
    INDEX idx_componente_obligatorio (es_obligatorio)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Componentes que conforman cada producto compuesto';


-- ============================================================
-- VERIFICACIÓN
-- ============================================================

SELECT '✅ Tabla compuesto_componentes creada' AS resultado;

DESCRIBE compuesto_componentes;
