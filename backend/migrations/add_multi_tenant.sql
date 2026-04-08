-- ============================================
-- MIGRACIÓN: Soporte Multi-Tenant
-- ============================================
-- Agrega tabla 'tenants' y columna 'tenant_id' a todas las tablas existentes.
-- Los datos existentes se asignan al tenant_id = 1 (Tenant Principal).
-- Ejecutar con: node backend/migrations/run_multi_tenant.js

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- 1. CREAR TABLA TENANTS
-- ============================================
CREATE TABLE IF NOT EXISTS `tenants` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(200) NOT NULL,
  `slug` VARCHAR(100) NOT NULL,
  `email_contacto` VARCHAR(255) DEFAULT NULL,
  `telefono` VARCHAR(20) DEFAULT NULL,
  `nit` VARCHAR(50) DEFAULT NULL,
  `direccion` TEXT DEFAULT NULL,
  `logo_url` VARCHAR(500) DEFAULT NULL,
  `plan` ENUM('basico','profesional','empresarial') DEFAULT 'basico',
  `estado` ENUM('activo','inactivo','suspendido') DEFAULT 'activo',
  `max_empleados` INT DEFAULT 5,
  `max_elementos` INT DEFAULT 500,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tenant_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed: empresa actual como tenant 1
INSERT IGNORE INTO tenants (id, nombre, slug, estado) VALUES (1, 'Tenant Principal', 'principal', 'activo');

-- ============================================
-- 2. TABLAS CON UNIQUE CONSTRAINTS A CONVERTIR
-- ============================================

-- series: UNIQUE(numero_serie) -> UNIQUE(tenant_id, numero_serie)
ALTER TABLE `series` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `series` ADD INDEX `idx_series_tenant` (`tenant_id`);
ALTER TABLE `series` ADD CONSTRAINT `fk_series_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);
ALTER TABLE `series` DROP INDEX `numero_serie`;
ALTER TABLE `series` ADD UNIQUE KEY `uk_series_numero` (`tenant_id`, `numero_serie`);

-- materiales: UNIQUE(nombre) -> UNIQUE(tenant_id, nombre)
ALTER TABLE `materiales` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `materiales` ADD INDEX `idx_materiales_tenant` (`tenant_id`);
ALTER TABLE `materiales` ADD CONSTRAINT `fk_materiales_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);
ALTER TABLE `materiales` DROP INDEX `nombre`;
ALTER TABLE `materiales` ADD UNIQUE KEY `uk_materiales_nombre` (`tenant_id`, `nombre`);

-- unidades: UNIQUE(nombre) -> UNIQUE(tenant_id, nombre)
ALTER TABLE `unidades` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `unidades` ADD INDEX `idx_unidades_tenant` (`tenant_id`);
ALTER TABLE `unidades` ADD CONSTRAINT `fk_unidades_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);
ALTER TABLE `unidades` DROP INDEX `nombre`;
ALTER TABLE `unidades` ADD UNIQUE KEY `uk_unidades_nombre` (`tenant_id`, `nombre`);

-- ubicaciones: UNIQUE(nombre) -> UNIQUE(tenant_id, nombre)
ALTER TABLE `ubicaciones` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `ubicaciones` ADD INDEX `idx_ubicaciones_tenant` (`tenant_id`);
ALTER TABLE `ubicaciones` ADD CONSTRAINT `fk_ubicaciones_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);
ALTER TABLE `ubicaciones` DROP INDEX `nombre`;
ALTER TABLE `ubicaciones` ADD UNIQUE KEY `uk_ubicaciones_nombre` (`tenant_id`, `nombre`);

-- roles: UNIQUE(nombre) -> UNIQUE(tenant_id, nombre)
ALTER TABLE `roles` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `roles` ADD INDEX `idx_roles_tenant` (`tenant_id`);
ALTER TABLE `roles` ADD CONSTRAINT `fk_roles_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);
ALTER TABLE `roles` DROP INDEX `nombre`;
ALTER TABLE `roles` ADD UNIQUE KEY `uk_roles_nombre` (`tenant_id`, `nombre`);

-- empleados: UNIQUE(email) -> UNIQUE(tenant_id, email)
ALTER TABLE `empleados` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `empleados` ADD INDEX `idx_empleados_tenant` (`tenant_id`);
ALTER TABLE `empleados` ADD CONSTRAINT `fk_empleados_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);
ALTER TABLE `empleados` DROP INDEX `email`;
ALTER TABLE `empleados` ADD UNIQUE KEY `uk_empleados_email` (`tenant_id`, `email`);

