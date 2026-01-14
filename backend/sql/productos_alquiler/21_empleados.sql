-- ============================================
-- MIGRACIÓN: Tabla de empleados
-- Empleados con roles para autenticación futura
-- ============================================

-- Tabla de roles
CREATE TABLE IF NOT EXISTS roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    permisos JSON,                    -- Permisos específicos del rol
    nivel INT DEFAULT 0,              -- Nivel jerárquico (mayor = más permisos)
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar roles básicos
INSERT INTO roles (nombre, descripcion, nivel, permisos) VALUES
('admin', 'Administrador del sistema - Acceso total', 100, JSON_OBJECT(
    'inventario', JSON_ARRAY('ver', 'crear', 'editar', 'eliminar'),
    'alquileres', JSON_ARRAY('ver', 'crear', 'editar', 'eliminar', 'aprobar'),
    'operaciones', JSON_ARRAY('ver', 'crear', 'editar', 'eliminar', 'aprobar_conflictos'),
    'configuracion', JSON_ARRAY('ver', 'crear', 'editar', 'eliminar'),
    'reportes', JSON_ARRAY('ver', 'exportar')
)),
('gerente', 'Gerente - Puede aprobar conflictos y ver reportes', 80, JSON_OBJECT(
    'inventario', JSON_ARRAY('ver', 'crear', 'editar'),
    'alquileres', JSON_ARRAY('ver', 'crear', 'editar', 'aprobar'),
    'operaciones', JSON_ARRAY('ver', 'crear', 'editar', 'aprobar_conflictos'),
    'configuracion', JSON_ARRAY('ver'),
    'reportes', JSON_ARRAY('ver', 'exportar')
)),
('ventas', 'Vendedor - Gestiona cotizaciones y clientes', 50, JSON_OBJECT(
    'inventario', JSON_ARRAY('ver'),
    'alquileres', JSON_ARRAY('ver', 'crear', 'editar'),
    'operaciones', JSON_ARRAY('ver'),
    'configuracion', JSON_ARRAY(),
    'reportes', JSON_ARRAY('ver')
)),
('operador', 'Operador - Ejecuta montajes y desmontajes', 40, JSON_OBJECT(
    'inventario', JSON_ARRAY('ver'),
    'alquileres', JSON_ARRAY('ver'),
    'operaciones', JSON_ARRAY('ver', 'crear', 'editar'),
    'configuracion', JSON_ARRAY(),
    'reportes', JSON_ARRAY()
)),
('bodeguero', 'Bodeguero - Gestiona inventario físico', 30, JSON_OBJECT(
    'inventario', JSON_ARRAY('ver', 'crear', 'editar'),
    'alquileres', JSON_ARRAY('ver'),
    'operaciones', JSON_ARRAY('ver'),
    'configuracion', JSON_ARRAY(),
    'reportes', JSON_ARRAY()
));

-- Tabla de empleados
CREATE TABLE IF NOT EXISTS empleados (
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- Datos personales
    nombre VARCHAR(100) NOT NULL,
    documento VARCHAR(20),
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion TEXT,

    -- Datos laborales
    cargo VARCHAR(100),
    rol_id INT,                       -- FK a roles
    fecha_ingreso DATE,
    salario DECIMAL(12,2),

    -- Autenticación (para futuro)
    usuario VARCHAR(50) UNIQUE,       -- Username para login
    password_hash VARCHAR(255),       -- Password hasheado
    ultimo_acceso TIMESTAMP,
    intentos_fallidos INT DEFAULT 0,
    bloqueado BOOLEAN DEFAULT FALSE,

    -- Operaciones
    puede_conducir BOOLEAN DEFAULT FALSE,
    licencia_conducir VARCHAR(20),

    -- Estado
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (rol_id) REFERENCES roles(id),
    INDEX idx_empleado_rol (rol_id),
    INDEX idx_empleado_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar empleado admin por defecto
INSERT INTO empleados (nombre, cargo, rol_id, usuario, activo) VALUES
('Administrador', 'Administrador del Sistema', 1, 'admin', TRUE);
