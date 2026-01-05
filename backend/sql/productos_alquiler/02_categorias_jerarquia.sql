-- ============================================================
-- MIGRACIÓN: Agregar jerarquía a categorías de productos
-- Permite categorías padre/hijo para mejor organización
-- ============================================================

-- Agregar columna categoria_padre_id
ALTER TABLE categorias_productos
ADD COLUMN categoria_padre_id INT NULL AFTER id;

-- Agregar foreign key (auto-referencia)
ALTER TABLE categorias_productos
ADD CONSTRAINT fk_categoria_padre
FOREIGN KEY (categoria_padre_id) REFERENCES categorias_productos(id)
ON DELETE SET NULL;

-- Agregar índice para mejorar consultas jerárquicas
CREATE INDEX idx_categoria_padre ON categorias_productos(categoria_padre_id);
