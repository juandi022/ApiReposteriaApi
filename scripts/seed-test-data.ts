import { randomBytes } from 'node:crypto';
import bcrypt from 'bcrypt';
import 'dotenv/config';

// Modelos y conexión a la base de datos que usa la API.
import db from '../src/Configs/db.js';
import Carrito from '../src/Model/Carrito.js';
import Compra, { EstadoCompra } from '../src/Model/Compra.js';
import DetalleCarrito from '../src/Model/DetalleCarrito.js';
import DetalleCompra from '../src/Model/DetalleCompra.js';
import Funcion from '../src/Model/Funcion.js';
import FuncionesRoles from '../src/Model/FuncionesRoles.js';
import Producto from '../src/Model/Producto.js';
import Proveedor, { EstadoProveedor } from '../src/Model/Proveedor.js';
import Rol from '../src/Model/Rol.js';
import RolesUsuarios from '../src/Model/RolesUsuarios.js';
import Usuario, { TipoUsuario } from '../src/Model/Usuario.js';

/**
 * Datos de prueba reservados para Swagger.
 *
 * Todo lo que se crea aquí lleva el prefijo "TEST SWAGGER", "test.swagger" o
 * "SWAGGER-TEST-001" para que sea fácil identificarlo y no confundirlo con
 * datos reales. El script es idempotente: se puede ejecutar varias veces y
 * siempre deja los mismos registros en el mismo estado inicial.
 */
const TEST_EMAIL = 'test.swagger@example.invalid';
const TEST_USERNAME = 'test_swagger';
const TEST_ROLE = 'TST_SWAGGER';
const TEST_FUNCTION = 'test.swagger.sample';
const TEST_PRODUCT = 'TEST SWAGGER - Brownie';
const TEST_SUPPLIER = 'TEST SWAGGER - Proveedor';
const TEST_INVOICE = 'SWAGGER-TEST-001';

// El impuesto que aplica la API al recalcular una compra es del 15%.
const IMPUESTO_COMPRA = 0.15;
const SUBTOTAL_COMPRA = 25.00;
const IMPUESTO_CALCULADO = Math.round(SUBTOTAL_COMPRA * IMPUESTO_COMPRA * 100) / 100;
const TOTAL_COMPRA = SUBTOTAL_COMPRA + IMPUESTO_CALCULADO;

