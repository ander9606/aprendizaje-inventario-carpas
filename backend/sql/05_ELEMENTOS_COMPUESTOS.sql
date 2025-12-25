-- ============================================================
-- SCRIPT: Crear tablas para Sistema de Elementos Compuestos
-- Base de datos: inventario_carpas
-- Fecha: Diciembre 2024
-- Autor: Anderson Moreno (Anchi)
-- Versión: 2.0 - Con tabla categorias_productos separada
-- ============================================================

-- ============================================================
-- 1. TABLA DE CATEGORÍAS PARA PRODUCTOS: categorias_productos
-- ============================================================
-- Categorías SEPARADAS para productos de alquiler (Carpas, Salas, Parasoles)
-- Diferente a 'categorias' que es para componentes del inventario

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
COMMENT='Categorías para productos de alquiler (separadas de las categorías de componentes)';


-- ============================================================
-- 2. TABLA PRINCIPAL: elementos_compuestos
-- ============================================================
-- Almacena los productos finales armados listos para alquilar
-- Ejemplos: Carpa 10x10 #001, Sala Lounge #001, Parasol Grande #001

CREATE TABLE IF NOT EXISTS elementos_compuestos (
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- Identificación
    nombre VARCHAR(200) NOT NULL COMMENT 'Ej: Carpa 10x10 Premium #001',
    codigo VARCHAR(50) UNIQUE COMMENT 'Ej: CARPA-10X10-001',
    descripcion TEXT,

    -- Estado del producto
    estado ENUM('disponible', 'alquilado', 'mantenimiento', 'incompleto', 'retirado')
           DEFAULT 'disponible' NOT NULL,

    -- Ubicación actual (NULL cuando está alquilado)
    ubicacion_id INT,

    -- Información comercial
    precio_alquiler DECIMAL(12,2) COMMENT 'Precio base de alquiler',
    deposito DECIMAL(12,2) COMMENT 'Depósito requerido',

    -- Categorización (referencia a categorias_productos, NO a categorias)
    categoria_id INT COMMENT 'Categoría del producto (Carpas, Salas, etc.)',

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
    INDEX idx_compuesto_categoria (categoria_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Productos finales compuestos listos para alquilar (carpas armadas, salas lounge, etc.)';


-- ============================================================
-- 3. TABLA DE RELACIÓN: compuesto_componentes
-- ============================================================
-- Define qué componentes tiene cada producto compuesto
-- Puede ser tipo 'serie' (componente individual) o 'lote' (por cantidad)

CREATE TABLE IF NOT EXISTS compuesto_componentes (
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- Referencia al producto padre
    compuesto_id INT NOT NULL,

    -- Tipo de componente
    tipo_componente ENUM('serie', 'lote') NOT NULL
        COMMENT 'serie=componente individual, lote=componente por cantidad',

    -- Para tipo='serie': referencia a una serie específica
    serie_id INT COMMENT 'ID de la serie específica (ej: TELA-007)',

    -- Para tipo='lote': referencia al elemento + cantidad
    elemento_id INT COMMENT 'ID del elemento (ej: Estacas)',
    cantidad INT DEFAULT 1 COMMENT 'Cantidad requerida (ej: 8 estacas)',

    -- Configuración
    es_obligatorio BOOLEAN DEFAULT TRUE
        COMMENT 'TRUE=obligatorio para que funcione, FALSE=opcional/mejora',

    -- Notas
    notas VARCHAR(255),

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
    INDEX idx_componente_tipo (tipo_componente)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Relación entre productos compuestos y sus componentes individuales';


-- ============================================================
-- 4. TABLA DE ALQUILERES: compuesto_alquileres
-- ============================================================
-- Registra el historial de cada alquiler de un producto compuesto

CREATE TABLE IF NOT EXISTS compuesto_alquileres (
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- Referencia al producto alquilado
    compuesto_id INT NOT NULL,

    -- Información del cliente
    cliente_nombre VARCHAR(200) NOT NULL,
    cliente_telefono VARCHAR(20),
    cliente_email VARCHAR(100),
    cliente_documento VARCHAR(50) COMMENT 'Cédula, NIT, etc.',

    -- Información del evento
    evento_nombre VARCHAR(200),
    evento_direccion TEXT,
    evento_ciudad VARCHAR(100),

    -- Fechas del alquiler
    fecha_inicio DATE NOT NULL,
    fecha_fin_estimada DATE NOT NULL,
    fecha_devolucion DATE COMMENT 'Se llena cuando se devuelve',

    -- Estado del alquiler
    estado ENUM('activo', 'devuelto', 'vencido', 'cancelado') DEFAULT 'activo',

    -- Información financiera
    precio_acordado DECIMAL(12,2),
    deposito_cobrado DECIMAL(12,2),
    deposito_devuelto DECIMAL(12,2) COMMENT 'Depósito devuelto al cliente',

    -- Notas
    notas_alquiler TEXT COMMENT 'Notas al momento de alquilar',
    notas_devolucion TEXT COMMENT 'Notas al momento de devolver',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Foreign Keys
    CONSTRAINT fk_alquiler_compuesto
        FOREIGN KEY (compuesto_id) REFERENCES elementos_compuestos(id) ON DELETE CASCADE,

    -- Índices
    INDEX idx_alquiler_compuesto (compuesto_id),
    INDEX idx_alquiler_estado (estado),
    INDEX idx_alquiler_fechas (fecha_inicio, fecha_fin_estimada),
    INDEX idx_alquiler_cliente (cliente_nombre(50))

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Historial de alquileres de productos compuestos';


-- ============================================================
-- 5. TABLA DE DETALLE DE DEVOLUCIÓN: compuesto_devolucion_detalle
-- ============================================================
-- Registra el estado de cada componente al momento de devolución

CREATE TABLE IF NOT EXISTS compuesto_devolucion_detalle (
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- Referencias
    alquiler_id INT NOT NULL,
    componente_id INT NOT NULL,

    -- Estado reportado en la devolución
    estado_devuelto ENUM('bueno', 'dañado', 'perdido') NOT NULL,

    -- Detalles
    notas TEXT COMMENT 'Descripción del daño o problema',
    costo_reparacion DECIMAL(12,2) COMMENT 'Costo estimado de reparación',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Keys
    CONSTRAINT fk_devolucion_alquiler
        FOREIGN KEY (alquiler_id) REFERENCES compuesto_alquileres(id) ON DELETE CASCADE,
    CONSTRAINT fk_devolucion_componente
        FOREIGN KEY (componente_id) REFERENCES compuesto_componentes(id) ON DELETE CASCADE,

    -- Índices
    INDEX idx_devolucion_alquiler (alquiler_id),
    INDEX idx_devolucion_estado (estado_devuelto)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Detalle del estado de cada componente al momento de devolución';


-- ============================================================
-- 6. MODIFICAR TABLA SERIES: Agregar referencia a compuesto
-- ============================================================
-- Agregar columna para marcar qué series están asignadas a un compuesto

-- Primero verificamos si la columna ya existe
SET @columnExists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'series'
      AND COLUMN_NAME = 'compuesto_id'
);

-- Solo agregar si no existe
SET @alterStatement = IF(@columnExists = 0,
    'ALTER TABLE series ADD COLUMN compuesto_id INT DEFAULT NULL COMMENT ''ID del elemento compuesto al que pertenece (NULL=disponible)''',
    'SELECT ''La columna compuesto_id ya existe en la tabla series'' AS mensaje'
);

PREPARE alterStmt FROM @alterStatement;
EXECUTE alterStmt;
DEALLOCATE PREPARE alterStmt;

-- Agregar foreign key si no existe
SET @fkExists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'series'
      AND COLUMN_NAME = 'compuesto_id'
      AND REFERENCED_TABLE_NAME = 'elementos_compuestos'
);

SET @addFkStatement = IF(@fkExists = 0 AND @columnExists = 0,
    'ALTER TABLE series ADD CONSTRAINT fk_serie_compuesto FOREIGN KEY (compuesto_id) REFERENCES elementos_compuestos(id) ON DELETE SET NULL',
    'SELECT ''La FK ya existe o la columna ya existía'' AS mensaje'
);

PREPARE addFkStmt FROM @addFkStatement;
EXECUTE addFkStmt;
DEALLOCATE PREPARE addFkStmt;

-- Agregar índice si no existe
SET @idxExists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'series'
      AND INDEX_NAME = 'idx_serie_compuesto'
);

SET @addIdxStatement = IF(@idxExists = 0 AND @columnExists = 0,
    'ALTER TABLE series ADD INDEX idx_serie_compuesto (compuesto_id)',
    'SELECT ''El índice ya existe o la columna ya existía'' AS mensaje'
);

PREPARE addIdxStmt FROM @addIdxStatement;
EXECUTE addIdxStmt;
DEALLOCATE PREPARE addIdxStmt;


-- ============================================================
-- 7. DATOS DE EJEMPLO: Categorías de Productos
-- ============================================================

INSERT INTO categorias_productos (nombre, emoji, descripcion, precio_base, deposito_sugerido, dias_minimos, orden) VALUES
('Carpas', '🎪', 'Carpas de todos los tamaños para eventos', 400000.00, 150000.00, 1, 1),
('Salas Lounge', '🛋️', 'Mobiliario de sala para ambientación', 300000.00, 100000.00, 1, 2),
('Parasoles', '☂️', 'Parasoles y sombrillas para exteriores', 150000.00, 50000.00, 1, 3),
('Stands', '🏢', 'Estructuras para ferias y exposiciones', 500000.00, 200000.00, 2, 4),
('Tarimas', '🎭', 'Plataformas y escenarios', 350000.00, 150000.00, 1, 5)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- Subcategorías de Carpas
INSERT INTO categorias_productos (nombre, emoji, descripcion, padre_id, precio_base, dias_minimos, orden) VALUES
('Carpas 10x10', '🎪', 'Carpas de 10x10 metros',
    (SELECT id FROM (SELECT id FROM categorias_productos WHERE nombre = 'Carpas' LIMIT 1) AS t),
    500000.00, 1, 1),
('Carpas 5x5', '🎪', 'Carpas de 5x5 metros',
    (SELECT id FROM (SELECT id FROM categorias_productos WHERE nombre = 'Carpas' LIMIT 1) AS t),
    300000.00, 1, 2),
('Carpas 3x3', '🎪', 'Carpas de 3x3 metros',
    (SELECT id FROM (SELECT id FROM categorias_productos WHERE nombre = 'Carpas' LIMIT 1) AS t),
    200000.00, 1, 3)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);


-- ============================================================
-- 8. DATOS DE EJEMPLO: Productos Compuestos
-- ============================================================

-- Obtener el ID de la categoría "Carpas 10x10"
SET @cat_carpa_10x10 = (SELECT id FROM categorias_productos WHERE nombre = 'Carpas 10x10' LIMIT 1);
SET @cat_sala = (SELECT id FROM categorias_productos WHERE nombre = 'Salas Lounge' LIMIT 1);

INSERT INTO elementos_compuestos (nombre, codigo, descripcion, estado, precio_alquiler, deposito, categoria_id) VALUES
('Carpa 10x10 Premium #001', 'CARPA-10X10-001', 'Carpa blanca premium con tela náutica resistente al agua. Incluye mástiles, postes y accesorios.', 'disponible', 500000.00, 200000.00, @cat_carpa_10x10),
('Carpa 10x10 Premium #002', 'CARPA-10X10-002', 'Carpa blanca premium con tela náutica resistente al agua. Incluye mástiles, postes y accesorios.', 'disponible', 500000.00, 200000.00, @cat_carpa_10x10),
('Sala Lounge Elegance #001', 'SALA-ELEG-001', 'Sala lounge completa con sofás blancos, mesa de centro y cojines decorativos.', 'disponible', 350000.00, 150000.00, @cat_sala)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);


