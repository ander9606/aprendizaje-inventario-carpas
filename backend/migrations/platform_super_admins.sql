-- ============================================
-- Super admins: tabla independiente, fuera de empleados/tenants
-- ============================================

-- 1. Tabla super_admins
CREATE TABLE IF NOT EXISTS super_admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  telefono VARCHAR(30) NULL,
  estado ENUM('activo','inactivo') DEFAULT 'activo',
  intentos_fallidos INT DEFAULT 0,
  bloqueado_hasta DATETIME NULL,
  ultimo_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Migrar empleados con rol super_admin a super_admins
INSERT IGNORE INTO super_admins (nombre, apellido, email, password_hash, telefono, estado, intentos_fallidos, bloqueado_hasta, ultimo_login, created_at)
SELECT e.nombre, e.apellido, e.email, e.password_hash, e.telefono, e.estado, e.intentos_fallidos, e.bloqueado_hasta, e.ultimo_login, e.created_at
FROM empleados e
JOIN roles r ON e.rol_id = r.id
WHERE r.nombre = 'super_admin';

-- 3. Restaurar esos empleados a rol admin del tenant (mantienen acceso como admin)
UPDATE empleados e
JOIN roles rs ON e.rol_id = rs.id AND rs.nombre = 'super_admin'
SET e.rol_id = (SELECT r.id FROM roles r WHERE r.nombre = 'admin' AND r.tenant_id = e.tenant_id LIMIT 1);

-- 4. Eliminar rol super_admin (ya no se usa)
DELETE FROM roles WHERE nombre = 'super_admin';

-- 5. refresh_tokens: permitir super_admin_id y empleado_id/tenant_id NULL
ALTER TABLE refresh_tokens MODIFY COLUMN empleado_id INT NULL;
ALTER TABLE refresh_tokens MODIFY COLUMN tenant_id INT NULL;
ALTER TABLE refresh_tokens ADD COLUMN super_admin_id INT NULL AFTER empleado_id;
ALTER TABLE refresh_tokens ADD INDEX idx_rt_super_admin (super_admin_id);
ALTER TABLE refresh_tokens ADD CONSTRAINT fk_rt_super_admin FOREIGN KEY (super_admin_id) REFERENCES super_admins(id) ON DELETE CASCADE;
