-- =====================================================
-- Migración 21: Tabla de Empleados con Roles
-- =====================================================
-- Propósito: Sistema de usuarios internos con autenticación JWT
-- Roles definidos para control de acceso por módulo
-- =====================================================

-- Tabla de roles disponibles en el sistema
CREATE TABLE IF NOT EXISTS roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    permisos JSON,                          -- Permisos específicos del rol
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar roles base del sistema
INSERT INTO roles (nombre, descripcion, permisos) VALUES
('admin', 'Administrador del sistema con acceso total', JSON_OBJECT(
    'inventario', JSON_ARRAY('leer', 'crear', 'editar', 'eliminar'),
    'alquileres', JSON_ARRAY('leer', 'crear', 'editar', 'eliminar', 'aprobar'),
    'operaciones', JSON_ARRAY('leer', 'crear', 'editar', 'eliminar', 'aprobar'),
    'configuracion', JSON_ARRAY('leer', 'crear', 'editar', 'eliminar'),
    'reportes', JSON_ARRAY('leer', 'exportar'),
    'usuarios', JSON_ARRAY('leer', 'crear', 'editar', 'eliminar')
)),
('gerente', 'Gerencia con permisos de aprobación', JSON_OBJECT(
    'inventario', JSON_ARRAY('leer', 'crear', 'editar'),
    'alquileres', JSON_ARRAY('leer', 'crear', 'editar', 'aprobar'),
    'operaciones', JSON_ARRAY('leer', 'crear', 'editar', 'aprobar'),
    'configuracion', JSON_ARRAY('leer', 'editar'),
    'reportes', JSON_ARRAY('leer', 'exportar'),
    'usuarios', JSON_ARRAY('leer')
)),
('ventas', 'Equipo comercial - cotizaciones y alquileres', JSON_OBJECT(
    'inventario', JSON_ARRAY('leer'),
    'alquileres', JSON_ARRAY('leer', 'crear', 'editar'),
    'operaciones', JSON_ARRAY('leer'),
    'configuracion', JSON_ARRAY('leer'),
    'reportes', JSON_ARRAY('leer')
)),
('operaciones', 'Equipo de montaje y desmontaje', JSON_OBJECT(
    'inventario', JSON_ARRAY('leer'),
    'alquileres', JSON_ARRAY('leer'),
    'operaciones', JSON_ARRAY('leer', 'crear', 'editar'),
    'configuracion', JSON_ARRAY('leer'),
    'reportes', JSON_ARRAY('leer')
)),
('bodega', 'Personal de bodega e inventario', JSON_OBJECT(
    'inventario', JSON_ARRAY('leer', 'crear', 'editar'),
    'alquileres', JSON_ARRAY('leer'),
    'operaciones', JSON_ARRAY('leer'),
    'configuracion', JSON_ARRAY('leer'),
    'reportes', JSON_ARRAY('leer')
));

-- Tabla principal de empleados
CREATE TABLE IF NOT EXISTS empleados (
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- Datos de autenticación
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,     -- Bcrypt hash

    -- Datos personales
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    documento_tipo ENUM('CC', 'CE', 'TI') DEFAULT 'CC',
    documento_numero VARCHAR(20),

    -- Rol y permisos
    rol_id INT NOT NULL,
    permisos_adicionales JSON,               -- Permisos extra específicos del empleado

    -- Estado y control
    activo BOOLEAN DEFAULT TRUE,
    ultimo_login DATETIME,
    intentos_fallidos INT DEFAULT 0,
    bloqueado_hasta DATETIME,

    -- Datos operativos (para asignación a órdenes de trabajo)
    cargo VARCHAR(100),                      -- Cargo específico: "Montador", "Conductor", etc.
    disponible_campo BOOLEAN DEFAULT TRUE,   -- Si puede ser asignado a trabajo de campo

    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,                          -- Empleado que lo creó

    -- Foreign Keys
    FOREIGN KEY (rol_id) REFERENCES roles(id),
    FOREIGN KEY (created_by) REFERENCES empleados(id)
);

-- Tabla para tokens de refresh (JWT)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    empleado_id INT NOT NULL,
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE
);

-- Tabla para auditoría de acciones importantes
CREATE TABLE IF NOT EXISTS audit_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    empleado_id INT,
    accion VARCHAR(100) NOT NULL,            -- 'login', 'logout', 'crear_alquiler', etc.
    modulo VARCHAR(50),                      -- 'alquileres', 'inventario', etc.
    entidad VARCHAR(50),                     -- 'cotizacion', 'alquiler', 'elemento', etc.
    entidad_id INT,
    datos_anteriores JSON,                   -- Estado antes del cambio
    datos_nuevos JSON,                       -- Estado después del cambio
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (empleado_id) REFERENCES empleados(id)
);

-- Índices para optimización
CREATE INDEX idx_empleados_email ON empleados(email);
CREATE INDEX idx_empleados_rol ON empleados(rol_id);
CREATE INDEX idx_empleados_activo ON empleados(activo);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_empleado ON refresh_tokens(empleado_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);
CREATE INDEX idx_audit_log_empleado ON audit_log(empleado_id);
CREATE INDEX idx_audit_log_modulo ON audit_log(modulo, entidad);
CREATE INDEX idx_audit_log_fecha ON audit_log(created_at);

-- Insertar empleado administrador inicial (password: admin123 - CAMBIAR EN PRODUCCIÓN)
-- Hash bcrypt de 'admin123': $2b$10$rQZ5z5z5z5z5z5z5z5z5zOEJq8VXJZ5z5z5z5z5z5z5z5z5z5z5
-- NOTA: Este hash es de ejemplo, generar uno real al implementar
INSERT INTO empleados (email, password_hash, nombre, apellido, rol_id, cargo) VALUES
('admin@inventario.local', '$2b$10$placeholder_hash_cambiar_en_implementacion', 'Admin', 'Sistema', 1, 'Administrador');

-- =====================================================
-- Notas de implementación JWT:
-- =====================================================
-- 1. Access Token: Vida corta (15-30 min), contiene rol y permisos básicos
-- 2. Refresh Token: Vida larga (7 días), almacenado en esta tabla
-- 3. Al hacer login: generar ambos tokens
-- 4. Al expirar access: usar refresh para obtener nuevo access
-- 5. Al hacer logout: revocar refresh token
-- 6. Limpiar tokens expirados periódicamente
-- =====================================================
