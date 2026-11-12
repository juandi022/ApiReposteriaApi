import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { Op, UniqueConstraintError } from 'sequelize';
import Usuario, { TipoUsuario } from '../../Model/Usuario.js';

const SALT_ROUNDS = 10;
const DIAS_VIGENCIA_CONTRASENA = 90;

/**
 * Registra un nuevo usuario público (sign up).
 * Equivale a Security::newUsuario del proyecto original en PHP.
 */
export const registrarUsuario = async (req: Request, res: Response): Promise<Response> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const useremail = req.body.useremail;
    const username = req.body.username;
    const userpswd = req.body.userpswd;

    if (typeof useremail !== 'string' || typeof username !== 'string' || typeof userpswd !== 'string') {
        return res.status(400).json({
            error: 'Debe proporcionar el correo, el nombre de usuario y la contraseña',
        });
    }

    const emailNormalizado = useremail.trim().toLowerCase();
    const usernameNormalizado = username.trim();

    try {
        const usuarioExistente = await Usuario.findOne({
            where: {
                [Op.or]: [
                    { useremail: emailNormalizado },
                    { username: usernameNormalizado },
                ],
            },
        });

        if (usuarioExistente) {
            const campo = usuarioExistente.useremail.toLowerCase() === emailNormalizado
                ? 'correo electrónico'
                : 'nombre de usuario';

            return res.status(409).json({ error: `El ${campo} ya está registrado` });
        }

        const fechaCambio = new Date();
        const fechaExpiracion = new Date(fechaCambio);
        fechaExpiracion.setDate(fechaExpiracion.getDate() + DIAS_VIGENCIA_CONTRASENA);

        // Código de activación sha256(correo + tiempo), igual que el proyecto original.
        const useractcod = crypto
            .createHash('sha256')
            .update(`${emailNormalizado}${Date.now()}`)
            .digest('hex');

        const nuevoUsuario = await Usuario.create({
            useremail: emailNormalizado,
            username: usernameNormalizado,
            userpswd: await bcrypt.hash(userpswd, SALT_ROUNDS),
            userpswdest: 'ACT',
            userpswdexp: fechaExpiracion,
            userest: 'ACT',
            useractcod,
            userpswdchg: fechaCambio,
            usertipo: TipoUsuario.PUBLICO,
        });

        return res.status(201).json({
            message: '¡Usuario Registrado Satisfactoriamente!',
            usuario: {
                usercod: nuevoUsuario.usercod,
                useremail: nuevoUsuario.useremail,
                username: nuevoUsuario.username,
                userest: nuevoUsuario.userest,
                usertipo: nuevoUsuario.usertipo,
            },
        });
    } catch (error) {
        if (error instanceof UniqueConstraintError) {
            return res.status(409).json({ error: 'El correo electrónico o el nombre de usuario ya está registrado' });
        }

        console.error('Error al registrar el usuario: ', error);
        return res.status(500).json({ error: 'Error al registrar el usuario' });
    }
};
