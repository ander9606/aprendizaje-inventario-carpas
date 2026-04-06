const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

/**
 * Configuración del transporter de email
 * Usa Gmail con App Password por defecto
 */
const crearTransporter = () => {
    const config = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    };

    // Si no hay credenciales SMTP configuradas, retornar null
    if (!config.auth.user || !config.auth.pass) {
        logger.warn('email', 'Credenciales SMTP no configuradas. Los emails no se enviarán.');
        return null;
    }

    return nodemailer.createTransport(config);
};

const transporter = crearTransporter();

module.exports = { transporter };
