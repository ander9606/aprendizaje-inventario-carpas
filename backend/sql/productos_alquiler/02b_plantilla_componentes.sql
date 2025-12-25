-- ============================================================
-- TABLA: plantilla_componentes
-- Orden de ejecución: 2.5 (después de categorias_productos, antes de elementos_compuestos)
-- ============================================================
-- Define qué componentes DEBE tener cada tipo/categoría de producto
-- Permite:
--   - Validar si un producto está "completo" o "incompleto"
--   - Sugerir componentes al crear un nuevo producto
--   - Mantener consistencia entre productos del mismo tipo

CREATE TABLE IF NOT EXISTS plantilla_componentes (
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- ═══════════════════════════════════════════════════════════
    -- A qué categoría de producto aplica esta plantilla
    -- ═══════════════════════════════════════════════════════════
    categoria_id INT NOT NULL
        COMMENT 'Categoría de producto (ej: Carpas 10x10)',

    -- ═══════════════════════════════════════════════════════════
    -- Qué elemento/componente se requiere
    -- ═══════════════════════════════════════════════════════════
    elemento_id INT NOT NULL
        COMMENT 'Elemento del inventario requerido (ej: Tela Náutica 10x10)',

    cantidad_requerida INT DEFAULT 1
        COMMENT 'Cuántas unidades se necesitan (ej: 2 mástiles, 8 estacas)',

    -- ═══════════════════════════════════════════════════════════
    -- Configuración
    -- ═══════════════════════════════════════════════════════════
    es_obligatorio BOOLEAN DEFAULT TRUE
        COMMENT 'TRUE=sin esto no funciona, FALSE=opcional/mejora',

    orden INT DEFAULT 0
        COMMENT 'Orden de presentación en la UI',

    notas VARCHAR(255)
        COMMENT 'Notas sobre este componente en la plantilla',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Foreign Keys
    CONSTRAINT fk_plantilla_categoria
        FOREIGN KEY (categoria_id) REFERENCES categorias_productos(id) ON DELETE CASCADE,
    CONSTRAINT fk_plantilla_elemento
        FOREIGN KEY (elemento_id) REFERENCES elementos(id) ON DELETE CASCADE,

    -- Evitar duplicados: un elemento solo puede aparecer una vez por categoría
    UNIQUE KEY uk_categoria_elemento (categoria_id, elemento_id),

    -- Índices
    INDEX idx_plantilla_categoria (categoria_id),
    INDEX idx_plantilla_elemento (elemento_id),
    INDEX idx_plantilla_obligatorio (es_obligatorio)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Plantilla de componentes requeridos por cada categoría de producto';


-- ============================================================
-- DATOS DE EJEMPLO
-- ============================================================
-- NOTA: Estos INSERTs asumen que ya existen:
--   - categorias_productos (Carpas 10x10, Carpas 5x5, etc.)
--   - elementos (Tela Náutica 10x10, Mástiles, Postes, etc.)
--
-- Ajusta los IDs según tu base de datos real

-- Ejemplo de cómo se vería la plantilla para "Carpas 10x10":
-- (Descomenta y ajusta los IDs cuando tengas los datos reales)

/*
-- Plantilla para Carpas 10x10
INSERT INTO plantilla_componentes (categoria_id, elemento_id, cantidad_requerida, es_obligatorio, orden, notas) VALUES
-- Asumiendo: categoria_id=6 es "Carpas 10x10"
-- Asumiendo: elemento_id según tu tabla elementos
(6, 1, 1, TRUE, 1, 'Tela principal de la carpa'),           -- 1 Tela Náutica 10x10
(6, 2, 2, TRUE, 2, 'Mástiles centrales'),                   -- 2 Mástiles Central 3m
(6, 3, 4, TRUE, 3, 'Postes de las esquinas'),               -- 4 Postes 2.5m
(6, 4, 8, TRUE, 4, 'Para fijar al suelo'),                  -- 8 Estacas 30cm
(6, 5, 12, TRUE, 5, 'Para tensionar la estructura'),        -- 12 Reatas 5m
(6, 6, 1, FALSE, 6, 'Iluminación opcional');                -- 1 Set Luces LED (opcional)
*/


-- ============================================================
-- VERIFICACIÓN
-- ============================================================

SELECT '✅ Tabla plantilla_componentes creada' AS resultado;

DESCRIBE plantilla_componentes;
