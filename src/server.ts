import 'dotenv/config';
import app from './app.js';
import db from './Configs/db.js';
import { error } from 'node:console';

const PORT = process.env.PORT || 3000;

db.authenticate()
  .then(() => {
    console.log('Conexion a la base de datos establecida');
    db.sync();
    console.log('Modelos sincronizados con la base de datos');
  })
  .catch((error) => console.error('Error al conectar con la base de datos', error));


app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});