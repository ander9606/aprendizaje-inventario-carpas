-- ============================================================
-- MIGRACION 26: Seguimiento de Cotizaciones Pendientes
-- Configuracion para alertas de seguimiento de cotizaciones
-- ============================================================

-- Agregar claves de configuracion para seguimiento de cotizaciones
INSERT INTO configuracion_alquileres (clave, valor, tipo, descripcion, categoria, orden) VALUES
-- Seguimiento de cotizaciones
('dias_advertencia_vencimiento_cotizacion', '3', 'numero', 'Dias antes del vencimiento para mostrar advertencia', 'seguimiento', 1),
('dias_seguimiento_borrador', '7', 'numero', 'Dias sin actividad en borrador para generar alerta', 'seguimiento', 2),
('dias_seguimiento_pendiente', '5', 'numero', 'Dias sin atencion en cotizacion pendiente para generar alerta', 'seguimiento', 3),
('habilitar_seguimiento_cotizaciones', 'true', 'booleano', 'Habilitar alertas de seguimiento de cotizaciones', 'seguimiento', 4)
ON DUPLICATE KEY UPDATE valor = VALUES(valor);

-- Agregar campo de ultimo seguimiento a cotizaciones (para rastrear cuando se contacto al cliente)
ALTER TABLE cotizaciones
ADD COLUMN ultimo_seguimiento DATETIME NULL DEFAULT NULL AFTER fechas_confirmadas;

-- Agregar campo de notas de seguimiento
ALTER TABLE cotizaciones
ADD COLUMN notas_seguimiento TEXT NULL DEFAULT NULL AFTER ultimo_seguimiento;
