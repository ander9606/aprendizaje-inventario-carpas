-- ============================================
-- PASO 1: Fundamentos de SQL
-- Fecha: [9 octubre 2025]
-- ============================================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS aprendizaje_inventario;
USE aprendizaje_inventario;

-- Crear tabla de categorías
CREATE TABLE categorias (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL
);
-- ============================================
-- PASO 2: Relaciones entre Tablas
-- Fecha: [9 10 25]
-- ============================================

USE aprendizaje_inventario;

-- Agregar columna padre_id
ALTER TABLE categorias 
ADD COLUMN padre_id INT;

-- Agregar Foreign Key
ALTER TABLE categorias
ADD CONSTRAINT fk_padre
FOREIGN KEY (padre_id) REFERENCES categorias(id);

-- Insertar subcategorías de Carpas
INSERT INTO categorias (nombre, padre_id) VALUES ('Carpas Grandes', 1);
INSERT INTO categorias (nombre, padre_id) VALUES ('Carpas Medianas', 1);
INSERT INTO categorias (nombre, padre_id) VALUES ('Carpas Pequeñas', 1);

-- Verificar jerarquía
SELECT * FROM categorias;

-- Ver solo categorías padre
SELECT * FROM categorias WHERE padre_id IS NULL;

-- Ver subcategorías con su padre
SELECT 
    hijo.nombre AS subcategoria,
    padre.nombre AS categoria_padre
FROM categorias hijo
LEFT JOIN categorias padre ON hijo.padre_id = padre.id
WHERE hijo.padre_id IS NOT NULL;
-- Insertar datos de prueba
INSERT INTO categorias (nombre) VALUES ('Carpas');
INSERT INTO categorias (nombre) VALUES ('Tubos');
INSERT INTO categorias (nombre) VALUES ('Lonas');

-- Verificar
SELECT * FROM categorias;