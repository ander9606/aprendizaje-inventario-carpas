const { transporter } = require('../../../config/email');
const logger = require('../../../utils/logger');

class EmailService {
    /**
     * Enviar código de verificación de email
     * @param {string} email - Dirección de correo del destinatario
     * @param {string} codigo - Código de 6 dígitos
     * @param {string} nombre - Nombre del usuario
     */
    static async enviarCodigoVerificacion(email, codigo, nombre) {
        const from = process.env.SMTP_FROM || process.env.SMTP_USER;

        const mailOptions = {
            from,
            to: email,
            subject: 'Código de verificación - Sistema de Inventario Carpas',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 24px;">Verificación de Email</h1>
                    </div>
                    <div style="background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
                        <p style="color: #334155; font-size: 16px;">Hola <strong>${nombre}</strong>,</p>
                        <p style="color: #64748b; font-size: 14px;">
                            Ingresa el siguiente código para verificar tu dirección de correo electrónico:
                        </p>
                        <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
                            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1e40af;">
                                ${codigo}
                            </span>
                        </div>
                        <p style="color: #94a3b8; font-size: 13px;">
                            Este código expira en <strong>30 minutos</strong>. Si no solicitaste este código, ignora este mensaje.
                        </p>
                    </div>
                    <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 16px;">
                        Sistema de Gestión de Inventario y Alquileres de Carpas
                    </p>
                </div>
            `
        };

        await EmailService._enviar(mailOptions);
    }

    /**
     * Enviar notificación de aprobación de cuenta
     * @param {string} email
     * @param {string} nombre
     */
    static async enviarAprobacion(email, nombre) {
        const from = process.env.SMTP_FROM || process.env.SMTP_USER;
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

        const mailOptions = {
            from,
            to: email,
            subject: 'Cuenta aprobada - Sistema de Inventario Carpas',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #22c55e, #16a34a); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 24px;">¡Cuenta Aprobada!</h1>
                    </div>
                    <div style="background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
                        <p style="color: #334155; font-size: 16px;">Hola <strong>${nombre}</strong>,</p>
                        <p style="color: #64748b; font-size: 14px;">
                            Tu solicitud de acceso ha sido aprobada. Ya puedes iniciar sesión en el sistema.
                        </p>
                        <div style="text-align: center; margin: 24px 0;">
                            <a href="${frontendUrl}/login" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                                Iniciar Sesión
                            </a>
                        </div>
                    </div>
                    <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 16px;">
                        Sistema de Gestión de Inventario y Alquileres de Carpas
                    </p>
                </div>
            `
        };

        await EmailService._enviar(mailOptions);
    }

    /**
     * Enviar notificación de rechazo de cuenta
     * @param {string} email
     * @param {string} nombre
     * @param {string} motivo
     */
    static async enviarRechazo(email, nombre, motivo) {
        const from = process.env.SMTP_FROM || process.env.SMTP_USER;

        const mailOptions = {
            from,
            to: email,
            subject: 'Solicitud de acceso - Sistema de Inventario Carpas',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 24px;">Solicitud No Aprobada</h1>
                    </div>
                    <div style="background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
                        <p style="color: #334155; font-size: 16px;">Hola <strong>${nombre}</strong>,</p>
                        <p style="color: #64748b; font-size: 14px;">
                            Lamentamos informarte que tu solicitud de acceso no fue aprobada.
                        </p>
                        ${motivo ? `
                        <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
                            <p style="color: #991b1b; font-size: 14px; margin: 0;"><strong>Motivo:</strong> ${motivo}</p>
                        </div>
                        ` : ''}
                        <p style="color: #64748b; font-size: 14px;">
                            Si crees que esto fue un error, contacta al administrador del sistema.
                        </p>
                    </div>
                    <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 16px;">
                        Sistema de Gestión de Inventario y Alquileres de Carpas
                    </p>
                </div>
            `
        };

        await EmailService._enviar(mailOptions);
    }

    /**
     * Método interno para enviar emails con manejo de errores
     * @param {Object} mailOptions
     */
    static async _enviar(mailOptions) {
        if (!transporter) {
            logger.warn('email', `Email no enviado (SMTP no configurado): ${mailOptions.subject} → ${mailOptions.to}`);
            return;
        }

        try {
            await transporter.sendMail(mailOptions);
            logger.info('email', `Email enviado: ${mailOptions.subject} → ${mailOptions.to}`);
        } catch (error) {
            logger.error('email', `Error enviando email a ${mailOptions.to}: ${error.message}`);
            throw error;
        }
    }
}

module.exports = EmailService;