try {
  // Contraseña temporal aleatoria: se imprime al final y se usa para iniciar sesión.
  const password = randomBytes(24).toString('base64url');
  const passwordHash = await bcrypt.hash(password, 10);

  const fixtures = await db.transaction(async (transaction) => {
    // ---------- Usuario de pruebas ----------
    const [usuario] = await Usuario.findOrCreate({
      where: { useremail: TEST_EMAIL },
      defaults: {
        useremail: TEST_EMAIL,
        username: TEST_USERNAME,
        userpswd: passwordHash,
        userpswdest: 'ACT',
        userest: 'ACT',
        usertipo: TipoUsuario.PUBLICO,
      },
      transaction,
    });

    // Restablece siempre el usuario de pruebas (incluso si ya existía).
    await usuario.update({
      username: TEST_USERNAME,
      userpswd: passwordHash,
      userpswdest: 'ACT',
      userest: 'ACT',
      usertipo: TipoUsuario.PUBLICO,
    }, { transaction });

    // ---------- Rol de pruebas ----------
    const [rol] = await Rol.findOrCreate({
      where: { rolescod: TEST_ROLE },
      defaults: { rolescod: TEST_ROLE, rolesdsc: 'Rol de pruebas Swagger', rolesest: 'ACT' },
      transaction,
    });
    await rol.update({ rolesdsc: 'Rol de pruebas Swagger', rolesest: 'ACT' }, { transaction });

    // ---------- Función de pruebas ----------
    const [funcion] = await Funcion.findOrCreate({
      where: { fncod: TEST_FUNCTION },
      defaults: {
        fncod: TEST_FUNCTION,
        fndsc: 'Función de prueba Swagger',
        fnest: 'ACT',
        fntyp: 'TST',
      },
      transaction,
    });
    await funcion.update({
      fndsc: 'Función de prueba Swagger',
      fnest: 'ACT',
      fntyp: 'TST',
    }, { transaction });

    // ---------- Asignación función -> rol ----------
    const [asignacionFuncion] = await FuncionesRoles.findOrCreate({
      where: { rolescod: TEST_ROLE, fncod: TEST_FUNCTION },
      defaults: { rolescod: TEST_ROLE, fncod: TEST_FUNCTION, fnrolest: 'ACT' },
      transaction,
    });
    await asignacionFuncion.update({ fnrolest: 'ACT' }, { transaction });

    // ---------- Asignación rol -> usuario ----------
    const [asignacionRol] = await RolesUsuarios.findOrCreate({
      where: { usercod: usuario.usercod, rolescod: TEST_ROLE },
      defaults: { usercod: usuario.usercod, rolescod: TEST_ROLE, roleuserest: 'ACT' },
      transaction,
    });
    await asignacionRol.update({ roleuserest: 'ACT' }, { transaction });

    // ---------- Proveedor de pruebas ----------
    const [proveedor] = await Proveedor.findOrCreate({
      where: { nombre: TEST_SUPPLIER },
      defaults: {
        nombre: TEST_SUPPLIER,
        contacto: 'Contacto de prueba',
        telefono: '0000-0000',
        correo: 'proveedor.swagger@example.invalid',
        direccion: 'Registro de pruebas; no realizar pedidos',
        estado: EstadoProveedor.ACTIVO,
      },
      transaction,
    });
    await proveedor.update({ estado: EstadoProveedor.ACTIVO }, { transaction });

    // ---------- Producto de pruebas ----------
    const [producto] = await Producto.findOrCreate({
      where: { nombre: TEST_PRODUCT },
      defaults: {
        nombre: TEST_PRODUCT,
        descripcion: 'Producto reservado para pruebas de Swagger',
        precio: '25.00',
        stock: 100,
        estado: true,
      },
      transaction,
    });
    await producto.update({ stock: 100, estado: true }, { transaction });

    // ---------- Carrito de pruebas ----------
    // Se elimina cualquier detalle previo del carrito de prueba para que siempre
    // quede exactamente con 2 unidades del producto de prueba.
    const [carrito] = await Carrito.findOrCreate({
      where: { usercod: usuario.usercod, estado: 'Activo' },
      defaults: { usercod: usuario.usercod, estado: 'Activo' },
      transaction,
    });
    await DetalleCarrito.destroy({ where: { id_carrito: carrito.id_carrito }, transaction });
    const detalleCarrito = await DetalleCarrito.create({
      id_carrito: carrito.id_carrito,
      id_producto: producto.id_producto,
      cantidad: 2,
      precio_unitario: '25.00',
    }, { transaction });

    // ---------- Compra de pruebas ----------
    // Se eliminan detalles previos para restablecer la compra a un único detalle
    // de 1 unidad, con los totales coherentes con el 15% de impuesto de la API.
    const [compra] = await Compra.findOrCreate({
      where: { numero_factura: TEST_INVOICE },
      defaults: {
        id_proveedor: proveedor.id_proveedor,
        numero_factura: TEST_INVOICE,
        subtotal: SUBTOTAL_COMPRA.toFixed(2),
        impuesto: IMPUESTO_CALCULADO.toFixed(2),
        total: TOTAL_COMPRA.toFixed(2),
        estado: EstadoCompra.BORRADOR,
      },
      transaction,
    });
    await compra.update({
      id_proveedor: proveedor.id_proveedor,
      subtotal: SUBTOTAL_COMPRA.toFixed(2),
      impuesto: IMPUESTO_CALCULADO.toFixed(2),
      total: TOTAL_COMPRA.toFixed(2),
      estado: EstadoCompra.BORRADOR,
    }, { transaction });

    await DetalleCompra.destroy({ where: { id_compra: compra.id_compra }, transaction });
    const detalleCompra = await DetalleCompra.create({
      id_compra: compra.id_compra,
      id_producto: producto.id_producto,
      cantidad: 1,
      costo_unitario: '25.00',
      subtotal: SUBTOTAL_COMPRA.toFixed(2),
    }, { transaction });

    return {
      usercod: usuario.usercod,
      idProducto: producto.id_producto,
      idProveedor: proveedor.id_proveedor,
      idCompra: compra.id_compra,
      idDetalleCarrito: detalleCarrito.id_detalle_carrito,
      idDetalleCompra: detalleCompra.id_detalle_compra,
    };
  });

  console.log('Datos de prueba Swagger listos:');
  console.log(`  Usuario: ${TEST_USERNAME}`);
  console.log(`  Correo: ${TEST_EMAIL}`);
  console.log(`  Contraseña temporal: ${password}`);
  console.log(`  Tipo de usuario: ${TipoUsuario.PUBLICO} (PLB)`);
  console.log(`  usercod: ${fixtures.usercod}`);
  console.log(`  id_producto: ${fixtures.idProducto}`);
  console.log(`  id_proveedor: ${fixtures.idProveedor}`);
  console.log(`  id_compra: ${fixtures.idCompra}`);
  console.log(`  id_detalle_compra: ${fixtures.idDetalleCompra}`);
  console.log(`  id_detalle_carrito: ${fixtures.idDetalleCarrito}`);
  console.log(`  Rol: ${TEST_ROLE}`);
  console.log(`  Función: ${TEST_FUNCTION}`);
  console.log(`  Factura de prueba: ${TEST_INVOICE}`);
  console.log('El usuario de prueba tiene tipo PLB y no se modificaron ni borraron otros registros.');
} catch (error) {
  console.error('No se pudieron preparar los datos de prueba de Swagger.');
  throw error;
} finally {
  await db.close();
}
