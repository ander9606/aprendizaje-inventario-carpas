-- ============================================
-- Separar roles de plataforma de roles de tenant
-- super_admin: rol global, no pertenece a ningún tenant
-- ============================================

-- Permitir tenant_id NULL en roles (platform-wide roles)
ALTER TABLE `roles` MODIFY COLUMN `tenant_id` INT NULL;

-- Marcar super_admin como rol de plataforma
UPDATE `roles` SET `tenant_id` = NULL WHERE `nombre` = 'super_admin';
