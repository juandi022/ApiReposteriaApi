import 'dotenv/config';
import app from './app.js';
import db from './Configs/db.js';
import "./Model/Producto.js";
import "./Model/Carrito.js";
import "./Model/DetalleCarrito.js";

const PORT = process.env.PORT || 3001;

db.authenticate()
  .then(() => {
    console.log('Conexion a la base de datos establecida');
    return db.sync();
  })
  .then(() => {
    console.log('Modelos sincronizados con la base de datos');

    app.listen(PORT, () => {
      console.log(`Servidor corriendo en el puerto ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error al conectar con la base de datos', error);
  });