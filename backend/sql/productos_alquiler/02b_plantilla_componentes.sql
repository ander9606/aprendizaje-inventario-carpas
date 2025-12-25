-- ============================================================
-- TABLA: plantilla_componentes
-- Orden de ejecución: 2.5 (después de categorias_productos, antes de elementos_compuestos)
-- ============================================================
-- Define qué componentes DEBE tener cada tipo/categoría de producto
-- Permite:
--   - Validar si un producto está "completo" o "incompleto"
--   - Sugerir componentes al crear un nuevo producto
--   - Mantener consistencia entre productos del mismo tipo
--   - Manejar componentes alternativos (ej: estacas O contrapesos)

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
    -- Grupos de alternativas
    -- ═══════════════════════════════════════════════════════════
    -- NULL = componente fijo obligatorio (siempre debe estar)
    -- "anclajes" = puede ser estacas O contrapesos (la suma debe cumplir cantidad)
    -- "postes" = puede ser postes altos O bajos
    grupo_alternativo VARCHAR(50) DEFAULT NULL
        COMMENT 'NULL=fijo, valor=grupo de alternativas intercambiables',

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
    INDEX idx_plantilla_obligatorio (es_obligatorio),
    INDEX idx_plantilla_grupo (grupo_alternativo)

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

-- ════════════════════════════════════════════════════════════════════
-- EJEMPLO: Plantilla para "Carpas 10x10"
-- ════════════════════════════════════════════════════════════════════
-- Descomenta y ajusta los IDs cuando tengas los datos reales

/*
INSERT INTO plantilla_componentes
(categoria_id, elemento_id, cantidad_requerida, grupo_alternativo, es_obligatorio, orden, notas) VALUES

-- ─────────────────────────────────────────────────────────────────────
-- COMPONENTES FIJOS (grupo_alternativo = NULL)
-- Siempre deben estar, no hay alternativas
-- ─────────────────────────────────────────────────────────────────────
(6, 1, 1, NULL, TRUE, 1, 'Tela principal'),              -- 1 Tela Náutica 10x10
(6, 2, 2, NULL, TRUE, 2, 'Mástiles centrales'),          -- 2 Mástiles Central 3m

-- ─────────────────────────────────────────────────────────────────────
-- GRUPO: "anclajes" - Necesita 11 total
-- Puede ser cualquier combinación de estacas y/o contrapesos
-- Ejemplos válidos: 11 estacas, 11 contrapesos, 6 estacas + 5 contrapesos
-- ─────────────────────────────────────────────────────────────────────
(6, 10, 11, 'anclajes', TRUE, 3, 'Estacas como anclaje'),    -- Estacas 30cm
(6, 11, 11, 'anclajes', TRUE, 3, 'Contrapesos como anclaje'), -- Contrapesos 20kg

-- ─────────────────────────────────────────────────────────────────────
-- GRUPO: "postes" - Necesita 4 total
-- Versión alta (2.5m) O versión baja (2.0m), no mezclar
-- ─────────────────────────────────────────────────────────────────────
(6, 20, 4, 'postes', TRUE, 4, 'Para versión ALTA'),      -- Postes 2.5m
(6, 21, 4, 'postes', TRUE, 4, 'Para versión BAJA'),      -- Postes 2.0m

-- ─────────────────────────────────────────────────────────────────────
-- GRUPO: "reatas" - Necesita 12 total
-- Debe coincidir con la versión de postes elegida
-- ─────────────────────────────────────────────────────────────────────
(6, 30, 12, 'reatas', TRUE, 5, 'Para versión ALTA'),     -- Reatas 6m
(6, 31, 12, 'reatas', TRUE, 5, 'Para versión BAJA'),     -- Reatas 5m

-- ─────────────────────────────────────────────────────────────────────
-- COMPONENTES OPCIONALES
-- ─────────────────────────────────────────────────────────────────────
(6, 40, 1, NULL, FALSE, 6, 'Iluminación opcional');      -- Set Luces LED
*/

-- ════════════════════════════════════════════════════════════════════
-- LÓGICA DE VALIDACIÓN (para implementar en backend)
-- ════════════════════════════════════════════════════════════════════
--
-- Para verificar si un producto está COMPLETO:
--
-- 1. Componentes FIJOS (grupo_alternativo IS NULL):
--    → Debe tener EXACTAMENTE la cantidad_requerida
--
-- 2. Componentes de GRUPO (grupo_alternativo IS NOT NULL):
--    → La SUMA de todos los componentes del mismo grupo
--      debe ser >= cantidad_requerida (de cualquiera del grupo)
--
-- Ejemplo para grupo "anclajes" con cantidad_requerida=11:
--    ✓ 11 estacas + 0 contrapesos = 11 ✓
--    ✓ 0 estacas + 11 contrapesos = 11 ✓
--    ✓ 6 estacas + 5 contrapesos = 11 ✓
--    ✗ 5 estacas + 3 contrapesos = 8 ✗ (INCOMPLETO)
--


-- ============================================================
-- VERIFICACIÓN
-- ============================================================

SELECT '✅ Tabla plantilla_componentes creada' AS resultado;

DESCRIBE plantilla_componentes;
