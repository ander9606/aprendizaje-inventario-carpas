-- Migración: Soporte para órdenes de mantenimiento
-- Permite crear órdenes de trabajo sin alquiler asociado (mantenimiento, traslado, etc.)
-- y agrega columnas para marcar daños en el checklist

-- 1. Hacer alquiler_id nullable para órdenes manuales
ALTER TABLE ordenes_trabajo MODIFY COLUMN alquiler_id INT DEFAULT NULL;

-- 2. Ampliar ENUM de tipo para soportar órdenes manuales
ALTER TABLE ordenes_trabajo MODIFY COLUMN tipo ENUM('montaje', 'desmontaje', 'mantenimiento', 'traslado', 'revision', 'inventario', 'otro') NOT NULL;

-- 3. Ampliar ENUM de estado para soportar flujo de mantenimiento
ALTER TABLE ordenes_trabajo MODIFY COLUMN estado ENUM(
    'pendiente', 'confirmado', 'en_preparacion', 'en_ruta',
    'en_sitio', 'en_proceso', 'en_retorno', 'descargue',
    'en_revision', 'en_reparacion',
    'completado', 'cancelado'
) DEFAULT 'pendiente';

-- 4. Agregar columnas de marcado de daño en elementos de orden
ALTER TABLE orden_trabajo_elementos
    ADD COLUMN IF NOT EXISTS marcado_dano BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS descripcion_dano TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS cantidad_danada INT DEFAULT NULL;
