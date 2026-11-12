# Pruebas manuales en Swagger

Esta guía describe cómo preparar los datos de prueba y recorrer los endpoints de la API desde Swagger UI. Los registros de prueba se identifican con los prefijos `TEST SWAGGER`, `test.swagger` y `SWAGGER-TEST-001`, por lo que es fácil distinguirlos de los datos reales.

## 1. Preparar los datos

Desde la carpeta `ApiReposteriaApi`, ejecuta:

```bat
npm run seed:test
```

El comando:

- crea o restablece únicamente los registros de prueba;
- no borra otros datos de la base;
- deja la compra de prueba en estado `Borrador`;
- restablece el carrito de prueba a 2 unidades del producto de prueba;
- restablece el stock del producto de prueba a 100;
- imprime una contraseña temporal nueva en cada ejecución.

Usa **siempre la última contraseña impresa** para iniciar sesión.

Después de preparar los datos, arranca la API:

```bat
npm run dev
```

y abre [http://localhost:3001/api-docs](http://localhost:3001/api-docs).

## 2. Datos de prueba creados

| Concepto | Valor |
| --- | --- |
| Usuario | `test_swagger` |
| Correo | `test.swagger@example.invalid` |
| Tipo de usuario | `PLB` (público) |
| Rol | `TST_SWAGGER` |
| Función | `test.swagger.sample` |
| Producto | `TEST SWAGGER - Brownie` |
| Proveedor | `TEST SWAGGER - Proveedor` |
| Factura de prueba | `SWAGGER-TEST-001` |
| Unidades en el carrito | 2 |
| Cantidad en la compra | 1 |
| Subtotal / impuesto / total de la compra | `25.00` / `3.75` / `28.75` |

Los identificadores numéricos (`usercod`, `id_producto`, `id_proveedor`, `id_compra`, `id_detalle_compra` e `id_detalle_carrito`) los imprime `npm run seed:test`. Úsalos en los parámetros de los endpoints.

## 3. Autenticación

1. En `Autenticación`, ejecuta `POST /api/security/iniciarsesion` con:

   ```json
   {
     "username": "test_swagger",
     "userpswd": "<contraseña temporal impresa por seed:test>"
   }
   ```

2. Copia el campo `token` de la respuesta.
3. Pulsa **Authorize**, pega el token y confirma.
4. Ejecuta `GET /api/security/perfil`. Debe responder `200`.

El token se envía como `Authorization: Bearer <token>`.

## 4. Endpoints de lectura (sin cambios)

| Método | Ruta | Parámetros de prueba |
| --- | --- | --- |
| GET | `/api/catalogo` | - |
| GET | `/api/catalogo/{id}` | `id = id_producto` |
| GET | `/api/proveedores` | - |
| GET | `/api/proveedores/proveedor` | `id = id_proveedor` |
| GET | `/api/compras` | - |
| GET | `/api/compras/compra` | `id = id_compra` |
| GET | `/api/carrito/{usercod}` | `usercod = usercod` |
| GET | `/api/roles` | - |
| GET | `/api/roles/rol` | `rolescod = TST_SWAGGER` |
| GET | `/api/roles-usuarios` | - |
| GET | `/api/roles-usuarios/asignacion` | `usercod = usercod`, `rolescod = TST_SWAGGER` |
| GET | `/api/funciones` | - |
| GET | `/api/funciones/funcion` | `fncod = test.swagger.sample` |
| GET | `/api/funciones-roles` | - |
| GET | `/api/funciones-roles/asignacion` | `rolescod = TST_SWAGGER`, `fncod = test.swagger.sample` |
| GET | `/api/usuarios` | - |
| GET | `/api/usuarios/usuario` | `id = usercod` |
| GET | `/api/security/perfil` | Requiere token |

## 5. Probar escrituras

Limita las modificaciones y eliminaciones a los registros de prueba. Para crear registros nuevos sin tocar los fixtures, usa nombres, códigos y números de factura que empiecen con `TEST SWAGGER`.

### Usuarios

```json
POST /api/usuarios/guardar
{
  "useremail": "nuevo.swagger@example.invalid",
  "username": "swagger_user",
  "userpswd": "ClaveSegura1!",
  "userpswdest": "ACT",
  "userest": "ACT",
  "usertipo": "PLB"
}
```

```json
PUT /api/usuarios/actualizar?id=<usercod>
{
  "userest": "ACT"
}
```

### Roles

```json
POST /api/roles/guardar
{
  "rolescod": "TST_SWAGGER_2",
  "rolesdsc": "Rol auxiliar Swagger",
  "rolesest": "ACT"
}
```

### Funciones

```json
POST /api/funciones/guardar
{
  "fncod": "test.swagger.otra",
  "fndsc": "Función auxiliar Swagger",
  "fnest": "ACT",
  "fntyp": "TST"
}
```

### Proveedores

```json
POST /api/proveedores/guardar
{
  "nombre": "TEST SWAGGER - Proveedor 2",
  "contacto": "Contacto auxiliar",
  "telefono": "0000-0000",
  "correo": "proveedor2.swagger@example.invalid",
  "direccion": "Registro auxiliar de pruebas",
  "estado": "Activo"
}
```

El proveedor de prueba no se puede eliminar porque tiene la compra `SWAGGER-TEST-001` asociada (responde `409`).

### Catálogo

```json
POST /api/catalogo/guardar
{
  "nombre": "TEST SWAGGER - Pastel",
  "descripcion": "Producto auxiliar de pruebas",
  "precio": 30.00,
  "stock": 10
}
```

`PUT /api/catalogo/imagen?id=<id_producto>` recibe `multipart/form-data` con el campo `imagen` (JPG o PNG, máx. 5 MB).

### Carrito

```json
POST /api/carrito
{
  "usercod": "<usercod>",
  "id_producto": "<id_producto>",
  "cantidad": 1
}
```

- `GET /api/carrito/{usercod}` devuelve el carrito activo y sus productos.
- `PUT /api/carrito/quitar/{id_detalle_carrito}` reduce una unidad o elimina el detalle.
- `DELETE /api/carrito/{id_detalle_carrito}` elimina el detalle completo.

### Compras

Crear una compra nueva:

```json
POST /api/compras/guardar
{
  "id_proveedor": "<id_proveedor>",
  "numero_factura": "TEST SWAGGER - FACTURA 2"
}
```

Agregar un detalle a la compra de prueba:

```json
POST /api/compras/detalle/guardar?id=<id_compra>
{
  "id_producto": "<id_producto>",
  "cantidad": 1,
  "costo_unitario": 25.00
}
```

Eliminar un detalle:

```
DELETE /api/compras/detalle/eliminar?id=<id_compra>&id_detalle=<id_detalle_compra>
```

Actualizar la compra (solo en `Borrador`):

```json
PUT /api/compras/actualizar?id=<id_compra>
{
  "numero_factura": "SWAGGER-TEST-001"
}
```

### Asignaciones de roles y funciones

```json
POST /api/roles-usuarios/guardar
{
  "usercod": "<usercod>",
  "rolescod": "TST_SWAGGER",
  "roleuserest": "ACT"
}
```

```json
POST /api/funciones-roles/guardar
{
  "rolescod": "TST_SWAGGER",
  "fncod": "test.swagger.sample",
  "fnrolest": "ACT"
}
```

## 6. Endpoints de seguridad opcionales

- `POST /api/security/enviar-pin` genera un PIN temporal y lo envía por correo. Requiere configuración SMTP válida en `.env`.
- `POST /api/security/actualizar-contrasena` permite cambiar la contraseña con PIN o con la contraseña actual.
- `POST /api/security/token-prueba` genera un JWT sin crear sesión (útil para pruebas rápidas).
- `POST /api/security/cerrarsesion` cierra la sesión actual o todas si se envía `?todas=true`.

## 7. Advertencias importantes

- No ejecutes `PUT /api/compras/confirmar` sobre `SWAGGER-TEST-001` en las pruebas básicas: confirmar una compra suma stock a los productos y envía un correo al proveedor.
- Evita eliminar el usuario, el rol, la función, el producto, el proveedor o la compra de prueba si quieres conservar los fixtures; si lo haces, vuelve a ejecutar `npm run seed:test`.
- El carrito y la compra de prueba se restablecen automáticamente cada vez que se ejecuta el seeder.
- La contraseña temporal cambia en cada ejecución del seeder; usa siempre la última impresa.

## 8. Restaurar el estado inicial

Si una prueba deja los datos en un estado inesperado, ejecuta de nuevo:

```bat
npm run seed:test
```

Esto restablece todos los fixtures de prueba sin afectar el resto de los datos.
