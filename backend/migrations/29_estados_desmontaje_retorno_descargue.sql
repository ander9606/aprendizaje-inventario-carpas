-- ============================================================
-- MIGRACIÓN: Agregar estados en_retorno y descargue al flujo de desmontaje
--
-- Flujo desmontaje actualizado:
-- pendiente → confirmado → en_preparacion → en_ruta → en_sitio
--   → en_proceso → en_retorno → descargue → completado
-- ============================================================

-- Modificar ENUM de estado en ordenes_trabajo para incluir nuevos estados
ALTER TABLE ordenes_trabajo
MODIFY COLUMN estado ENUM(
    'pendiente', 'confirmado', 'en_preparacion', 'en_ruta',
    'en_sitio', 'en_proceso', 'en_retorno', 'descargue',
    'completado', 'cancelado'
) DEFAULT 'pendiente';
