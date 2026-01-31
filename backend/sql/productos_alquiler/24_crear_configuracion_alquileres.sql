-- ============================================================
-- MIGRACIÓN 24: Configuración de Alquileres
-- Parámetros editables del sistema
-- ============================================================

-- Tabla de configuración con clave-valor
CREATE TABLE IF NOT EXISTS configuracion_alquileres (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clave VARCHAR(50) NOT NULL UNIQUE,
    valor VARCHAR(255) NOT NULL,
    tipo ENUM('numero', 'porcentaje', 'texto', 'booleano') DEFAULT 'texto',
    descripcion VARCHAR(255),
    categoria VARCHAR(50) DEFAULT 'general',
    orden INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar valores por defecto
INSERT INTO configuracion_alquileres (clave, valor, tipo, descripcion, categoria, orden) VALUES
-- Días gratis
('dias_gratis_montaje', '2', 'numero', 'Días gratis antes del evento para montaje', 'dias_extra', 1),
('dias_gratis_desmontaje', '1', 'numero', 'Días gratis después del evento para desmontaje', 'dias_extra', 2),
('porcentaje_dias_extra', '15', 'porcentaje', 'Porcentaje de recargo por día extra sobre productos', 'dias_extra', 3),

-- Impuestos
('porcentaje_iva', '19', 'porcentaje', 'Porcentaje de IVA (Colombia)', 'impuestos', 1),
('aplicar_iva', 'true', 'booleano', 'Aplicar IVA a las cotizaciones', 'impuestos', 2),

-- Cotizaciones
('vigencia_cotizacion_dias', '15', 'numero', 'Días de vigencia por defecto para cotizaciones', 'cotizaciones', 1),

-- Empresa (para PDF)
('empresa_nombre', 'Alquiler de Carpas', 'texto', 'Nombre de la empresa para documentos', 'empresa', 1),
('empresa_nit', '', 'texto', 'NIT de la empresa', 'empresa', 2),
('empresa_direccion', '', 'texto', 'Dirección de la empresa', 'empresa', 3),
('empresa_telefono', '', 'texto', 'Teléfono de contacto', 'empresa', 4),
('empresa_email', '', 'texto', 'Email de contacto', 'empresa', 5);

-- Índice para búsqueda por categoría
CREATE INDEX idx_config_categoria ON configuracion_alquileres(categoria);
