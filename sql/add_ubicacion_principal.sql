-- ============================================
-- MIGRACIÓN: Agregar ubicación principal
-- Fecha: 2024
-- Descripción: Agregar campo es_principal a tabla ubicaciones
-- ============================================

-- Paso 1: Agregar columna es_principal
ALTER TABLE ubicaciones
ADD COLUMN es_principal BOOLEAN NOT NULL DEFAULT FALSE
COMMENT 'Indica si es la ubicación principal del sistema';

-- Paso 2: Marcar la primera ubicación activa como principal
-- (O puedes cambiar el WHERE para seleccionar una específica)
UPDATE ubicaciones
SET es_principal = TRUE
WHERE id = (
    SELECT id
    FROM ubicaciones
    WHERE activo = TRUE
    ORDER BY id ASC
    LIMIT 1
);

-- Paso 3: Verificar que solo haya una principal
SELECT
    id,
    nombre,
    tipo,
    es_principal,
    activo
FROM ubicaciones
WHERE es_principal = TRUE;

-- ============================================
-- NOTAS IMPORTANTES:
-- ============================================
-- 1. Solo puede haber UNA ubicación principal a la vez
-- 2. La lógica de negocio en el backend se encargará de:
--    - Al marcar una como principal, desmarcar las demás
--    - Validar que siempre exista al menos una principal
-- 3. Si quieres marcar una ubicación específica como principal,
--    ejecuta este query (reemplaza 'Bodega A' con el nombre que quieras):
--
--    UPDATE ubicaciones SET es_principal = FALSE;
--    UPDATE ubicaciones SET es_principal = TRUE WHERE nombre = 'Bodega A';
-- ============================================
