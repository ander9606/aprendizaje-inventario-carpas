-- ============================================
-- SCRIPT MAESTRO: Base de Datos Completa
-- Sistema de Inventario de Carpas
-- ============================================
-- 
-- PROPÓSITO:
-- Este archivo crea toda la base de datos desde cero.
-- Ejecuta este script para resetear o instalar la BD.
--
-- AUTOR: Anderson Moreno
-- FECHA: 14 de octubre de 2025
-- VERSIÓN: 1.0
-- ============================================

-- ============================================
-- PASO 1: LIMPIAR BASE DE DATOS ANTERIOR
-- ============================================

-- Eliminar la base de datos si existe (¡CUIDADO! Borra todo)
DROP DATABASE IF EXISTS aprendizaje_inventario;

-- Crear base de datos nueva
CREATE DATABASE aprendizaje_inventario
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Seleccionar la base de datos
USE aprendizaje_inventario;

-- ============================================
-- PASO 2: CREAR TABLAS INDEPENDIENTES
-- (Estas tablas no dependen de otras)
-- ============================================

-- --------------------------------------------
-- Tabla: categorias
-- Permite jerarquía (padre_id apunta a sí misma)
-- --------------------------------------------
CREATE TABLE categorias (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    padre_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key: padre_id apunta a la misma tabla
    FOREIGN KEY (padre_id) REFERENCES categorias(id)
        ON DELETE SET NULL  -- Si eliminas padre, hijos quedan sin padre (NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------
-- Tabla: materiales
-- Catálogo de materiales de construcción
-- --------------------------------------------
CREATE TABLE materiales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------
-- Tabla: unidades
-- Catálogo de unidades de medida
-- --------------------------------------------
CREATE TABLE unidades (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    abreviatura VARCHAR(10),
    tipo ENUM('longitud', 'peso', 'volumen', 'cantidad') DEFAULT 'cantidad',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- PASO 3: CREAR TABLAS DEPENDIENTES
-- (Estas tablas tienen Foreign Keys)
-- ============================================

-- --------------------------------------------
-- Tabla: elementos
-- Inventario principal de elementos
-- --------------------------------------------
CREATE TABLE elementos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    cantidad INT DEFAULT 0,
    requiere_series BOOLEAN DEFAULT FALSE,
    
    -- Foreign Keys (columnas que apuntan a otras tablas)
    categoria_id INT,
    material_id INT,
    unidad_id INT,
    
    estado ENUM('nuevo', 'bueno', 'mantenimiento', 'alquilado', 'dañado', 'agotado') DEFAULT 'bueno',
    ubicacion VARCHAR(200),
    fecha_ingreso DATE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Declarar Foreign Keys
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
        ON DELETE SET NULL,
    FOREIGN KEY (material_id) REFERENCES materiales(id)
        ON DELETE SET NULL,
    FOREIGN KEY (unidad_id) REFERENCES unidades(id)
        ON DELETE SET NULL
        
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------
-- Tabla: series
-- Números de serie individuales para elementos
-- --------------------------------------------
CREATE TABLE series (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_elemento INT NOT NULL,
    numero_serie VARCHAR(100) UNIQUE NOT NULL,
    estado ENUM('nuevo', 'bueno', 'mantenimiento', 'alquilado', 'dañado') DEFAULT 'bueno',
    fecha_ingreso DATE,
    ubicacion VARCHAR(200),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Key
    FOREIGN KEY (id_elemento) REFERENCES elementos(id)
        ON DELETE CASCADE  -- Si eliminas elemento, elimina sus series
        
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- PASO 4: CREAR ÍNDICES (Para búsquedas rápidas)
-- ============================================

-- Índice para buscar por nombre de elemento
CREATE INDEX idx_elementos_nombre ON elementos(nombre);

-- Índice para buscar series por número
CREATE INDEX idx_series_numero ON series(numero_serie);

-- Índice para buscar categorías por nombre
CREATE INDEX idx_categorias_nombre ON categorias(nombre);

-- ============================================
-- PASO 5: INSERTAR DATOS DE PRUEBA
-- ============================================

-- --------------------------------------------
-- Categorías padre
-- --------------------------------------------
INSERT INTO categorias (nombre, padre_id) VALUES
('Carpas', NULL),
('Tubos', NULL),
('Lonas', NULL),
('Estructuras', NULL),
('Accesorios', NULL);

-- --------------------------------------------
-- Subcategorías (hijas)
-- --------------------------------------------
INSERT INTO categorias (nombre, padre_id) VALUES
('Carpas Grandes', 1),
('Carpas Medianas', 1),
('Carpas Pequeñas', 1),
('Tubos 3 metros', 2),
('Tubos 6 metros', 2),
('Lonas Blancas', 3),
('Lonas de Color', 3);

-- --------------------------------------------
-- Materiales
-- --------------------------------------------
INSERT INTO materiales (nombre, descripcion) VALUES
('Tela Nautica', 'Lona de tela nautica resistente al agua y rayos UV'),
('Acero galvanizado', 'Acero recubierto con zinc anti-corrosión'),
('Aluminio', 'Material ligero y resistente'),
('Plástico', 'Plástico durable para conectores'),
('Madera', 'Madera tratada para estructuras'),
( "Algodon", "Algodon Hindu con recubrimiento");

-- --------------------------------------------
-- Unidades
-- --------------------------------------------
INSERT INTO unidades (nombre, abreviatura, tipo) VALUES
('Metro', 'm', 'longitud'),
('Kilogramo', 'kg', 'peso'),
('Unidad', 'und', 'cantidad'),
('Rollo', 'rollo', 'cantidad'),
('Caja', 'caja', 'cantidad'),
('Litro', 'L', 'volumen');

-- --------------------------------------------
-- Elementos
-- --------------------------------------------

-- Elemento 1: Carpa con series
INSERT INTO elementos 
(nombre, descripcion, cantidad, requiere_series, categoria_id, material_id, unidad_id, estado, ubicacion, fecha_ingreso)
VALUES 
('Carpa 10x10 ', 
 'Carpa de tela nautica resistente al agua, 10 metros de diametro', 
 5, 
 TRUE, 
 6,  -- Carpas Grandes
 1,  -- Lona tela nautica
 3,  -- Unidad
 'bueno', 
 'Bodega A', 
 '2024-01-15');

-- Elemento 2: Tubos sin series
INSERT INTO elementos 
(nombre, descripcion, cantidad, requiere_series, categoria_id, material_id, unidad_id, estado, ubicacion)
VALUES 
('Tubo galvanizado 3m', 
 'Tubo de acero galvanizado de 3 metros de longitud', 
 100, 
 FALSE, 
 9,  -- Tubos 3 metros
 2,  -- Acero galvanizado
 1,  -- Metro
 'bueno', 
 'Bodega B');

-- Elemento 3: Lona sin series
INSERT INTO elementos 
(nombre, descripcion, cantidad, requiere_series, categoria_id, material_id, unidad_id, estado)
VALUES 
('Lona PVC blanca', 
 'Rollo de lona PVC blanca de 50 metros', 
 3, 
 FALSE, 
 11, -- Lonas Blancas
 1,  -- Lona PVC
 4,  -- Rollo
 'nuevo');

-- Elemento 4: Carpa sin series
INSERT INTO elementos 
(nombre, descripcion, cantidad, requiere_series, categoria_id, material_id, unidad_id, estado, ubicacion)
VALUES 
('Carpa 6x6 Hindu', 
 'Carpa económica para eventos pequeños', 
 10, 
 FALSE, 
 7,  -- Carpas Medianas
 6,  -- Lona Algodon
 3,  -- Unidad
 'bueno', 
 'Bodega A');

-- Elemento 5: Proyector con series
INSERT INTO elementos 
(nombre, descripcion, cantidad, requiere_series, categoria_id, material_id, unidad_id, estado, ubicacion, fecha_ingreso)
VALUES 
('Proyector HD', 
 'Proyector 1080p con cables HDMI incluidos', 
 3, 
 TRUE, 
 5,  -- Accesorios
 4,  -- Plástico
 3,  -- Unidad
 'nuevo', 
 'Bodega C', 
 '2024-02-01');

-- --------------------------------------------
-- Series (solo para elementos que requieren_series = TRUE)
-- --------------------------------------------

-- Series para Carpa 10x10 Premium (elemento id=1)
INSERT INTO series (id_elemento, numero_serie, estado, fecha_ingreso, ubicacion)
VALUES 
(1, 'C10X10-001', 'bueno', '2024-01-15', 'Bodega A'),
(1, 'C10X10-002', 'bueno', '2024-01-15', 'Bodega A'),
(1, 'C10X10-003', 'alquilado', '2024-01-15', NULL),
(1, 'C10X10-004', 'mantenimiento', '2024-01-20', 'Taller'),
(1, 'C10X10-005', 'nuevo', '2024-02-01', 'Bodega A');

-- Series para Proyector HD (elemento id=5)
INSERT INTO series (id_elemento, numero_serie, estado, fecha_ingreso, ubicacion)
VALUES 
(5, 'PROJ-001', 'nuevo', '2024-02-01', 'Bodega C'),
(5, 'PROJ-002', 'bueno', '2024-02-01', 'Bodega C'),
(5, 'PROJ-003', 'bueno', '2024-02-05', 'Bodega C');

-- ============================================
-- PASO 6: CONSULTAS DE VERIFICACIÓN
-- ============================================

-- Ver todas las tablas creadas
SHOW TABLES;

-- Contar registros por tabla
SELECT 'categorias' AS tabla, COUNT(*) AS registros FROM categorias
UNION ALL
SELECT 'materiales', COUNT(*) FROM materiales
UNION ALL
SELECT 'unidades', COUNT(*) FROM unidades
UNION ALL
SELECT 'elementos', COUNT(*) FROM elementos
UNION ALL
SELECT 'series', COUNT(*) FROM series;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================

-- Mensaje de éxito
SELECT 'Base de datos creada exitosamente' AS mensaje;