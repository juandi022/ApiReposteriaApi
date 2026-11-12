import nodemailer from 'nodemailer';
import 'dotenv/config'

const { PROVIDER_CORREO, USUARIO_CORREO, CONTRASENA_CORREO, CLIENT_ID, CLIENT_SECRET,  } = process.env;

// Configuración del servicio de transporte de correo
const transporter = nodemailer.createTransport({
  service: PROVIDER_CORREO,
  secure: true,
  port: 465,
  auth: {
    user: USUARIO_CORREO,
    pass: CONTRASENA_CORREO,
  },
});

/**
 * Envía un correo electrónico asíncrono
 * @param destinatario Dirección de correo del receptor
 * @param asunto Asunto del correo
 * @param mensaje Contenido del mensaje en texto plano
 * @returns `true` si el correo se envió correctamente, `false` en caso contrario
 */
export const enviarCorreo = async (
  destinatario: string,
  asunto: string,
  mensaje: string
): Promise<boolean> => {
  try {
    const mailOptions = {
      from: USUARIO_CORREO,
      to: destinatario,
      subject: asunto,
      text: mensaje,
    };

    await transporter.sendMail(mailOptions);
    console.log('Correo enviado exitosamente a:', destinatario);
    return true;
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    return false;
  }
};