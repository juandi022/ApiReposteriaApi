import { Request, Response } from "express";
import { validationResult } from "express-validator";
import Usuario from "../../Model/Usuario.js";
import bscrypt from "bcrypt";

export const listarUsuarios = async (req: Request, res: Response): Promise<Response> => {
    try {
        const usuarios = await Usuario.findAll();
        return res.json(usuarios);
    }
    catch (error) {
        console.error('Error al listar los usuarios: ', error);
        return res.status(500).json({ error: 'Error al listar los usuarios' });
    }
};

export const obtenerUsuarioPorId = async (req: Request, res: Response): Promise<Response> => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array() });
    }

    const { id } = req.query;

    try {
        const usuario = await Usuario.findByPk(Number(id));

        if (!usuario) {
            return res.status(404).json({ error: 'No se encontró ese usuario' });
        }

        return res.json(usuario);
    }
    catch (error) {
        console.error('Error al obtener el usuario por ID: ', error);
        return res.status(500).json({ error: 'Error al obtener el usuario por ID' });
    }
};

export const obtenerUsuarioPorEmail = async (req: Request, res: Response): Promise<Response> => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array() });
    }

    const { useremail, userpswd } = req.body;

    try {
        const usuario = await Usuario.findOne({ where: { useremail } });

        if (!usuario || !(await bscrypt.compare(userpswd, usuario.userpswd))) {
            return res.status(404).json({ error: 'Correo o contraseña incorrecta' });
        }

        return res.status(200).json({ message: 'Ha iniciado sesión correctamente' });
    }
    catch (error) {
        console.error('Error al obtener el usuario: ', error);
        return res.status(500).json({ error: 'Error al obtener el usuario' });
    }
};

export const guardarUsuario = async (req: Request, res: Response): Promise<Response> => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array() });
    }

    const { useremail, username, userpswd } = req.body;

    try {
        //Constante necesaria para hash de contraseña
        const saltRounds = 10;

        const result = new Date; //variable para calcular la fecha de vencimiento de la contraseña
        result.setDate(result.getDate() + 90); //calculo de fecha de vencimiento de contraseña, se añaden 90 días a la fecha actual
        const userpswdexp = new Date(result); //convertir result a tipo Date

        const userpswdchg = new Date;

        const hashedpass = await bscrypt.hash(userpswd, saltRounds);

        const nuevoUsuario = await Usuario.create({
            useremail, username, userpswd: hashedpass, userpswdchg, userpswdexp
        });

        return res.status(201).json(nuevoUsuario);
    }
    catch (error) {
        console.error('Error al crear el usuario por ID: ', error);
        return res.status(500).json({ error: 'Error al crear el usuario por ID' });
    }
};

export const actualizarUsuario = async (req: Request, res: Response): Promise<Response> => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array() });
    }

    const { id } = req.query;

    const { useremail, username, userfching, userpswdest, userpswdexp, userest,
        useractcod, userpswdchg, usertipo } = req.body

    try {
        const usuario = await Usuario.findByPk(Number(id));

        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        usuario.useremail = useremail ?? usuario.useremail;
        usuario.username = username ?? usuario.username;
        usuario.userfching = userfching ?? usuario.userfching;
        if (userpswdest !== undefined) usuario.userpswdest = userpswdest;
        usuario.userpswdexp = userpswdexp ?? usuario.userpswdexp;
        if (userest !== undefined) usuario.userest = userest;
        usuario.useractcod = useractcod ?? usuario.useractcod;
        usuario.userpswdchg = userpswdchg ?? usuario.userpswdchg;
        if (usertipo) usuario.usertipo = usertipo;

        await usuario.save();

        return res.json(usuario);
    }
    catch (error) {
        console.error('Error al actualizar el usuario por ID: ', error);
        return res.status(500).json({ error: 'Error al actualizar el usuario por ID' });
    }
};

export const eliminarUsuario = async (req: Request, res: Response): Promise<Response> => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array() });
    }

    const { id } = req.query;

    try {
        const usuario = await Usuario.findByPk(Number(id));

        if (!usuario) {
            return res.status(404).json({ error: 'No se encontró ese usuario' });
        }

        await usuario.destroy();
        return res.json({ message: 'Usuario eliminado correctamente' });
    }
    catch (error) {
        console.error('Error al eliminar el usuario: ', error);
        return res.status(500).json({ error: 'Error al eliminar el usuario' });
    }
};