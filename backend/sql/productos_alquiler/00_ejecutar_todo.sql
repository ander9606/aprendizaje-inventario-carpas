-- ============================================================
-- SCRIPT MAESTRO: Ejecutar todas las tablas en orden
-- ============================================================
--
-- Ejecutar con:
--   mysql -u usuario -p basedatos < 00_ejecutar_todo.sql
--
-- O ejecutar cada archivo individualmente en este orden:
--   1. 01_categorias_productos.sql
--   2. 02_elementos_compuestos.sql
--   3. 03_compuesto_componentes.sql
--   4. 04_clientes.sql
--   5. 05_cotizaciones.sql
--   6. 06_cotizacion_detalles.sql
--   7. 07_alquileres.sql
--
-- ============================================================

SOURCE 01_categorias_productos.sql;
SOURCE 02_elementos_compuestos.sql;
SOURCE 03_compuesto_componentes.sql;
SOURCE 04_clientes.sql;
SOURCE 05_cotizaciones.sql;
SOURCE 06_cotizacion_detalles.sql;
SOURCE 07_alquileres.sql;

-- Verificar tablas creadas
SHOW TABLES LIKE '%compuesto%';
SHOW TABLES LIKE '%cotizacion%';
SHOW TABLES LIKE '%alquiler%';
SHOW TABLES LIKE '%cliente%';
