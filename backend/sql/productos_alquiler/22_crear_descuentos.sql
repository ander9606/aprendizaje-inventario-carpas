-- ============================================================
-- MIGRACIÓN: Crear tabla de descuentos (catálogo)
-- Permite crear descuentos predefinidos reutilizables
-- Tipos: porcentaje (ej: 20%) o fijo (ej: $100,000)
-- ============================================================

-- ============================================================
-- PASO 1: Crear tabla descuentos
-- ============================================================

CREATE TABLE IF NOT EXISTS descuentos (
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- Información básica
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,

    -- Tipo de descuento
    tipo ENUM('porcentaje', 'fijo') DEFAULT 'porcentaje',

    -- Valor del descuento
    -- Si tipo = 'porcentaje': valor representa el % (ej: 20 = 20%)
    -- Si tipo = 'fijo': valor representa monto en pesos (ej: 100000 = $100,000)
    valor DECIMAL(12,2) NOT NULL,

    -- Restricciones opcionales
    valor_minimo_compra DECIMAL(12,2) DEFAULT 0,  -- Mínimo de compra para aplicar
    fecha_inicio DATE DEFAULT NULL,               -- Vigencia desde (NULL = sin límite)
    fecha_fin DATE DEFAULT NULL,                  -- Vigencia hasta (NULL = sin límite)

    -- Estado
    activo BOOLEAN DEFAULT TRUE,

    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Índices
    INDEX idx_descuentos_activo (activo),
    INDEX idx_descuentos_tipo (tipo),
    INDEX idx_descuentos_vigencia (fecha_inicio, fecha_fin)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PASO 2: Insertar descuentos predefinidos de ejemplo
-- ============================================================

INSERT INTO descuentos (nombre, tipo, valor, descripcion, valor_minimo_compra) VALUES
('Familia', 'porcentaje', 20.00, 'Descuento especial para familiares y amigos cercanos', 0),
('Cliente Frecuente', 'porcentaje', 15.00, 'Para clientes con más de 3 eventos realizados', 500000.00),
('Referido', 'porcentaje', 10.00, 'Descuento por cliente referido por otro cliente', 0),
('Corporativo', 'porcentaje', 25.00, 'Descuento para empresas y eventos corporativos', 1000000.00),
('Primera Vez', 'porcentaje', 5.00, 'Descuento de bienvenida para nuevos clientes', 0);

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
SELECT
    'Tabla descuentos creada' AS mensaje,
    COUNT(*) AS descuentos_insertados
FROM descuentos;
