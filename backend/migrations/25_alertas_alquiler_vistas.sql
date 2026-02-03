-- ============================================
-- Migración: alertas_alquiler_vistas
-- Tabla para gestionar alertas ignoradas por usuarios
-- ============================================

-- Crear tabla de alertas vistas/ignoradas
CREATE TABLE IF NOT EXISTS alertas_alquiler_vistas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tipo VARCHAR(50) NOT NULL,           -- Tipo de alerta: RETORNO_VENCIDO, ORDEN_MONTAJE_VENCIDA, etc.
  referencia_id INT NOT NULL,          -- ID del alquiler u orden relacionada
  usuario_id INT NOT NULL,             -- Usuario que ignoró la alerta
  ignorar_hasta DATETIME NOT NULL,     -- Fecha hasta la cual ignorar la alerta
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Índice único para evitar duplicados
  UNIQUE KEY idx_alerta_usuario (tipo, referencia_id, usuario_id),

  -- Índice para búsquedas rápidas
  INDEX idx_usuario_vigente (usuario_id, ignorar_hasta),

  -- Foreign key al usuario
  CONSTRAINT fk_alertas_usuario FOREIGN KEY (usuario_id) REFERENCES empleados(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comentarios de la tabla
ALTER TABLE alertas_alquiler_vistas COMMENT = 'Registro de alertas ignoradas temporalmente por usuarios';
