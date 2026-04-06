const { Resend } = require('resend');
const logger = require('../utils/logger');

/**
 * Configuración del cliente de email con Resend
 * Usa API HTTP en vez de SMTP (evita bloqueos de puertos)
 */
const crearCliente = () => {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
        logger.warn('email', 'RESEND_API_KEY no configurada. Los emails no se enviarán.');
        return null;
    }

    return new Resend(apiKey);
};

const resend = crearCliente();

module.exports = { resend };