-- vehiculos: UNIQUE(placa) -> UNIQUE(tenant_id, placa)
ALTER TABLE `vehiculos` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `vehiculos` ADD INDEX `idx_vehiculos_tenant` (`tenant_id`);
ALTER TABLE `vehiculos` ADD CONSTRAINT `fk_vehiculos_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);
ALTER TABLE `vehiculos` DROP INDEX `placa`;
ALTER TABLE `vehiculos` ADD UNIQUE KEY `uk_vehiculos_placa` (`tenant_id`, `placa`);

-- clientes: UNIQUE(tipo_documento, numero_documento) -> UNIQUE(tenant_id, tipo_documento, numero_documento)
ALTER TABLE `clientes` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `clientes` ADD INDEX `idx_clientes_tenant` (`tenant_id`);
ALTER TABLE `clientes` ADD CONSTRAINT `fk_clientes_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);
ALTER TABLE `clientes` DROP INDEX `uk_documento`;
ALTER TABLE `clientes` ADD UNIQUE KEY `uk_clientes_documento` (`tenant_id`, `tipo_documento`, `numero_documento`);

-- elementos_compuestos: UNIQUE(codigo) -> UNIQUE(tenant_id, codigo)
ALTER TABLE `elementos_compuestos` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `elementos_compuestos` ADD INDEX `idx_ec_tenant` (`tenant_id`);
ALTER TABLE `elementos_compuestos` ADD CONSTRAINT `fk_ec_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);
ALTER TABLE `elementos_compuestos` DROP INDEX `codigo`;
ALTER TABLE `elementos_compuestos` ADD UNIQUE KEY `uk_ec_codigo` (`tenant_id`, `codigo`);

-- configuracion_alquileres: UNIQUE(clave) -> UNIQUE(tenant_id, clave)
ALTER TABLE `configuracion_alquileres` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `configuracion_alquileres` ADD INDEX `idx_config_alq_tenant` (`tenant_id`);
ALTER TABLE `configuracion_alquileres` ADD CONSTRAINT `fk_config_alq_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);
ALTER TABLE `configuracion_alquileres` DROP INDEX `clave`;
ALTER TABLE `configuracion_alquileres` ADD UNIQUE KEY `uk_config_alq_clave` (`tenant_id`, `clave`);

-- ciudades: UNIQUE(nombre) -> UNIQUE(tenant_id, nombre)
ALTER TABLE `ciudades` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `ciudades` ADD INDEX `idx_ciudades_tenant` (`tenant_id`);
ALTER TABLE `ciudades` ADD CONSTRAINT `fk_ciudades_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);
ALTER TABLE `ciudades` DROP INDEX `uk_ciudad_nombre`;
ALTER TABLE `ciudades` ADD UNIQUE KEY `uk_ciudades_nombre` (`tenant_id`, `nombre`);

-- departamentos: UNIQUE(nombre) -> UNIQUE(tenant_id, nombre)
ALTER TABLE `departamentos` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `departamentos` ADD INDEX `idx_departamentos_tenant` (`tenant_id`);
ALTER TABLE `departamentos` ADD CONSTRAINT `fk_departamentos_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);
ALTER TABLE `departamentos` DROP INDEX `uk_departamento_nombre`;
ALTER TABLE `departamentos` ADD UNIQUE KEY `uk_departamentos_nombre` (`tenant_id`, `nombre`);

-- tarifas_transporte: UNIQUE(tipo_camion, ciudad_id) -> UNIQUE(tenant_id, tipo_camion, ciudad_id)
ALTER TABLE `tarifas_transporte` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `tarifas_transporte` ADD INDEX `idx_tarifas_tenant` (`tenant_id`);
ALTER TABLE `tarifas_transporte` ADD CONSTRAINT `fk_tarifas_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);
ALTER TABLE `tarifas_transporte` DROP INDEX `uk_tipo_ciudad_id`;
ALTER TABLE `tarifas_transporte` ADD UNIQUE KEY `uk_tarifas_tipo_ciudad` (`tenant_id`, `tipo_camion`, `ciudad_id`);

-- ============================================
-- 3. TABLAS SIN CAMBIO DE UNIQUE (solo agregar tenant_id + index + FK)
-- ============================================

-- alertas_alquiler_vistas
ALTER TABLE `alertas_alquiler_vistas` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `alertas_alquiler_vistas` ADD INDEX `idx_alertas_av_tenant` (`tenant_id`);
ALTER TABLE `alertas_alquiler_vistas` ADD CONSTRAINT `fk_alertas_av_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);

