import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rutasUsuarios from './Routes/Usuario/rutasUsuarios.js';
import register from './Routes/Security/rutaRegistrar.js';
import login from './Routes/Security/rutaLogin.js';
import rutasProveedores from './Routes/Proveedor/rutasProveedores.js';
import rutasCompras from './Routes/Compra/rutasCompras.js';
import rutasFuncionesRoles from './Routes/FuncionesRoles/rutasFuncionesRoles.js';
import rutasRolesUsuarios from './Routes/RolesUsuarios/rutasRolesUsuarios.js';

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan('combined'));
app.use('/api/usuarios', rutasUsuarios);
app.use('/api/proveedores', rutasProveedores);
app.use('/api/compras', rutasCompras);
app.use('/api/funciones-roles', rutasFuncionesRoles);
app.use('/api/roles-usuarios', rutasRolesUsuarios);
app.use('/api/security', register);
app.use('/api/security', login);

export default app;