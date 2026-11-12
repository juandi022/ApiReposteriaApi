import Usuario from "../Model/Usuario.js";
import { enviarCorreo } from "../Configs/correo.js";

/**
 * Envía al correo del usuario el PIN generado para cambiar su contraseña.
 * @param usercod Código del usuario que solicitó el PIN
 * @param pin PIN temporal de cuatro dígitos
 * @param minutosExpiracion Minutos de vigencia del PIN
 */
export const correoCambiarContra = async (
    usercod: number,
    pin: string,
    minutosExpiracion: number
): Promise<void> => {
    const usuario = await Usuario.findByPk(usercod);
    if (!usuario) throw new Error('Usuario no encontrado para enviar el correo de cambio de contraseña');

    const destinatario = usuario.useremail;
    if (!destinatario) throw new Error('El usuario no tiene correo asociado');

    const mensaje = `Estimado(a) ${usuario.username},

Recibimos una solicitud para cambiar la contraseña de su cuenta.

Su código PIN de seguridad es: ${pin}

El PIN es válido por ${minutosExpiracion} minuto(s) y solo puede utilizarse una vez.
Si usted no solicitó este cambio, por favor ignore este correo.

Saludos cordiales.`;

    const enviado = await enviarCorreo(
        destinatario,
        'Cambio de contraseña - PIN de seguridad',
        mensaje
    );

    if (!enviado) {
        throw new Error('No se pudo enviar el correo con el PIN de cambio de contraseña');
    }
};
