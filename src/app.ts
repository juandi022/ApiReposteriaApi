import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rutasUsuarios from './Routes/Usuario/rutasUsuarios.js';
import register from './Routes/Security/rutaRegistrar.js';
import login from './Routes/Security/rutaLogin.js';


const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan('combined'));
app.use('/api/usuarios', rutasUsuarios);
app.use('/api/security', register);
app.use('/api/security', login);

export default app;