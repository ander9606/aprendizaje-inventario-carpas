-- ============================================
-- MIGRACIÓN 28: Eliminar estado 'nuevo'
-- Unifica 'nuevo' dentro de 'bueno' para simplificar el sistema
-- ============================================

-- 1. Actualizar registros existentes con estado 'nuevo' → 'bueno'
UPDATE series SET estado = 'bueno' WHERE estado = 'nuevo';
UPDATE lotes SET estado = 'bueno' WHERE estado = 'nuevo';

-- 2. Actualizar estado_salida y estado_retorno en alquiler_elementos
UPDATE alquiler_elementos SET estado_salida = 'bueno' WHERE estado_salida = 'nuevo';
UPDATE alquiler_elementos SET estado_retorno = 'bueno' WHERE estado_retorno = 'nuevo';

-- 3. Modificar ENUMs para quitar 'nuevo'
-- Series: quitar 'nuevo' del ENUM
ALTER TABLE series
  MODIFY COLUMN estado ENUM('bueno', 'mantenimiento', 'alquilado', 'dañado') DEFAULT 'bueno';

-- Lotes: quitar 'nuevo' del ENUM
ALTER TABLE lotes
  MODIFY COLUMN estado ENUM('bueno', 'mantenimiento', 'alquilado', 'dañado', 'agotado') DEFAULT 'bueno';

-- alquiler_elementos.estado_salida: quitar 'nuevo'
ALTER TABLE alquiler_elementos
  MODIFY COLUMN estado_salida ENUM('bueno', 'mantenimiento') DEFAULT 'bueno';

-- alquiler_elementos.estado_retorno: quitar 'nuevo'
ALTER TABLE alquiler_elementos
  MODIFY COLUMN estado_retorno ENUM('bueno', 'dañado', 'perdido') DEFAULT NULL;
