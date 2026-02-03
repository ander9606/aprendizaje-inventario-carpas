-- ============================================================
-- MIGRACIÓN 26: Agregar campo de logo de empresa
-- ============================================================

INSERT IGNORE INTO configuracion_alquileres (clave, valor, tipo, descripcion, categoria, orden)
VALUES ('empresa_logo', '', 'texto', 'Logo de la empresa para documentos', 'empresa', 0);
