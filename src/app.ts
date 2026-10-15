import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rutasFunciones from "./Routes/Funcion/rutasFunciones.js";
import rutasRoles from "./Routes/Rol/rutasRoles.js";
import rutasUsuarios from './Routes/Usuario/rutasUsuarios.js';
import register from './Routes/Security/rutaRegistrar.js';
import login from './Routes/Security/rutaLogin.js';
import rutasProveedores from './Routes/Proveedor/rutasProveedores.js';
import rutasCompras from './Routes/Compra/rutasCompras.js';

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan('combined'));
app.use('/api/usuarios', rutasUsuarios);
app.use('/api/funciones', rutasFunciones);
app.use('/api/roles', rutasRoles);
app.use('/api/proveedores', rutasProveedores);
app.use('/api/compras', rutasCompras);
app.use('/api/security', register);
app.use('/api/security', login);

export default app;