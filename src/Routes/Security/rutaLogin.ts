import { Router } from "express";
import { body } from "express-validator";
import { obtenerUsuarioPorEmail } from "../../Controllers/Usuario/Usuario.js";

const login = Router();

login.post('/login',
    body('useremail')
        .isEmail().withMessage('El email no es válido')
        .notEmpty().withMessage('El email es obligatorio'),
    body('userpswd')
        .notEmpty().withMessage('La contraseña es obligatoria'),
    obtenerUsuarioPorEmail
);


export default login;