-- ============================================================
-- SCRIPT MAESTRO: Ejecutar todos los scripts en orden
-- ============================================================
-- Este script ejecuta todos los archivos SQL en el orden correcto
-- respetando las dependencias entre tablas
--
-- ORDEN DE EJECUCIÓN:
-- 01. clientes (sin dependencias)
-- 02. categorias_productos (sin dependencias)
-- 03. elementos_compuestos (depende de: ubicaciones, categorias_productos)
-- 04. series modificación (depende de: elementos_compuestos)
-- 05. compuesto_componentes (depende de: elementos_compuestos, series, elementos)
-- 06. compuesto_alquileres (depende de: elementos_compuestos, clientes)
-- 07. compuesto_devolucion_detalle (depende de: compuesto_alquileres, compuesto_componentes)
-- ============================================================

SELECT '════════════════════════════════════════════════════════════' AS '';
SELECT '  INICIANDO CREACIÓN DE TABLAS - PRODUCTOS DE ALQUILER' AS '';
SELECT '════════════════════════════════════════════════════════════' AS '';
SELECT '' AS '';

-- ============================================================
-- Para ejecutar desde línea de comandos:
-- ============================================================
--
-- OPCIÓN 1: Ejecutar cada archivo individualmente (recomendado):
--   mysql -u root -p inventario_carpas < 01_clientes.sql
--   mysql -u root -p inventario_carpas < 02_categorias_productos.sql
--   mysql -u root -p inventario_carpas < 03_elementos_compuestos.sql
--   mysql -u root -p inventario_carpas < 04_series_modificacion.sql
--   mysql -u root -p inventario_carpas < 05_compuesto_componentes.sql
--   mysql -u root -p inventario_carpas < 06_compuesto_alquileres.sql
--   mysql -u root -p inventario_carpas < 07_compuesto_devolucion_detalle.sql
--
-- OPCIÓN 2: Ejecutar todos con un script bash:
--   cd backend/sql/productos_alquiler
--   for f in 0[1-7]*.sql; do mysql -u root -p inventario_carpas < "$f"; done
--
-- ============================================================

-- Usar SOURCE para ejecutar cada archivo (solo funciona en cliente mysql)
-- SOURCE 01_clientes.sql;
-- SOURCE 02_categorias_productos.sql;
-- SOURCE 03_elementos_compuestos.sql;
-- SOURCE 04_series_modificacion.sql;
-- SOURCE 05_compuesto_componentes.sql;
-- SOURCE 06_compuesto_alquileres.sql;
-- SOURCE 07_compuesto_devolucion_detalle.sql;

SELECT '' AS '';
SELECT '════════════════════════════════════════════════════════════' AS '';
SELECT '  RESUMEN DE TABLAS A CREAR' AS '';
SELECT '════════════════════════════════════════════════════════════' AS '';

SELECT '01. clientes                    - Información de clientes' AS tabla;
SELECT '02. categorias_productos        - Categorías para productos de alquiler' AS tabla;
SELECT '03. elementos_compuestos        - Productos finales (carpas, salas)' AS tabla;
SELECT '04. series (modificación)       - Campo compuesto_id' AS tabla;
SELECT '05. compuesto_componentes       - Relación producto ↔ componentes' AS tabla;
SELECT '06. compuesto_alquileres        - Historial de alquileres' AS tabla;
SELECT '07. compuesto_devolucion_detalle - Verificación de devoluciones' AS tabla;

SELECT '' AS '';
SELECT 'Ejecuta los scripts en orden numérico (01, 02, 03...)' AS instruccion;