-- ============================================================
-- 9. VERIFICACIÓN FINAL
-- ============================================================

SELECT '========================================================' AS '';
SELECT '  ✅ TABLAS CREADAS EXITOSAMENTE' AS 'RESULTADO';
SELECT '========================================================' AS '';

SELECT '' AS '';
SELECT 'NUEVAS TABLAS:' AS 'INFO';
SELECT TABLE_NAME, TABLE_COMMENT
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
AND (TABLE_NAME LIKE '%compuesto%' OR TABLE_NAME = 'categorias_productos')
ORDER BY TABLE_NAME;

SELECT '' AS '';
SELECT 'CATEGORÍAS DE PRODUCTOS:' AS 'DATOS';
SELECT id, CONCAT(COALESCE(emoji, ''), ' ', nombre) AS categoria,
       CASE WHEN padre_id IS NULL THEN 'Principal' ELSE 'Subcategoría' END AS tipo,
       CONCAT('$', FORMAT(COALESCE(precio_base, 0), 0)) AS precio_base
FROM categorias_productos
ORDER BY COALESCE(padre_id, id), orden;

SELECT '' AS '';
SELECT 'PRODUCTOS DE EJEMPLO:' AS 'DATOS';
SELECT ec.id, ec.nombre, ec.codigo, ec.estado,
       CONCAT('$', FORMAT(ec.precio_alquiler, 0)) AS precio,
       cp.nombre AS categoria
FROM elementos_compuestos ec
LEFT JOIN categorias_productos cp ON ec.categoria_id = cp.id;
