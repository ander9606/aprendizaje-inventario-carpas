-- ============================================
-- Migración: Tabla de verificación de email
-- Para validar correos reales durante el registro
-- ============================================

CREATE TABLE IF NOT EXISTS verificacion_email (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    codigo VARCHAR(6) NOT NULL,
    datos_registro JSON NOT NULL COMMENT 'nombre, apellido, telefono, password_hash, rol_solicitado_id',
    intentos INT DEFAULT 0,
    verificado TINYINT(1) DEFAULT 0,
    expira_en TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_verificacion_email (email),
    INDEX idx_verificacion_expira (expira_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
