-- ============================================================
-- MIGRACIÓN 21: Eventos y Sistema de Recargos
-- Permite agrupar cotizaciones en eventos y aplicar recargos
-- por adelanto de montaje o extensión de desmontaje
-- ============================================================

-- ============================================================
-- 1. TABLA: eventos
-- Agrupa múltiples cotizaciones del mismo cliente
-- ============================================================

CREATE TABLE IF NOT EXISTS eventos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cliente_id INT NOT NULL,

    -- Información del evento
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,

    -- Fechas principales del evento (referencia)
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,

    -- Ubicación
    direccion TEXT,
    ciudad_id INT,

    -- Estado: activo, completado, cancelado
    estado ENUM('activo', 'completado', 'cancelado') DEFAULT 'activo',

    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (ciudad_id) REFERENCES ciudades(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices para eventos
CREATE INDEX idx_eventos_cliente ON eventos(cliente_id);
CREATE INDEX idx_eventos_fechas ON eventos(fecha_inicio, fecha_fin);
CREATE INDEX idx_eventos_estado ON eventos(estado);

-- ============================================================
-- 2. MODIFICAR COTIZACIONES: Agregar FK a eventos
-- ============================================================

-- Agregar columna evento_id (nullable para compatibilidad con existentes)
ALTER TABLE cotizaciones
ADD COLUMN evento_id INT NULL AFTER cliente_id;

-- Agregar FK
ALTER TABLE cotizaciones
ADD CONSTRAINT fk_cotizacion_evento
    FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE SET NULL;

-- Índice para evento_id
CREATE INDEX idx_cotizacion_evento ON cotizaciones(evento_id);

-- ============================================================
-- 3. TABLA: cotizacion_producto_recargos
-- Recargos por adelanto de montaje o extensión de desmontaje
-- ============================================================

CREATE TABLE IF NOT EXISTS cotizacion_producto_recargos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cotizacion_producto_id INT NOT NULL,

    -- Tipo de recargo: adelanto (montaje antes) o extension (desmontaje después)
    tipo ENUM('adelanto', 'extension') NOT NULL,

    -- Cantidad de días de adelanto o extensión
    dias INT NOT NULL DEFAULT 1,

    -- Porcentaje de recargo (ej: 20.00 = 20%)
    porcentaje DECIMAL(5,2) NOT NULL DEFAULT 20.00,

    -- Monto calculado = (precio_base * porcentaje / 100) * dias
    monto_recargo DECIMAL(12,2) NOT NULL DEFAULT 0,

    -- Fechas para referencia
    fecha_original DATE,      -- Fecha original de montaje/desmontaje
    fecha_modificada DATE,    -- Nueva fecha con adelanto/extensión

    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (cotizacion_producto_id)
        REFERENCES cotizacion_productos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices para recargos
CREATE INDEX idx_recargo_producto ON cotizacion_producto_recargos(cotizacion_producto_id);
CREATE INDEX idx_recargo_tipo ON cotizacion_producto_recargos(tipo);

-- ============================================================
-- 4. MODIFICAR COTIZACION_PRODUCTOS: Agregar total_recargos
-- ============================================================

-- Agregar columna para almacenar suma de recargos del producto
ALTER TABLE cotizacion_productos
ADD COLUMN total_recargos DECIMAL(12,2) DEFAULT 0 AFTER subtotal;

-- ============================================================
-- FIN DE MIGRACIÓN 21
-- ============================================================
