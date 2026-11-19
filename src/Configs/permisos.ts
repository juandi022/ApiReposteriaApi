import { literal, Op } from 'sequelize';

import Funcion from '../Model/Funcion.js';
import FuncionesRoles from '../Model/FuncionesRoles.js';
import Rol from '../Model/Rol.js';
import RolesUsuarios from '../Model/RolesUsuarios.js';

/**
 * Códigos de función (fncod) usados para autorizar las rutas.
 * Cada código es la ruta API literal (método + path), no un nombre de
 * controlador como en el proyecto PHP anterior.
 */
export const FUNCIONES = {
    USUARIOS_LISTAR: '/api/usuarios',
    USUARIOS_OBTENER: '/api/usuarios/usuario',
    USUARIOS_GUARDAR: '/api/usuarios/guardar',
    USUARIOS_ACTUALIZAR: '/api/usuarios/actualizar',
    USUARIOS_ELIMINAR: '/api/usuarios/eliminar',

    ROLES_LISTAR: '/api/roles',
    ROLES_OBTENER: '/api/roles/rol',
    ROLES_GUARDAR: '/api/roles/guardar',
    ROLES_ACTUALIZAR: '/api/roles/actualizar',
    ROLES_ELIMINAR: '/api/roles/eliminar',

    FUNCIONES_LISTAR: '/api/funciones',
    FUNCIONES_OBTENER: '/api/funciones/funcion',
    FUNCIONES_GUARDAR: '/api/funciones/guardar',
    FUNCIONES_ACTUALIZAR: '/api/funciones/actualizar',
    FUNCIONES_ELIMINAR: '/api/funciones/eliminar',

    FUNCIONES_ROLES_LISTAR: '/api/funciones-roles',
    FUNCIONES_ROLES_OBTENER: '/api/funciones-roles/asignacion',
    FUNCIONES_ROLES_GUARDAR: '/api/funciones-roles/guardar',
    FUNCIONES_ROLES_ACTUALIZAR: '/api/funciones-roles/actualizar',
    FUNCIONES_ROLES_ELIMINAR: '/api/funciones-roles/eliminar',

    ROLES_USUARIOS_LISTAR: '/api/roles-usuarios',
    ROLES_USUARIOS_OBTENER: '/api/roles-usuarios/asignacion',
    ROLES_USUARIOS_GUARDAR: '/api/roles-usuarios/guardar',
    ROLES_USUARIOS_ACTUALIZAR: '/api/roles-usuarios/actualizar',
    ROLES_USUARIOS_ELIMINAR: '/api/roles-usuarios/eliminar',

    CATALOGO_LISTAR: '/api/catalogo/',
    CATALOGO_GUARDAR: '/api/catalogo/guardar',
    CATALOGO_IMAGEN: '/api/catalogo/imagen',
    CATALOGO_OBTENER: '/api/catalogo/{id}',

    COMPRAS_LISTAR: 'api/compras/',    
    COMPRAS_OBTENER: 'api/compras/compra',
    COMPRAS_GUARDAR: 'api/compras/guardar',
    COMPRAS_ACTUALIZAR: 'api/compras/actualizar',
    COMPRAS_ELIMINAR: 'api/compras/eliminar',
    COMPRAS_CONFIRMAR: 'api/compras/confirmar',

    DETALLE_COMPRA_GUARDAR: 'api/compras/detalle/guardar',
    DETALLE_COMPRA_ELIMINAR: 'api/compras/detalle/eliminar',
} as const;

const ESTADO_ACTIVO = 'ACT';

// Un estado nulo se considera activo: los modelos permiten null y no existe
// un estado explícito alternativo en las tablas de autorización.
const estadoActivo = (estado: string | null | undefined): boolean =>
    estado == null || estado === ESTADO_ACTIVO;

const fechaVigente = (fecha: Date | null | undefined): boolean =>
    !fecha || fecha.getTime() > Date.now();

/**
 * Devuelve los códigos de roles activos asignados al usuario.
 * Se validan tanto la asignación (roles_usuarios) como el propio rol (roles).
 */
export const obtenerRolesActivos = async (usercod: number): Promise<string[]> => {
    const asignaciones = await RolesUsuarios.findAll({
        where: {
            usercod,
            [Op.and]: [
                {
                    [Op.or]: [
                        { roleuserest: { [Op.is]: literal('NULL') } },
                        { roleuserest: ESTADO_ACTIVO },
                    ],
                },
                {
                    [Op.or]: [
                        { roleuserexp: { [Op.is]: literal('NULL') } },
                        { roleuserexp: { [Op.gt]: new Date() } },
                    ],
                },
            ],
        },
        attributes: ['rolescod'],
        raw: true,
    });

    const codigos = [...new Set(asignaciones.map((asignacion) => asignacion.rolescod))];

    if (codigos.length === 0) {
        return [];
    }

    const roles = await Rol.findAll({
        where: {
            rolescod: { [Op.in]: codigos },
            [Op.or]: [
                { rolesest: { [Op.is]: literal('NULL') } },
                { rolesest: ESTADO_ACTIVO },
            ],
        },
        attributes: ['rolescod'],
        raw: true,
    });

    return roles.map((rol) => rol.rolescod);
};

/**
 * Indica si el usuario tiene la función a través de cualquiera de sus roles
 * activos. Verifica toda la cadena: roles_usuarios -> roles -> funciones_roles -> funciones.
 */
export const usuarioTieneFuncion = async (
    usercod: number,
    fncod: string
): Promise<boolean> => {
    const roles = await obtenerRolesActivos(usercod);

    if (roles.length === 0) {
        return false;
    }

    const [asignacion, funcion] = await Promise.all([
        FuncionesRoles.findOne({
            where: {
                fncod,
                rolescod: { [Op.in]: roles },
                [Op.and]: [
                    {
                        [Op.or]: [
                            { fnrolest: { [Op.is]: literal('NULL') } },
                            { fnrolest: ESTADO_ACTIVO },
                        ],
                    },
                    {
                        [Op.or]: [
                            { fnexp: { [Op.is]: literal('NULL') } },
                            { fnexp: { [Op.gt]: new Date() } },
                        ],
                    },
                ],
            },
        }),
        Funcion.findOne({
            where: {
                fncod,
                [Op.or]: [
                    { fnest: { [Op.is]: literal('NULL') } },
                    { fnest: ESTADO_ACTIVO },
                ],
            },
        }),
    ]);

    return Boolean(asignacion && funcion && estadoActivo(asignacion.fnrolest) && fechaVigente(asignacion.fnexp) && estadoActivo(funcion.fnest));
};
