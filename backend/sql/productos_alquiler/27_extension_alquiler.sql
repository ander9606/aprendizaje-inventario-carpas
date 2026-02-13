-- ============================================================
-- MIGRACION 27: Extension de Alquiler
-- Permite extender la fecha de retorno de un alquiler activo
-- ============================================================

-- Tabla de historial de extensiones
CREATE TABLE IF NOT EXISTS alquiler_extensiones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alquiler_id INT NOT NULL,
    fecha_retorno_anterior DATETIME NOT NULL,
    fecha_retorno_nueva DATETIME NOT NULL,
    dias_extension INT NOT NULL,
    razon TEXT,
    costo_extension DECIMAL(12, 2) DEFAULT 0,
    registrado_por VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (alquiler_id) REFERENCES alquileres(id) ON DELETE CASCADE
);

-- Indices
CREATE INDEX idx_ext_alquiler ON alquiler_extensiones(alquiler_id);

-- Campo para contar extensiones en alquileres (para consultas rapidas)
ALTER TABLE alquileres
ADD COLUMN extensiones_count INT DEFAULT 0 AFTER notas_retorno;

-- Fecha retorno original (para saber la fecha antes de cualquier extension)
ALTER TABLE alquileres
ADD COLUMN fecha_retorno_original DATETIME NULL DEFAULT NULL AFTER extensiones_count;

-- Migrar fecha_retorno_original para alquileres existentes
UPDATE alquileres
SET fecha_retorno_original = fecha_retorno_esperado
WHERE fecha_retorno_original IS NULL;
