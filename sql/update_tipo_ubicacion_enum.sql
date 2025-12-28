-- ============================================
-- SCRIPT: Actualizar ENUM de tipo en ubicaciones
-- Fecha: 2025-12-28
-- ============================================
--
-- PROPÓSITO:
-- Agregar nuevos tipos de ubicación al ENUM existente
-- para soportar lugares de eventos variados.
--
-- NUEVOS TIPOS AGREGADOS:
-- - hacienda: Hacienda / Quinta
-- - jardin: Jardín de Eventos
-- - club: Club
-- - hotel: Hotel / Resort
-- - playa: Playa
-- - parque: Parque
-- - residencia: Residencia Particular
-- ============================================

USE aprendizaje_inventario;

-- Modificar el ENUM de la columna tipo
ALTER TABLE ubicaciones
MODIFY COLUMN tipo ENUM(
    'bodega',
    'taller',
    'transito',
    'finca',
    'hacienda',
    'jardin',
    'club',
    'hotel',
    'playa',
    'parque',
    'residencia',
    'evento',
    'otro'
) DEFAULT 'bodega';

-- Verificar el cambio
DESCRIBE ubicaciones;

SELECT 'ENUM de tipo actualizado exitosamente' AS mensaje;
