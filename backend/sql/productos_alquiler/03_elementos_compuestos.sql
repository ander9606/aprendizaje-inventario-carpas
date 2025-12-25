-- ============================================================
-- TABLA: elementos_compuestos
-- Orden de ejecución: 3 (depende de: ubicaciones, categorias_productos)
-- ============================================================
-- Productos finales armados listos para alquilar
-- Ejemplos: Carpa 10x10 #001, Sala Lounge #001, Parasol Grande #001
-- Cada producto se compone de múltiples elementos individuales

CREATE TABLE IF NOT EXISTS elementos_compuestos (
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- Identificación
    nombre VARCHAR(200) NOT NULL COMMENT 'Ej: Carpa 10x10 Premium #001',
    codigo VARCHAR(50) UNIQUE COMMENT 'Código único: CARPA-10X10-001',
    descripcion TEXT,

    -- Estado del producto
    estado ENUM('disponible', 'alquilado', 'mantenimiento', 'incompleto', 'retirado')
           DEFAULT 'disponible' NOT NULL
           COMMENT 'disponible=listo para alquilar, incompleto=falta componente',

    -- Ubicación actual (NULL cuando está alquilado)
    ubicacion_id INT COMMENT 'Dónde está físicamente (NULL si está alquilado)',

    -- Información comercial
    precio_alquiler DECIMAL(12,2) COMMENT 'Precio de alquiler por día/evento',
    deposito DECIMAL(12,2) COMMENT 'Depósito requerido',

    -- Categorización
    categoria_id INT COMMENT 'Categoría del producto (de categorias_productos)',

    -- Extras
    imagen_url VARCHAR(500),
    notas TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Foreign Keys
    CONSTRAINT fk_compuesto_ubicacion
        FOREIGN KEY (ubicacion_id) REFERENCES ubicaciones(id) ON DELETE SET NULL,
    CONSTRAINT fk_compuesto_categoria
        FOREIGN KEY (categoria_id) REFERENCES categorias_productos(id) ON DELETE SET NULL,

    -- Índices
    INDEX idx_compuesto_estado (estado),
    INDEX idx_compuesto_ubicacion (ubicacion_id),
    INDEX idx_compuesto_categoria (categoria_id),
    INDEX idx_compuesto_codigo (codigo)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Productos compuestos listos para alquilar (carpas armadas, salas, etc.)';


-- ============================================================
-- DATOS DE EJEMPLO
-- ============================================================

-- Insertar productos de ejemplo (las categorías deben existir primero)
INSERT INTO elementos_compuestos (nombre, codigo, descripcion, estado, precio_alquiler, deposito, categoria_id)
SELECT
    'Carpa 10x10 Premium #001',
    'CARPA-10X10-001',
    'Carpa blanca premium con tela náutica resistente al agua. Incluye mástiles, postes y accesorios completos.',
    'disponible',
    500000.00,
    200000.00,
    (SELECT id FROM categorias_productos WHERE nombre = 'Carpas 10x10' LIMIT 1)
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);

INSERT INTO elementos_compuestos (nombre, codigo, descripcion, estado, precio_alquiler, deposito, categoria_id)
SELECT
    'Carpa 10x10 Premium #002',
    'CARPA-10X10-002',
    'Carpa blanca premium con tela náutica resistente al agua. Incluye mástiles, postes y accesorios completos.',
    'disponible',
    500000.00,
    200000.00,
    (SELECT id FROM categorias_productos WHERE nombre = 'Carpas 10x10' LIMIT 1)
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);

INSERT INTO elementos_compuestos (nombre, codigo, descripcion, estado, precio_alquiler, deposito, categoria_id)
SELECT
    'Carpa 5x5 Estándar #001',
    'CARPA-5X5-001',
    'Carpa mediana ideal para eventos pequeños. Incluye todos los accesorios.',
    'disponible',
    300000.00,
    120000.00,
    (SELECT id FROM categorias_productos WHERE nombre = 'Carpas 5x5' LIMIT 1)
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);

INSERT INTO elementos_compuestos (nombre, codigo, descripcion, estado, precio_alquiler, deposito, categoria_id)
SELECT
    'Sala Lounge Elegance #001',
    'SALA-ELEG-001',
    'Sala lounge completa con sofás blancos, mesa de centro y cojines decorativos.',
    'disponible',
    350000.00,
    150000.00,
    (SELECT id FROM categorias_productos WHERE nombre = 'Sala Elegance' LIMIT 1)
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);


-- ============================================================
-- VERIFICACIÓN
-- ============================================================

SELECT '✅ Tabla elementos_compuestos creada' AS resultado;

SELECT
    ec.codigo,
    ec.nombre,
    ec.estado,
    CONCAT('$', FORMAT(ec.precio_alquiler, 0)) AS precio,
    COALESCE(cp.nombre, 'Sin categoría') AS categoria
FROM elementos_compuestos ec
LEFT JOIN categorias_productos cp ON ec.categoria_id = cp.id;
