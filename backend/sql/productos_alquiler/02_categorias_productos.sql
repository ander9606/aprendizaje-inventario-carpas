-- ============================================================
-- TABLA: categorias_productos
-- Orden de ejecución: 2 (sin dependencias externas)
-- ============================================================
-- Categorías SEPARADAS para productos de alquiler
-- Diferente de 'categorias' que es para componentes del inventario
-- Soporta jerarquía (categorías y subcategorías)

CREATE TABLE IF NOT EXISTS categorias_productos (
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- Identificación
    nombre VARCHAR(100) NOT NULL COMMENT 'Ej: Carpas, Salas Lounge, Parasoles',
    emoji VARCHAR(10) COMMENT 'Emoji para identificación visual',
    descripcion TEXT,

    -- Jerarquía (permite subcategorías)
    padre_id INT DEFAULT NULL COMMENT 'NULL=categoría principal, ID=subcategoría',

    -- Campos específicos para productos de alquiler
    precio_base DECIMAL(12,2) COMMENT 'Precio sugerido para productos de esta categoría',
    deposito_sugerido DECIMAL(12,2) COMMENT 'Depósito sugerido',
    dias_minimos INT DEFAULT 1 COMMENT 'Días mínimos de alquiler',

    -- Control
    activo BOOLEAN DEFAULT TRUE,
    orden INT DEFAULT 0 COMMENT 'Para ordenar en la UI',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Foreign Keys (self-reference para jerarquía)
    CONSTRAINT fk_categoria_producto_padre
        FOREIGN KEY (padre_id) REFERENCES categorias_productos(id) ON DELETE SET NULL,

    -- Índices
    INDEX idx_catprod_padre (padre_id),
    INDEX idx_catprod_activo (activo),
    INDEX idx_catprod_orden (orden)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Categorías para productos de alquiler (separadas de categorías de componentes)';


-- ============================================================
-- DATOS DE EJEMPLO: Categorías Principales
-- ============================================================

INSERT INTO categorias_productos (nombre, emoji, descripcion, precio_base, deposito_sugerido, dias_minimos, orden) VALUES
('Carpas', '🎪', 'Carpas de todos los tamaños para eventos', 400000.00, 150000.00, 1, 1),
('Salas Lounge', '🛋️', 'Mobiliario de sala para ambientación', 300000.00, 100000.00, 1, 2),
('Parasoles', '☂️', 'Parasoles y sombrillas para exteriores', 150000.00, 50000.00, 1, 3),
('Stands', '🏢', 'Estructuras para ferias y exposiciones', 500000.00, 200000.00, 2, 4),
('Tarimas', '🎭', 'Plataformas y escenarios', 350000.00, 150000.00, 1, 5)
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);


-- ============================================================
-- DATOS DE EJEMPLO: Subcategorías de Carpas
-- ============================================================

INSERT INTO categorias_productos (nombre, emoji, descripcion, padre_id, precio_base, dias_minimos, orden)
SELECT 'Carpas 10x10', '🎪', 'Carpas de 10x10 metros', id, 500000.00, 1, 1
FROM categorias_productos WHERE nombre = 'Carpas' AND padre_id IS NULL
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);

INSERT INTO categorias_productos (nombre, emoji, descripcion, padre_id, precio_base, dias_minimos, orden)
SELECT 'Carpas 5x5', '🎪', 'Carpas de 5x5 metros', id, 300000.00, 1, 2
FROM categorias_productos WHERE nombre = 'Carpas' AND padre_id IS NULL
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);

INSERT INTO categorias_productos (nombre, emoji, descripcion, padre_id, precio_base, dias_minimos, orden)
SELECT 'Carpas 3x3', '🎪', 'Carpas de 3x3 metros', id, 200000.00, 1, 3
FROM categorias_productos WHERE nombre = 'Carpas' AND padre_id IS NULL
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);


-- ============================================================
-- DATOS DE EJEMPLO: Subcategorías de Salas Lounge
-- ============================================================

INSERT INTO categorias_productos (nombre, emoji, descripcion, padre_id, precio_base, dias_minimos, orden)
SELECT 'Sala Elegance', '🛋️', 'Sala lounge estilo elegante con sofás blancos', id, 350000.00, 1, 1
FROM categorias_productos WHERE nombre = 'Salas Lounge' AND padre_id IS NULL
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);

INSERT INTO categorias_productos (nombre, emoji, descripcion, padre_id, precio_base, dias_minimos, orden)
SELECT 'Sala Moderna', '🛋️', 'Sala lounge estilo moderno con colores neutros', id, 320000.00, 1, 2
FROM categorias_productos WHERE nombre = 'Salas Lounge' AND padre_id IS NULL
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);


-- ============================================================
-- VERIFICACIÓN
-- ============================================================

SELECT '✅ Tabla categorias_productos creada' AS resultado;

SELECT
    CASE WHEN padre_id IS NULL THEN '📁' ELSE '  └─' END AS nivel,
    CONCAT(COALESCE(emoji, ''), ' ', nombre) AS categoria,
    CONCAT('$', FORMAT(COALESCE(precio_base, 0), 0)) AS precio_base,
    dias_minimos AS dias_min
FROM categorias_productos
ORDER BY COALESCE(padre_id, id), padre_id IS NOT NULL, orden;
