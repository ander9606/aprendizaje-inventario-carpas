-- ============================================================
-- MIGRACIÓN: Crear tabla cotizacion_descuentos (pivote)
-- Registra los descuentos aplicados a cada cotización
-- Permite múltiples descuentos por cotización
-- Soporta descuentos del catálogo y manuales
-- ============================================================

-- ============================================================
-- PASO 1: Crear tabla cotizacion_descuentos
-- ============================================================

CREATE TABLE IF NOT EXISTS cotizacion_descuentos (
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- Relación con cotización
    cotizacion_id INT NOT NULL,

    -- Relación con descuento del catálogo (NULL si es manual)
    descuento_id INT DEFAULT NULL,

    -- Copia del tipo y valor al momento de aplicar
    -- (para mantener histórico si el descuento cambia después)
    tipo ENUM('porcentaje', 'fijo') NOT NULL,
    valor DECIMAL(12,2) NOT NULL,

    -- Valor calculado en pesos colombianos
    -- Si tipo = 'porcentaje': monto = subtotal * (valor / 100)
    -- Si tipo = 'fijo': monto = valor
    monto_calculado DECIMAL(12,2) NOT NULL DEFAULT 0,

    -- Descripción (obligatoria para descuentos manuales)
    descripcion VARCHAR(200) DEFAULT NULL,

    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Keys
    CONSTRAINT fk_cotizacion_descuentos_cotizacion
        FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_cotizacion_descuentos_descuento
        FOREIGN KEY (descuento_id) REFERENCES descuentos(id)
        ON DELETE SET NULL,

    -- Índices
    INDEX idx_cotizacion_descuentos_cotizacion (cotizacion_id),
    INDEX idx_cotizacion_descuentos_descuento (descuento_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PASO 2: Migrar descuentos existentes (si hay)
-- ============================================================

-- Si hay cotizaciones con descuento > 0, crear registro en la tabla pivote
INSERT INTO cotizacion_descuentos (cotizacion_id, tipo, valor, monto_calculado, descripcion)
SELECT
    id AS cotizacion_id,
    'fijo' AS tipo,
    descuento AS valor,
    descuento AS monto_calculado,
    'Descuento migrado (anterior al sistema de catálogo)' AS descripcion
FROM cotizaciones
WHERE descuento > 0 AND id > 0;

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
SELECT
    'Tabla cotizacion_descuentos creada' AS mensaje,
    COUNT(*) AS descuentos_migrados
FROM cotizacion_descuentos;
