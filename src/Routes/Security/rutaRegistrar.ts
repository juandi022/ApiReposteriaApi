import { Router } from "express";
import { guardarUsuario } from "../../Controllers/Usuario/Usuario.js";
import { body, query } from "express-validator";

const register = Router();

register.post('/registrar',
    body('useremail')
        .isEmail().withMessage('El email no es válido')
        .notEmpty().withMessage('El email es obligatorio'),
    body('username')
        .notEmpty().withMessage('El nombre de usuario es obligatorio')
        .isLength({ min: 3, max: 80 }).withMessage('El nombre de usuario debe tener entre 3 y 80 caracteres'),
    body('userpswd')
        .notEmpty().withMessage('La contraseña es obligatoria')
        .isStrongPassword({
            minLength: 8,
            minUppercase: 1,
            minSymbols: 1,
            minNumbers: 1
        }).withMessage('La contraseña debe tener al menos 8 caracteres, 1 mayúscula, 1 símobolo y 1 número'),
    guardarUsuario
);


export default register;