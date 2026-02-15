-- ============================================
-- SCRIPT: Limpiar datos de prueba
-- Elimina TODOS los datos transaccionales:
--   cotizaciones, alquileres, ordenes de trabajo, eventos
-- NO elimina datos maestros:
--   clientes, productos, categorías, tarifas, empleados, etc.
-- ============================================
-- USO: mysql -u root -p nombre_bd < limpiar_datos_prueba.sql
-- ============================================

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- NIVEL 1: Tablas hoja (hijos más profundos)
-- ============================================

-- Recargos de productos de cotización
TRUNCATE TABLE cotizacion_producto_recargos;

-- Descuentos aplicados a cotizaciones
TRUNCATE TABLE cotizacion_descuentos;

-- Transportes de cotizaciones
TRUNCATE TABLE cotizacion_transportes;

-- Historial y equipo de órdenes de trabajo
TRUNCATE TABLE orden_trabajo_historial_estados;
TRUNCATE TABLE orden_trabajo_cambios_fecha;
TRUNCATE TABLE orden_trabajo_equipo;
TRUNCATE TABLE orden_trabajo_elementos;

-- Alertas de operaciones
TRUNCATE TABLE alertas_operaciones;
TRUNCATE TABLE alertas_alquiler_vistas;

-- Elementos y extensiones de alquileres
TRUNCATE TABLE alquiler_elementos;
TRUNCATE TABLE alquiler_extensiones;

-- ============================================
-- NIVEL 2: Tablas intermedias
-- ============================================

-- Productos de cotizaciones
TRUNCATE TABLE cotizacion_productos;

-- Órdenes de trabajo
TRUNCATE TABLE ordenes_trabajo;

-- Alquileres
TRUNCATE TABLE alquileres;

-- ============================================
-- NIVEL 3: Tablas principales
-- ============================================

-- Cotizaciones
TRUNCATE TABLE cotizaciones;

-- Eventos
TRUNCATE TABLE eventos;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- RESTAURAR INVENTARIO
-- Series que quedaron como 'alquilado' vuelven a 'bueno'
-- ============================================
UPDATE series SET estado = 'bueno' WHERE estado = 'alquilado';

-- ============================================
-- RESULTADO
-- ============================================
SELECT 'Limpieza completada' AS resultado;
SELECT
  (SELECT COUNT(*) FROM cotizaciones) AS cotizaciones,
  (SELECT COUNT(*) FROM alquileres) AS alquileres,
  (SELECT COUNT(*) FROM ordenes_trabajo) AS ordenes,
  (SELECT COUNT(*) FROM eventos) AS eventos,
  (SELECT COUNT(*) FROM series WHERE estado = 'alquilado') AS series_alquiladas;
