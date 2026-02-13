-- ============================================================
-- MIGRACIÓN 25: Soporte para cotizaciones borrador (sin fecha)
-- Permite crear cotizaciones sin fechas definidas.
-- El cliente sabe qué producto quiere pero no la fecha exacta.
-- ============================================================

-- 1. Agregar 'borrador' al ENUM de estado
ALTER TABLE cotizaciones
MODIFY COLUMN estado ENUM('borrador', 'pendiente', 'aprobada', 'rechazada', 'vencida') DEFAULT 'pendiente';

-- 2. Campo para indicar si las fechas están confirmadas
ALTER TABLE cotizaciones
ADD COLUMN fechas_confirmadas TINYINT(1) DEFAULT 1 AFTER estado;

-- 3. Hacer las fechas opcionales (permitir NULL)
ALTER TABLE cotizaciones
MODIFY COLUMN fecha_evento DATE NULL;

-- 4. Marcar cotizaciones existentes como fechas confirmadas
UPDATE cotizaciones
SET fechas_confirmadas = 1
WHERE fechas_confirmadas IS NULL OR id > 0;

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
SELECT
    'Migración 25 completada' AS mensaje,
    COUNT(*) AS total_cotizaciones,
    SUM(CASE WHEN estado = 'borrador' THEN 1 ELSE 0 END) AS borradores,
    SUM(CASE WHEN fechas_confirmadas = 1 THEN 1 ELSE 0 END) AS con_fechas_confirmadas
FROM cotizaciones;
