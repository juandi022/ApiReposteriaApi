import { Router } from "express";
import { body, query } from "express-validator";

import {
    listarFunciones,
    actualizarFuncion,
    eliminarFuncion,
    guardarFuncion,
    obtenerFuncionPorId
} from "../../Controllers/Funcion/Funcion.js";

const rutasFunciones = Router();


// Listar todas las funciones
rutasFunciones.get('/', listarFunciones);


// Obtener función por código
rutasFunciones.get('/funcion',
    query('fncod')
        .notEmpty()
        .withMessage('El código de la función es obligatorio')
        .isLength({ max: 255 })
        .withMessage('El código de la función debe tener máximo 255 caracteres'),
    obtenerFuncionPorId
);


// Guardar función
rutasFunciones.post('/guardar',
    body('fncod')
        .notEmpty()
        .withMessage('El código de la función es obligatorio')
        .isLength({ max: 255 })
        .withMessage('El código de la función debe tener máximo 255 caracteres'),

    body('fndsc')
        .notEmpty()
        .withMessage('La descripción de la función es obligatoria')
        .isLength({ max: 45 })
        .withMessage('La descripción debe tener entre 1 y 45 caracteres'),

    body('fnest')
        .notEmpty()
        .withMessage('El estado de la función es obligatorio')
        .isLength({ max: 3 })
        .withMessage('El estado debe tener máximo tres caracteres')
        .isIn(['ACT', 'INA'])
        .withMessage('El estado debe ser ACT o INA'),

    body('fntyp')
        .notEmpty()
        .withMessage('El tipo de función es obligatorio')
        .isLength({ max: 3 })
        .withMessage('El tipo de función debe tener máximo tres caracteres'),

    guardarFuncion
);


// Actualizar función
rutasFunciones.put('/actualizar',
    query('fncod')
        .notEmpty()
        .withMessage('El código de la función es obligatorio')
        .isLength({ max: 255 })
        .withMessage('El código de la función debe tener máximo 255 caracteres'),

    body('fndsc')
        .optional()
        .isLength({ max: 45 })
        .withMessage('La descripción debe tener máximo 45 caracteres'),

    body('fnest')
        .optional()
        .isLength({ max: 3 })
        .withMessage('El estado debe tener máximo tres caracteres')
        .isIn(['ACT', 'INA'])
        .withMessage('El estado debe ser ACT o INA'),

    body('fntyp')
        .optional()
        .isLength({ max: 3 })
        .withMessage('El tipo de función debe tener máximo tres caracteres'),

    actualizarFuncion
);


// Eliminar función
rutasFunciones.delete('/eliminar',
    query('fncod')
        .notEmpty()
        .withMessage('El código de la función es obligatorio')
        .isLength({ max: 255 })
        .withMessage('El código de la función debe tener máximo 255 caracteres'),

    eliminarFuncion
);


export default rutasFunciones;