-- alertas_operaciones
ALTER TABLE `alertas_operaciones` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `alertas_operaciones` ADD INDEX `idx_alertas_op_tenant` (`tenant_id`);
ALTER TABLE `alertas_operaciones` ADD CONSTRAINT `fk_alertas_op_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);

-- alquiler_elementos
ALTER TABLE `alquiler_elementos` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `alquiler_elementos` ADD INDEX `idx_alq_elem_tenant` (`tenant_id`);
ALTER TABLE `alquiler_elementos` ADD CONSTRAINT `fk_alq_elem_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);

-- alquiler_extensiones
ALTER TABLE `alquiler_extensiones` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `alquiler_extensiones` ADD INDEX `idx_alq_ext_tenant` (`tenant_id`);
ALTER TABLE `alquiler_extensiones` ADD CONSTRAINT `fk_alq_ext_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);

-- alquileres
ALTER TABLE `alquileres` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `alquileres` ADD INDEX `idx_alquileres_tenant` (`tenant_id`);
ALTER TABLE `alquileres` ADD CONSTRAINT `fk_alquileres_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);

-- audit_log
ALTER TABLE `audit_log` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `audit_log` ADD INDEX `idx_audit_tenant` (`tenant_id`);
ALTER TABLE `audit_log` ADD CONSTRAINT `fk_audit_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);

-- auditoria_auth
ALTER TABLE `auditoria_auth` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `auditoria_auth` ADD INDEX `idx_auditoria_tenant` (`tenant_id`);
ALTER TABLE `auditoria_auth` ADD CONSTRAINT `fk_auditoria_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);

-- categorias
ALTER TABLE `categorias` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `categorias` ADD INDEX `idx_categorias_tenant` (`tenant_id`);
ALTER TABLE `categorias` ADD CONSTRAINT `fk_categorias_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);

-- categorias_productos
ALTER TABLE `categorias_productos` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `categorias_productos` ADD INDEX `idx_cat_prod_tenant` (`tenant_id`);
ALTER TABLE `categorias_productos` ADD CONSTRAINT `fk_cat_prod_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);

-- compuesto_componentes
ALTER TABLE `compuesto_componentes` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `compuesto_componentes` ADD INDEX `idx_comp_comp_tenant` (`tenant_id`);
ALTER TABLE `compuesto_componentes` ADD CONSTRAINT `fk_comp_comp_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);

-- cotizacion_descuentos
ALTER TABLE `cotizacion_descuentos` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `cotizacion_descuentos` ADD INDEX `idx_cot_desc_tenant` (`tenant_id`);
ALTER TABLE `cotizacion_descuentos` ADD CONSTRAINT `fk_cot_desc_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);

-- cotizacion_detalles
ALTER TABLE `cotizacion_detalles` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `cotizacion_detalles` ADD INDEX `idx_cot_det_tenant` (`tenant_id`);
ALTER TABLE `cotizacion_detalles` ADD CONSTRAINT `fk_cot_det_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);

-- cotizacion_producto_recargos
ALTER TABLE `cotizacion_producto_recargos` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `cotizacion_producto_recargos` ADD INDEX `idx_cot_rec_tenant` (`tenant_id`);
ALTER TABLE `cotizacion_producto_recargos` ADD CONSTRAINT `fk_cot_rec_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);

-- cotizacion_productos
ALTER TABLE `cotizacion_productos` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `cotizacion_productos` ADD INDEX `idx_cot_prod_tenant` (`tenant_id`);
ALTER TABLE `cotizacion_productos` ADD CONSTRAINT `fk_cot_prod_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);

-- cotizacion_transportes
ALTER TABLE `cotizacion_transportes` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `cotizacion_transportes` ADD INDEX `idx_cot_trans_tenant` (`tenant_id`);
ALTER TABLE `cotizacion_transportes` ADD CONSTRAINT `fk_cot_trans_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);

-- cotizaciones
ALTER TABLE `cotizaciones` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `cotizaciones` ADD INDEX `idx_cotizaciones_tenant` (`tenant_id`);
ALTER TABLE `cotizaciones` ADD CONSTRAINT `fk_cotizaciones_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);

-- descuentos
ALTER TABLE `descuentos` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `descuentos` ADD INDEX `idx_descuentos_tenant` (`tenant_id`);
ALTER TABLE `descuentos` ADD CONSTRAINT `fk_descuentos_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);

-- elemento_incidencias
ALTER TABLE `elemento_incidencias` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `elemento_incidencias` ADD INDEX `idx_elem_inc_tenant` (`tenant_id`);
ALTER TABLE `elemento_incidencias` ADD CONSTRAINT `fk_elem_inc_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);

-- elementos
ALTER TABLE `elementos` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `elementos` ADD INDEX `idx_elementos_tenant` (`tenant_id`);
ALTER TABLE `elementos` ADD CONSTRAINT `fk_elementos_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);

