-- ============================================================
-- SCRIPT MAESTRO: Migraciones Módulo de Alquileres
-- ============================================================
--
-- ORDEN DE EJECUCIÓN:
--
-- 1. 08_modificar_cotizaciones.sql       - Modifica tabla cotizaciones
-- 2. 09_cotizacion_productos.sql         - Crea tabla cotizacion_productos
-- 3. 10_modificar_cotizacion_detalles.sql - Modifica cotizacion_detalles
-- 4. 11_alquiler_elementos.sql           - Crea tabla alquiler_elementos
-- 5. 12_tarifas_transporte.sql           - Crea tabla tarifas_transporte
-- 6. 13_indices_alquileres.sql           - Índices adicionales
-- 7. 14_cotizacion_transportes.sql       - Crea tabla cotizacion_transportes
--
-- ============================================================
-- ESTRUCTURA FINAL:
--
-- cotizaciones
--   └── cotizacion_productos (múltiples productos)
--   │     └── cotizacion_detalles (componentes elegidos)
--   └── cotizacion_transportes (servicio de transporte)
--
-- alquileres
--   └── alquiler_elementos (series/lotes asignados)
--
-- tarifas_transporte (catálogo de precios por ciudad)
-- ============================================================
--
-- IMPORTANTE:
-- - Hacer backup de la BD antes de ejecutar
-- - Si tienes datos en cotizaciones con compuesto_id, migrarlos primero
-- - Ejecutar en el orden indicado
-- ============================================================

-- Verificar tablas existentes antes de migrar
SELECT 'Verificando estado actual...' AS mensaje;

SELECT
    TABLE_NAME,
    TABLE_ROWS
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME IN ('cotizaciones', 'cotizacion_detalles', 'alquileres', 'clientes');

-- Verificar si hay datos que migrar
SELECT 'Cotizaciones existentes:' AS mensaje;
SELECT COUNT(*) AS total_cotizaciones FROM cotizaciones;

-- ============================================================
-- SCRIPT DE MIGRACIÓN DE DATOS (si tienes cotizaciones existentes)
-- ============================================================
--
-- Si tienes cotizaciones con compuesto_id, ejecutar ANTES del script 08:
--
-- INSERT INTO cotizacion_productos (cotizacion_id, compuesto_id, cantidad, precio_base, subtotal)
-- SELECT
--     c.id,
--     c.compuesto_id,
--     1,
--     ec.precio_base,
--     ec.precio_base
-- FROM cotizaciones c
-- INNER JOIN elementos_compuestos ec ON c.compuesto_id = ec.id;
--
-- ============================================================
