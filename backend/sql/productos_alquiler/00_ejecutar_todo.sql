-- ============================================================
-- SCRIPT MAESTRO: Ejecutar todos los scripts en orden
-- ============================================================
-- Este script lista todos los archivos SQL en el orden correcto
-- respetando las dependencias entre tablas
--
-- ORDEN DE EJECUCIÓN:
-- 01.  clientes (sin dependencias)
-- 02.  categorias_productos (sin dependencias)
-- 02b. plantilla_componentes (depende de: categorias_productos, elementos)
-- 03.  elementos_compuestos (depende de: ubicaciones, categorias_productos)
-- 04.  series modificación (depende de: elementos_compuestos)
-- 05.  compuesto_componentes (depende de: elementos_compuestos, series, elementos)
-- 06.  compuesto_alquileres (depende de: elementos_compuestos, clientes)
-- 07.  compuesto_devolucion_detalle (depende de: compuesto_alquileres, compuesto_componentes)
-- ============================================================

SELECT '════════════════════════════════════════════════════════════' AS '';
SELECT '  SISTEMA DE PRODUCTOS DE ALQUILER - SCRIPTS SQL' AS '';
SELECT '════════════════════════════════════════════════════════════' AS '';
SELECT '' AS '';

-- ============================================================
-- Para ejecutar desde línea de comandos:
-- ============================================================
--
-- OPCIÓN 1: Ejecutar cada archivo individualmente (recomendado):
--
--   cd backend/sql/productos_alquiler
--
--   mysql -u root -p inventario_carpas < 01_clientes.sql
--   mysql -u root -p inventario_carpas < 02_categorias_productos.sql
--   mysql -u root -p inventario_carpas < 02b_plantilla_componentes.sql
--   mysql -u root -p inventario_carpas < 03_elementos_compuestos.sql
--   mysql -u root -p inventario_carpas < 04_series_modificacion.sql
--   mysql -u root -p inventario_carpas < 05_compuesto_componentes.sql
--   mysql -u root -p inventario_carpas < 06_compuesto_alquileres.sql
--   mysql -u root -p inventario_carpas < 07_compuesto_devolucion_detalle.sql
--
-- ============================================================

SELECT '' AS '';
SELECT '════════════════════════════════════════════════════════════' AS '';
SELECT '  RESUMEN DE TABLAS' AS '';
SELECT '════════════════════════════════════════════════════════════' AS '';

SELECT '01.  clientes                     - Clientes (personas/empresas)' AS tabla;
SELECT '02.  categorias_productos         - Categorías de productos de alquiler' AS tabla;
SELECT '02b. plantilla_componentes        - Plantilla: qué componentes requiere cada categoría' AS tabla;
SELECT '03.  elementos_compuestos         - Productos finales (carpas, salas)' AS tabla;
SELECT '04.  series (modificación)        - Agrega campo compuesto_id' AS tabla;
SELECT '05.  compuesto_componentes        - Componentes de cada producto' AS tabla;
SELECT '06.  compuesto_alquileres         - Historial de alquileres' AS tabla;
SELECT '07.  compuesto_devolucion_detalle - Verificación al devolver' AS tabla;

SELECT '' AS '';
SELECT '════════════════════════════════════════════════════════════' AS '';
SELECT '  DIAGRAMA DE RELACIONES' AS '';
SELECT '════════════════════════════════════════════════════════════' AS '';
SELECT '' AS '';
SELECT '  clientes ─────────────────────────────┐' AS diagrama;
SELECT '                                        │' AS diagrama;
SELECT '  categorias_productos ──┬──────────────┤' AS diagrama;
SELECT '           │             │              │' AS diagrama;
SELECT '           │             ▼              │' AS diagrama;
SELECT '           │   plantilla_componentes    │' AS diagrama;
SELECT '           │             │              │' AS diagrama;
SELECT '           ▼             │              │' AS diagrama;
SELECT '  elementos_compuestos ◄─┘              │' AS diagrama;
SELECT '           │                            │' AS diagrama;
SELECT '           ▼                            │' AS diagrama;
SELECT '  series (modificación)                 │' AS diagrama;
SELECT '           │                            │' AS diagrama;
SELECT '           ▼                            ▼' AS diagrama;
SELECT '  compuesto_componentes    compuesto_alquileres' AS diagrama;
SELECT '           │                     │' AS diagrama;
SELECT '           └──────────┬──────────┘' AS diagrama;
SELECT '                      ▼' AS diagrama;
SELECT '        compuesto_devolucion_detalle' AS diagrama;
SELECT '' AS '';
SELECT '════════════════════════════════════════════════════════════' AS '';
SELECT '  Ejecuta los scripts en orden numérico' AS instruccion;
SELECT '════════════════════════════════════════════════════════════' AS '';