-- empleado_notificaciones_config
ALTER TABLE `empleado_notificaciones_config` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `empleado_notificaciones_config` ADD INDEX `idx_emp_not_tenant` (`tenant_id`);
ALTER TABLE `empleado_notificaciones_config` ADD CONSTRAINT `fk_emp_not_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);

-- eventos
ALTER TABLE `eventos` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `eventos` ADD INDEX `idx_eventos_tenant` (`tenant_id`);
ALTER TABLE `eventos` ADD CONSTRAINT `fk_eventos_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);

-- lotes
ALTER TABLE `lotes` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `lotes` ADD INDEX `idx_lotes_tenant` (`tenant_id`);
ALTER TABLE `lotes` ADD CONSTRAINT `fk_lotes_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);

-- lotes_movimientos
ALTER TABLE `lotes_movimientos` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `lotes_movimientos` ADD INDEX `idx_lotes_mov_tenant` (`tenant_id`);
ALTER TABLE `lotes_movimientos` ADD CONSTRAINT `fk_lotes_mov_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);

-- orden_elemento_fotos
ALTER TABLE `orden_elemento_fotos` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `orden_elemento_fotos` ADD INDEX `idx_ord_ef_tenant` (`tenant_id`);
ALTER TABLE `orden_elemento_fotos` ADD CONSTRAINT `fk_ord_ef_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);

-- orden_trabajo_cambios_fecha
ALTER TABLE `orden_trabajo_cambios_fecha` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `orden_trabajo_cambios_fecha` ADD INDEX `idx_ord_cf_tenant` (`tenant_id`);
ALTER TABLE `orden_trabajo_cambios_fecha` ADD CONSTRAINT `fk_ord_cf_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);

-- orden_trabajo_elementos
ALTER TABLE `orden_trabajo_elementos` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `orden_trabajo_elementos` ADD INDEX `idx_ord_te_tenant` (`tenant_id`);
ALTER TABLE `orden_trabajo_elementos` ADD CONSTRAINT `fk_ord_te_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);

-- orden_trabajo_equipo
ALTER TABLE `orden_trabajo_equipo` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `orden_trabajo_equipo` ADD INDEX `idx_ord_eq_tenant` (`tenant_id`);
ALTER TABLE `orden_trabajo_equipo` ADD CONSTRAINT `fk_ord_eq_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);

-- orden_trabajo_fotos
ALTER TABLE `orden_trabajo_fotos` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `orden_trabajo_fotos` ADD INDEX `idx_ord_ft_tenant` (`tenant_id`);
ALTER TABLE `orden_trabajo_fotos` ADD CONSTRAINT `fk_ord_ft_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);

-- orden_trabajo_historial_estados
ALTER TABLE `orden_trabajo_historial_estados` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `orden_trabajo_historial_estados` ADD INDEX `idx_ord_he_tenant` (`tenant_id`);
ALTER TABLE `orden_trabajo_historial_estados` ADD CONSTRAINT `fk_ord_he_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);

-- orden_trabajo_novedades
ALTER TABLE `orden_trabajo_novedades` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `orden_trabajo_novedades` ADD INDEX `idx_ord_nv_tenant` (`tenant_id`);
ALTER TABLE `orden_trabajo_novedades` ADD CONSTRAINT `fk_ord_nv_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);

-- ordenes_trabajo
ALTER TABLE `ordenes_trabajo` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `ordenes_trabajo` ADD INDEX `idx_ordenes_tenant` (`tenant_id`);
ALTER TABLE `ordenes_trabajo` ADD CONSTRAINT `fk_ordenes_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);

-- refresh_tokens
ALTER TABLE `refresh_tokens` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `refresh_tokens` ADD INDEX `idx_rt_tenant` (`tenant_id`);
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `fk_rt_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);

-- vehiculo_mantenimientos
ALTER TABLE `vehiculo_mantenimientos` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `vehiculo_mantenimientos` ADD INDEX `idx_veh_mant_tenant` (`tenant_id`);
ALTER TABLE `vehiculo_mantenimientos` ADD CONSTRAINT `fk_veh_mant_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);

-- vehiculo_uso_log
ALTER TABLE `vehiculo_uso_log` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `vehiculo_uso_log` ADD INDEX `idx_veh_uso_tenant` (`tenant_id`);
ALTER TABLE `vehiculo_uso_log` ADD CONSTRAINT `fk_veh_uso_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);

-- verificacion_email (si existe)
ALTER TABLE `verificacion_email` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `verificacion_email` ADD INDEX `idx_ver_email_tenant` (`tenant_id`);
ALTER TABLE `verificacion_email` ADD CONSTRAINT `fk_ver_email_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`);

SET FOREIGN_KEY_CHECKS = 1;
