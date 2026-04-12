-- ============================================
-- MIGRACIÓN: Super Admin + Planes + Pagos
-- ============================================
-- 1. Tabla planes (reemplaza ENUM en tenants)
-- 2. Tabla tenant_pagos (tracking de pagos)
-- 3. Rol super_admin en tenant 1
-- 4. Alter tenants: plan_id FK, fecha_proximo_pago, pago_al_dia
-- Ejecutar con: node backend/migrations/run_migration.js add_superadmin_planes_pagos.sql

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- 1. TABLA PLANES
-- ============================================
CREATE TABLE IF NOT EXISTS `planes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(50) NOT NULL,
  `max_empleados` INT DEFAULT NULL COMMENT 'NULL = ilimitado',
  `max_elementos` INT DEFAULT NULL COMMENT 'NULL = ilimitado',
  `max_alquileres` INT DEFAULT NULL COMMENT 'NULL = ilimitado',
  `max_cotizaciones` INT DEFAULT NULL COMMENT 'NULL = ilimitado',
  `precio_mensual` DECIMAL(10,2) DEFAULT 0.00,
  `features` JSON DEFAULT NULL,
  `activo` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_planes_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed planes por defecto
INSERT IGNORE INTO `planes` (`id`, `nombre`, `slug`, `max_empleados`, `max_elementos`, `max_alquileres`, `max_cotizaciones`, `precio_mensual`, `features`) VALUES
(1, 'Básico', 'basico', 5, 500, NULL, NULL, 0.00, '{"reportes": false, "exportar_pdf": false, "api_access": false, "soporte_prioritario": false}'),
(2, 'Profesional', 'profesional', 10, 1000, NULL, NULL, 99.00, '{"reportes": true, "exportar_pdf": true, "api_access": false, "soporte_prioritario": false}'),
(3, 'Empresarial', 'empresarial', NULL, NULL, NULL, NULL, 299.00, '{"reportes": true, "exportar_pdf": true, "api_access": true, "soporte_prioritario": true}');

-- ============================================
-- 2. MIGRAR TENANTS: plan ENUM → plan_id FK
-- ============================================
ALTER TABLE `tenants` ADD COLUMN `plan_id` INT DEFAULT 1 AFTER `logo_url`;
ALTER TABLE `tenants` ADD COLUMN `fecha_proximo_pago` DATE DEFAULT NULL AFTER `max_elementos`;
ALTER TABLE `tenants` ADD COLUMN `pago_al_dia` TINYINT(1) DEFAULT 1 AFTER `fecha_proximo_pago`;

-- Migrar datos existentes
UPDATE `tenants` SET `plan_id` = CASE
  WHEN `plan` = 'basico' THEN 1
  WHEN `plan` = 'profesional' THEN 2
  WHEN `plan` = 'empresarial' THEN 3
  ELSE 1
END;

ALTER TABLE `tenants` ADD CONSTRAINT `fk_tenants_plan` FOREIGN KEY (`plan_id`) REFERENCES `planes`(`id`);

-- Eliminar columnas que ahora viven en planes
ALTER TABLE `tenants` DROP COLUMN `plan`;
ALTER TABLE `tenants` DROP COLUMN `max_empleados`;
ALTER TABLE `tenants` DROP COLUMN `max_elementos`;

-- ============================================
-- 3. TABLA TENANT_PAGOS
-- ============================================
CREATE TABLE IF NOT EXISTS `tenant_pagos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `tenant_id` INT NOT NULL,
  `plan_id` INT NOT NULL,
  `periodo_inicio` DATE NOT NULL,
  `periodo_fin` DATE NOT NULL,
  `monto` DECIMAL(10,2) NOT NULL,
  `pagado` TINYINT(1) DEFAULT 0,
  `fecha_pago` DATE DEFAULT NULL,
  `metodo_pago` VARCHAR(50) DEFAULT NULL COMMENT 'transferencia, efectivo, otro',
  `comprobante_url` VARCHAR(500) DEFAULT NULL,
  `notas` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tenant_periodo` (`tenant_id`, `periodo_inicio`),
  KEY `idx_pagos_tenant` (`tenant_id`),
  KEY `idx_pagos_pagado` (`pagado`),
  CONSTRAINT `fk_pago_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`),
  CONSTRAINT `fk_pago_plan` FOREIGN KEY (`plan_id`) REFERENCES `planes`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. ROL SUPER_ADMIN EN TENANT 1
-- ============================================
INSERT IGNORE INTO `roles` (`tenant_id`, `nombre`, `descripcion`, `permisos`, `activo`) VALUES
(1, 'super_admin', 'Administrador de plataforma - gestión de todos los tenants', '{
  "reportes": {"ver": true, "exportar": true},
  "empleados": {"ver": true, "crear": true, "editar": true, "eliminar": true},
  "productos": {"ver": true, "crear": true, "editar": true, "eliminar": true},
  "alquileres": {"ver": true, "crear": true, "editar": true, "eliminar": true},
  "inventario": {"ver": true, "crear": true, "editar": true, "eliminar": true},
  "operaciones": {"ver": true, "crear": true, "editar": true, "eliminar": true},
  "configuracion": {"ver": true, "crear": true, "editar": true, "eliminar": true},
  "superadmin": {"ver": true, "crear": true, "editar": true, "eliminar": true}
}', 1);

SET FOREIGN_KEY_CHECKS = 1;
