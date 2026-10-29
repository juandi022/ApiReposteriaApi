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
import rutasCatalogo from './Routes/Catalogo/rutasCatalogo.js';
import rutasCarrito from './Routes/Carrito/rutasCarrito.js';
import rutasFuncionesRoles from './Routes/FuncionesRoles/rutasFuncionesRoles.js';
import rutasRolesUsuarios from './Routes/RolesUsuarios/rutasRolesUsuarios.js';
import { setupSwagger } from './Configs/swagger.js';
import { RUTA_IMAGENES } from './Configs/archivos.js';

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan('combined'));
app.use('/api/usuarios', rutasUsuarios);
app.use('/api/funciones', rutasFunciones);
app.use('/api/roles', rutasRoles);
app.use('/api/proveedores', rutasProveedores);
app.use('/api/compras', rutasCompras);
app.use('/api/funciones-roles', rutasFuncionesRoles);
app.use('/api/roles-usuarios', rutasRolesUsuarios);
app.use('/api/security', register);
app.use('/api/security', login);
app.use('/api/catalogo', rutasCatalogo);
app.use('/api/carrito', rutasCarrito);

// Sirve las imágenes guardadas: http://localhost:3001/img/<archivo>
app.use('/img', express.static(RUTA_IMAGENES));

// Documentación Swagger: http://localhost:3001/api-docs
setupSwagger(app);

export default app;