-- ============================================================
-- MIGRACIÓN: Reorganizar categorías existentes con jerarquía
-- Ejecutar DESPUÉS de 02_categorias_jerarquia.sql
-- ============================================================

-- 1. Crear las categorías padre
INSERT INTO categorias_productos (nombre, descripcion, emoji, activo)
VALUES
  ('Carpas', 'Carpas para eventos y alquiler', '🎪', 1),
  ('Parasoles', 'Parasoles y sombrillas para alquiler', '☂️', 1);

-- 2. Obtener los IDs de las nuevas categorías padre
-- (Asumiendo que se crearon con IDs 3 y 4, ajustar si es necesario)
SET @id_carpas = (SELECT id FROM categorias_productos WHERE nombre = 'Carpas' AND categoria_padre_id IS NULL LIMIT 1);
SET @id_parasoles = (SELECT id FROM categorias_productos WHERE nombre = 'Parasoles' AND categoria_padre_id IS NULL LIMIT 1);

-- 3. Actualizar las categorías existentes para que sean subcategorías
-- "carpa p10" (id=1) → hijo de "Carpas"
UPDATE categorias_productos
SET categoria_padre_id = @id_carpas
WHERE id = 1;

-- "parasoles" (id=2) → hijo de "Parasoles"
UPDATE categorias_productos
SET categoria_padre_id = @id_parasoles
WHERE id = 2;

-- 4. Verificar resultado
SELECT
  cp.id,
  cp.nombre,
  cp.emoji,
  cp.categoria_padre_id,
  padre.nombre AS categoria_padre
FROM categorias_productos cp
LEFT JOIN categorias_productos padre ON cp.categoria_padre_id = padre.id
ORDER BY COALESCE(padre.nombre, cp.nombre), cp.nombre;
