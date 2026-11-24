import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  actualizarCompra,
  actualizarFuncion,
  actualizarFuncionRol,
  actualizarProveedor,
  actualizarRol,
  actualizarRolUsuario,
  actualizarUsuario,
  agregarDetalleCompra,
  confirmarCompra,
  crearCompra,
  crearFuncion,
  crearFuncionRol,
  crearProveedor,
  crearRol,
  crearRolUsuario,
  crearUsuario,
  eliminarCompra,
  eliminarDetalleCompra,
  eliminarFuncion,
  eliminarFuncionRol,
  eliminarProveedor,
  eliminarRol,
  eliminarRolUsuario,
  eliminarUsuario,
  listarCompras,
  listarFunciones,
  listarFuncionesRoles,
  listarProductos,
  listarProveedores,
  listarRoles,
  listarRolesUsuarios,
  listarUsuarios,
  obtenerCompra,
} from './api.js';

const opcionesDe = (...valores) => valores.map((valor) => ({ valor, etiqueta: valor }));

const OPCIONES_ESTADO = opcionesDe('ACT', 'INA');
const OPCIONES_ESTADO_PROVEEDOR = opcionesDe('Activo', 'Inactivo');
const OPCIONES_ESTADO_COMPRA = opcionesDe('Borrador', 'Confirmada', 'Anulada');
const OPCIONES_ESTADO_ASIGNACION = [
  { valor: '', etiqueta: 'Sin estado (se considera activo)' },
  ...OPCIONES_ESTADO,
];

const clavePor = (nombre) => (registro) => ({ [nombre]: registro[nombre] });

const formularioInicial = (campos) =>
  Object.fromEntries(campos.map((campo) => [campo.nombre, campo.valorInicial ?? '']));

const textoOpcion = (opciones = [], valor) => {
  if (valor === undefined || valor === null || valor === '') return '—';
  const encontrada = opciones.find((opcion) => String(opcion.valor) === String(valor));
  return encontrada?.etiqueta || String(valor);
};

const formatearFecha = (valor) => {
  if (!valor) return '—';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return String(valor);
  return new Intl.DateTimeFormat('es-HN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(fecha);
};

const normalizarValor = (definicion, valor) => {
  if (valor === undefined || valor === null) return '';
  if (definicion.tipo === 'datetime-local') {
    const fecha = new Date(valor);
    if (!Number.isNaN(fecha.getTime())) {
      const local = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
      return local.toISOString().slice(0, 16);
    }
  }
  if (definicion.tipo === 'date') return String(valor).slice(0, 10);
  return String(valor);
};

const prepararValor = (definicion, valor) => {
  if (valor === undefined || valor === null || valor === '') return undefined;
  if (definicion.tipo === 'number') return Number(valor);
  if (definicion.tipo === 'datetime-local') {
    const fecha = new Date(valor);
    if (!Number.isNaN(fecha.getTime())) return fecha.toISOString();
  }
  return valor;
};

const prepararCuerpo = (campos, formulario, { crear }) => {
  const cuerpo = {};
  campos.forEach((campo) => {
    if (campo.auto || (crear && campo.soloEdicion) || (!crear && campo.soloCrear)) return;
    const valor = prepararValor(campo, formulario[campo.nombre]);
    if (valor !== undefined) cuerpo[campo.nombre] = valor;
  });
  return cuerpo;
};

function EtiquetaEstado({ valor }) {
  if (!valor) return <span className="estado neutro">—</span>;
  const activo = ['ACT', 'Activo', 'Borrador'].includes(valor);
  return <span className={`estado ${activo ? 'activo' : 'inactivo'}`}>{valor}</span>;
}

function CampoFormulario({ definicion, valor, onChange, opciones = [], deshabilitado = false, prefijo = 'campo' }) {
  const id = `${prefijo}-${definicion.nombre}`;
  const comun = {
    id,
    name: definicion.nombre,
    value: valor,
    onChange: (evento) => onChange(definicion.nombre, evento.target.value),
    disabled: deshabilitado,
    required: Boolean(definicion.requerido) && !deshabilitado,
    maxLength: definicion.maxLength,
    min: definicion.min,
    step: definicion.step,
    placeholder: definicion.placeholder,
    autoComplete: definicion.autoComplete,
  };

  return (
    <div className="campo">
      <label htmlFor={id}>{definicion.etiqueta}</label>
      {definicion.tipo === 'select' ? (
        <select {...comun}>
          <option value="">{definicion.placeholder || 'Selecciona una opción'}</option>
          {opciones.map((opcion) => (
            <option key={String(opcion.valor)} value={opcion.valor}>
              {opcion.etiqueta}
            </option>
          ))}
        </select>
      ) : definicion.tipo === 'textarea' ? (
        <textarea {...comun} rows={3} />
      ) : (
        <input {...comun} type={definicion.tipo || 'text'} />
      )}
      {definicion.ayuda && <small className="ayuda-campo">{definicion.ayuda}</small>}
    </div>
  );
}

function CrudModulo({
  titulo,
  descripcion,
  servicio,
  campos,
  columnas,
  clave,
  nombreRegistro = 'Registro',
  genero = 'masculino',
  inicial,
  filtros = [],
  acciones = [],
  cargarOpciones,
  transformar,
  puedeEditar,
  puedeEliminar,
  etiquetaRegistro,
  refresco = 0,
}) {
  const valoresFiltroIniciales = useMemo(
    () => Object.fromEntries(filtros.map((filtro) => [filtro.nombre, filtro.valorInicial ?? ''])),
    [filtros],
  );
  const [filtrosActuales, setFiltrosActuales] = useState(valoresFiltroIniciales);
  const [registros, setRegistros] = useState([]);
  const [opciones, setOpciones] = useState({});
  const [formulario, setFormulario] = useState(inicial ?? formularioInicial(campos));
  const [editando, setEditando] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const cargar = useCallback(
    async (parametros) => {
      setCargando(true);
      setError('');
      try {
        const respuesta = await servicio.listar(parametros || {});
        const opcionesRespuesta = cargarOpciones ? await cargarOpciones() : {};
        const lista = transformar ? transformar(respuesta, opcionesRespuesta) : respuesta;
        setRegistros(Array.isArray(lista) ? lista : []);
        setOpciones(opcionesRespuesta || {});
      } catch (err) {
        setError(err.message);
        setRegistros([]);
      } finally {
        setCargando(false);
      }
    },
    [servicio, cargarOpciones, transformar],
  );

  useEffect(() => {
    cargar(filtrosActuales);
  }, [cargar, filtrosActuales, refresco]);

  const cambiarCampo = (nombre, valor) => setFormulario((actual) => ({ ...actual, [nombre]: valor }));

  const nuevo = () => {
    setEditando(null);
    setFormulario(inicial ?? formularioInicial(campos));
    setError('');
    setAviso('');
  };

  const editar = (registro) => {
    setEditando(clave(registro));
    setFormulario(
      Object.fromEntries(
        campos.map((campo) => [
          campo.nombre,
          campo.soloCrear ? '' : normalizarValor(campo, registro[campo.nombre]),
        ]),
      ),
    );
    setError('');
    setAviso('');
  };

  const guardar = async (evento) => {
    evento.preventDefault();
    setProcesando(true);
    setError('');
    setAviso('');
    try {
      const cuerpo = prepararCuerpo(campos, formulario, { crear: !editando });
      if (editando) await servicio.actualizar(editando, cuerpo);
      else await servicio.crear(cuerpo);
      setAviso(editando ? 'Registro actualizado correctamente.' : 'Registro creado correctamente.');
      setFormulario(inicial ?? formularioInicial(campos));
      setEditando(null);
      await cargar(filtrosActuales);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(false);
    }
  };

  const eliminar = async (registro) => {
    const nombre = etiquetaRegistro ? etiquetaRegistro(registro) : nombreRegistro;
    if (!window.confirm(`¿Eliminar ${nombre}? Esta acción no se puede deshacer.`)) return;
    setProcesando(true);
    setError('');
    setAviso('');
    try {
      const claveRegistro = clave(registro);
      await servicio.eliminar(claveRegistro);
      if (editando && JSON.stringify(editando) === JSON.stringify(claveRegistro)) nuevo();
      setAviso('Registro eliminado correctamente.');
      await cargar(filtrosActuales);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(false);
    }
  };

  const ejecutarAccion = async (accion, registro) => {
    if (accion.confirmar && !window.confirm(accion.confirmar(registro))) return;
    if (!accion.ejecutar) return;
    setProcesando(true);
    setError('');
    setAviso('');
    try {
      const mensaje = await accion.ejecutar(registro);
      if (typeof mensaje === 'string') setAviso(mensaje);
      await cargar(filtrosActuales);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(false);
    }
  };

  const valorCelda = (columna, registro) => {
    const valor = typeof columna.clave === 'function' ? columna.clave(registro) : registro[columna.clave];
    if (columna.formato) return columna.formato(valor, registro);
    return valor === undefined || valor === null || valor === '' ? '—' : String(valor);
  };

  return (
    <article className="tarjeta modulo-tarjeta">
      <header className="modulo-cabecera">
        <div>
          <h2>{titulo}</h2>
          <p>{descripcion}</p>
        </div>
        <button type="button" className="boton secundario" onClick={nuevo}>
          {genero === 'femenino' ? 'Nueva' : 'Nuevo'} {nombreRegistro}
        </button>
      </header>

      {aviso && <p className="aviso">{aviso}</p>}
      {error && <p className="error">{error}</p>}

      {filtros.length > 0 && (
        <div className="filtros">
          {filtros.map((filtro) => (
            <CampoFormulario
              key={filtro.nombre}
              prefijo={`filtro-${filtro.nombre}`}
              definicion={{ ...filtro, requerido: false }}
              valor={filtrosActuales[filtro.nombre] ?? ''}
              opciones={opciones[filtro.opcionesKey] ?? filtro.opciones ?? []}
              onChange={(nombre, valor) =>
                setFiltrosActuales((actual) => ({ ...actual, [nombre]: valor }))
              }
            />
          ))}
          <button
            type="button"
            className="boton enlace-boton"
            onClick={() => setFiltrosActuales(valoresFiltroIniciales)}
          >
            Limpiar filtros
          </button>
        </div>
      )}

      <div className="tabla-wrap">
        <table>
          <thead>
            <tr>
              {columnas.map((columna) => (
                <th key={columna.titulo} scope="col">{columna.titulo}</th>
              ))}
              <th scope="col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={columnas.length + 1} className="fila-vacia">Cargando…</td></tr>
            ) : registros.length === 0 ? (
              <tr><td colSpan={columnas.length + 1} className="fila-vacia">No hay registros para mostrar.</td></tr>
            ) : (
              registros.map((registro, indice) => (
                <tr key={clave(registro) && Object.values(clave(registro)).join('-') || indice}>
                  {columnas.map((columna) => (
                    <td key={columna.titulo}>{valorCelda(columna, registro)}</td>
                  ))}
                  <td className="acciones-tabla">
                    {acciones
                      .filter((accion) => !accion.visible || accion.visible(registro))
                      .map((accion) => (
                        <button
                          key={accion.etiqueta}
                          type="button"
                          className="boton enlinea"
                          disabled={procesando}
                          onClick={() => ejecutarAccion(accion, registro)}
                        >
                          {accion.etiqueta}
                        </button>
                      ))}
                    {(!puedeEditar || puedeEditar(registro)) && (
                      <button
                        type="button"
                        className="boton enlinea"
                        disabled={procesando}
                        onClick={() => editar(registro)}
                      >
                        Editar
                      </button>
                    )}
                    {(!puedeEliminar || puedeEliminar(registro)) && (
                      <button
                        type="button"
                        className="boton enlinea peligro"
                        disabled={procesando}
                        onClick={() => eliminar(registro)}
                      >
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <form className="formulario-crud" onSubmit={guardar}>
        <h3>
          {editando
            ? `Editar ${nombreRegistro}`
            : `${genero === 'femenino' ? 'Nueva' : 'Nuevo'} ${nombreRegistro}`}
        </h3>
        <div className="grid-formulario">
          {campos
            .filter((campo) => !(editando && campo.soloCrear))
            .map((campo) => (
              <CampoFormulario
                key={campo.nombre}
                definicion={campo}
                valor={formulario[campo.nombre] ?? ''}
                opciones={opciones[campo.opcionesKey] ?? campo.opciones ?? []}
                onChange={cambiarCampo}
              />
            ))}
        </div>
        <div className="acciones-formulario">
          {editando && (
            <button type="button" className="boton secundario" onClick={nuevo}>
              Cancelar
            </button>
          )}
          <button type="submit" className="boton primario" disabled={procesando}>
            {procesando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear registro'}
          </button>
        </div>
      </form>
    </article>
  );
}

/* ACCESO */

const CAMPOS_USUARIOS = [
  { nombre: 'useremail', etiqueta: 'Correo electrónico', tipo: 'email', requerido: true, maxLength: 80 },
  { nombre: 'username', etiqueta: 'Nombre de usuario', tipo: 'text', requerido: true, maxLength: 80 },
  {
    nombre: 'userpswd',
    etiqueta: 'Contraseña',
    tipo: 'password',
    requerido: true,
    soloCrear: true,
    maxLength: 128,
    autoComplete: 'new-password',
    ayuda: 'Mínimo 8 caracteres, una mayúscula, un número y un símbolo.',
  },
  { nombre: 'userpswdest', etiqueta: 'Estado de la contraseña', tipo: 'select', requerido: true, opciones: OPCIONES_ESTADO, valorInicial: 'ACT' },
  { nombre: 'userest', etiqueta: 'Estado del usuario', tipo: 'select', requerido: true, opciones: OPCIONES_ESTADO, valorInicial: 'ACT' },
  { nombre: 'usertipo', etiqueta: 'Tipo de usuario', tipo: 'select', requerido: true, opciones: opcionesDe('PLB', 'ADM', 'AUD'), valorInicial: 'PLB' },
  { nombre: 'useractcod', etiqueta: 'Código de activación', tipo: 'text', maxLength: 128 },
];

const COLUMNAS_USUARIOS = [
  { titulo: 'ID', clave: 'usercod' },
  { titulo: 'Usuario', clave: 'username' },
  { titulo: 'Correo', clave: 'useremail' },
  { titulo: 'Tipo', clave: 'usertipo' },
  { titulo: 'Estado', clave: 'userest', formato: (valor) => <EtiquetaEstado valor={valor} /> },
  { titulo: 'Contraseña', clave: 'userpswdest', formato: (valor) => <EtiquetaEstado valor={valor} /> },
];

const SERVICIO_USUARIOS = {
  listar: listarUsuarios,
  crear: crearUsuario,
  actualizar: (clave, datos) => actualizarUsuario(clave.id, datos),
  eliminar: (clave) => eliminarUsuario(clave.id),
};

const CAMPOS_ROLES = [
  { nombre: 'rolescod', etiqueta: 'Código del rol', tipo: 'text', requerido: true, maxLength: 15 },
  { nombre: 'rolesdsc', etiqueta: 'Descripción', tipo: 'text', requerido: true, maxLength: 45 },
  { nombre: 'rolesest', etiqueta: 'Estado', tipo: 'select', requerido: true, opciones: OPCIONES_ESTADO, valorInicial: 'ACT' },
];

const COLUMNAS_ROLES = [
  { titulo: 'Código', clave: 'rolescod' },
  { titulo: 'Descripción', clave: 'rolesdsc' },
  { titulo: 'Estado', clave: 'rolesest', formato: (valor) => <EtiquetaEstado valor={valor} /> },
];

const SERVICIO_ROLES = {
  listar: listarRoles,
  crear: crearRol,
  actualizar: (clave, datos) => actualizarRol(clave.rolescod, datos),
  eliminar: (clave) => eliminarRol(clave.rolescod),
};

export function UsuariosModulo() {
  return (
    <CrudModulo
      titulo="Usuarios"
      descripcion="Administra las cuentas, el estado y el tipo de usuario."
      servicio={SERVICIO_USUARIOS}
      campos={CAMPOS_USUARIOS}
      columnas={COLUMNAS_USUARIOS}
      clave={clavePor('usercod')}
      nombreRegistro="usuario"
      inicial={formularioInicial(CAMPOS_USUARIOS)}
      etiquetaRegistro={(registro) => `el usuario ${registro.username}`}
    />
  );
}

export function RolesModulo() {
  return (
    <CrudModulo
      titulo="Roles"
      descripcion="Define los perfiles que se pueden asignar a los usuarios."
      servicio={SERVICIO_ROLES}
      campos={CAMPOS_ROLES}
      columnas={COLUMNAS_ROLES}
      clave={clavePor('rolescod')}
      nombreRegistro="rol"
      inicial={formularioInicial(CAMPOS_ROLES)}
      etiquetaRegistro={(registro) => `el rol ${registro.rolescod}`}
    />
  );
}

/* PERMISOS */

const CAMPOS_FUNCIONES = [
  { nombre: 'fncod', etiqueta: 'Código de la función', tipo: 'text', requerido: true, maxLength: 255 },
  { nombre: 'fndsc', etiqueta: 'Descripción', tipo: 'text', requerido: true, maxLength: 45 },
  { nombre: 'fntyp', etiqueta: 'Tipo', tipo: 'text', requerido: true, maxLength: 3 },
  { nombre: 'fnest', etiqueta: 'Estado', tipo: 'select', requerido: true, opciones: OPCIONES_ESTADO, valorInicial: 'ACT' },
];

const COLUMNAS_FUNCIONES = [
  { titulo: 'Código', clave: 'fncod' },
  { titulo: 'Descripción', clave: 'fndsc' },
  { titulo: 'Tipo', clave: 'fntyp' },
  { titulo: 'Estado', clave: 'fnest', formato: (valor) => <EtiquetaEstado valor={valor} /> },
];

const SERVICIO_FUNCIONES = {
  listar: listarFunciones,
  crear: crearFuncion,
  actualizar: (clave, datos) => actualizarFuncion(clave.fncod, datos),
  eliminar: (clave) => eliminarFuncion(clave.fncod),
};

const CAMPOS_ROLES_USUARIOS = [
  { nombre: 'usercod', etiqueta: 'Usuario', tipo: 'select', requerido: true, opcionesKey: 'usercod' },
  { nombre: 'rolescod', etiqueta: 'Rol', tipo: 'select', requerido: true, opcionesKey: 'rolescod' },
  { nombre: 'roleuserest', etiqueta: 'Estado de la asignación', tipo: 'select', opciones: OPCIONES_ESTADO_ASIGNACION },
  { nombre: 'roleuserfch', etiqueta: 'Fecha de asignación', tipo: 'datetime-local' },
  { nombre: 'roleuserexp', etiqueta: 'Fecha de expiración', tipo: 'datetime-local' },
];

const COLUMNAS_ROLES_USUARIOS = [
  { titulo: 'Usuario', clave: 'usuario' },
  { titulo: 'Rol', clave: 'rol' },
  { titulo: 'Estado', clave: 'roleuserest', formato: (valor) => <EtiquetaEstado valor={valor} /> },
  { titulo: 'Asignado', clave: 'roleuserfch', formato: formatearFecha },
  { titulo: 'Expira', clave: 'roleuserexp', formato: formatearFecha },
];

const SERVICIO_ROLES_USUARIOS = {
  listar: listarRolesUsuarios,
  crear: crearRolUsuario,
  actualizar: (clave, datos) => actualizarRolUsuario(clave, datos),
  eliminar: (clave) => eliminarRolUsuario(clave),
};

const claveRolUsuario = (registro) => ({ usercod: registro.usercod, rolescod: registro.rolescod });

const cargarOpcionesRolesUsuarios = async () => {
  const [usuarios, roles] = await Promise.all([listarUsuarios(), listarRoles()]);
  return {
    usercod: usuarios.map((usuario) => ({
      valor: usuario.usercod,
      etiqueta: `${usuario.username} · ${usuario.useremail}`,
    })),
    rolescod: roles.map((rol) => ({ valor: rol.rolescod, etiqueta: `${rol.rolescod} · ${rol.rolesdsc}` })),
  };
};

const transformarRolesUsuarios = (registros, opciones) =>
  (registros || []).map((registro) => ({
    ...registro,
    usuario: textoOpcion(opciones.usercod, registro.usercod),
    rol: textoOpcion(opciones.rolescod, registro.rolescod),
  }));

const CAMPOS_FUNCIONES_ROLES = [
  { nombre: 'rolescod', etiqueta: 'Rol', tipo: 'select', requerido: true, opcionesKey: 'rolescod' },
  { nombre: 'fncod', etiqueta: 'Función', tipo: 'select', requerido: true, opcionesKey: 'fncod' },
  { nombre: 'fnrolest', etiqueta: 'Estado de la asignación', tipo: 'select', opciones: OPCIONES_ESTADO_ASIGNACION },
  { nombre: 'fnexp', etiqueta: 'Fecha de expiración', tipo: 'datetime-local' },
];

const COLUMNAS_FUNCIONES_ROLES = [
  { titulo: 'Rol', clave: 'rol' },
  { titulo: 'Función', clave: 'funcion' },
  { titulo: 'Estado', clave: 'fnrolest', formato: (valor) => <EtiquetaEstado valor={valor} /> },
  { titulo: 'Expira', clave: 'fnexp', formato: formatearFecha },
];

const SERVICIO_FUNCIONES_ROLES = {
  listar: listarFuncionesRoles,
  crear: crearFuncionRol,
  actualizar: (clave, datos) => actualizarFuncionRol(clave, datos),
  eliminar: (clave) => eliminarFuncionRol(clave),
};

const claveFuncionRol = (registro) => ({ rolescod: registro.rolescod, fncod: registro.fncod });

const cargarOpcionesFuncionesRoles = async () => {
  const [roles, funciones] = await Promise.all([listarRoles(), listarFunciones()]);
  return {
    rolescod: roles.map((rol) => ({ valor: rol.rolescod, etiqueta: `${rol.rolescod} · ${rol.rolesdsc}` })),
    fncod: funciones.map((funcion) => ({
      valor: funcion.fncod,
      etiqueta: `${funcion.fncod} · ${funcion.fndsc}`,
    })),
  };
};

const transformarFuncionesRoles = (registros, opciones) =>
  (registros || []).map((registro) => ({
    ...registro,
    rol: textoOpcion(opciones.rolescod, registro.rolescod),
    funcion: textoOpcion(opciones.fncod, registro.fncod),
  }));

export function FuncionesModulo() {
  return (
    <CrudModulo
      titulo="Funciones"
      descripcion="Registra las acciones que pueden otorgarse a los roles."
      servicio={SERVICIO_FUNCIONES}
      campos={CAMPOS_FUNCIONES}
      columnas={COLUMNAS_FUNCIONES}
      clave={clavePor('fncod')}
      nombreRegistro="función"
      genero="femenino"
      inicial={formularioInicial(CAMPOS_FUNCIONES)}
      etiquetaRegistro={(registro) => `la función ${registro.fncod}`}
    />
  );
}

export function RolesUsuariosModulo() {
  return (
    <CrudModulo
      titulo="Roles por usuario"
      descripcion="Asigna roles a los usuarios y controla su vigencia."
      servicio={SERVICIO_ROLES_USUARIOS}
      campos={CAMPOS_ROLES_USUARIOS}
      columnas={COLUMNAS_ROLES_USUARIOS}
      clave={claveRolUsuario}
      nombreRegistro="asignación"
      genero="femenino"
      inicial={formularioInicial(CAMPOS_ROLES_USUARIOS)}
      cargarOpciones={cargarOpcionesRolesUsuarios}
      transformar={transformarRolesUsuarios}
      etiquetaRegistro={(registro) => `la asignación de ${registro.rolescod} al usuario ${registro.usercod}`}
    />
  );
}

export function FuncionesRolesModulo() {
  return (
    <CrudModulo
      titulo="Funciones por rol"
      descripcion="Asigna funciones a cada rol para construir los permisos del sistema."
      servicio={SERVICIO_FUNCIONES_ROLES}
      campos={CAMPOS_FUNCIONES_ROLES}
      columnas={COLUMNAS_FUNCIONES_ROLES}
      clave={claveFuncionRol}
      nombreRegistro="asignación"
      genero="femenino"
      inicial={formularioInicial(CAMPOS_FUNCIONES_ROLES)}
      cargarOpciones={cargarOpcionesFuncionesRoles}
      transformar={transformarFuncionesRoles}
      etiquetaRegistro={(registro) => `la asignación de ${registro.fncod} al rol ${registro.rolescod}`}
    />
  );
}

/* RED DE SUMINISTRO */

const CAMPOS_PROVEEDORES = [
  { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'text', requerido: true, maxLength: 120 },
  { nombre: 'contacto', etiqueta: 'Contacto', tipo: 'text', maxLength: 120 },
  { nombre: 'telefono', etiqueta: 'Teléfono', tipo: 'text', maxLength: 20 },
  { nombre: 'correo', etiqueta: 'Correo electrónico', tipo: 'email', maxLength: 120 },
  { nombre: 'direccion', etiqueta: 'Dirección', tipo: 'text', maxLength: 255 },
  { nombre: 'estado', etiqueta: 'Estado', tipo: 'select', opciones: OPCIONES_ESTADO_PROVEEDOR, valorInicial: 'Activo' },
];

const FILTROS_PROVEEDORES = [
  { nombre: 'estado', etiqueta: 'Estado', tipo: 'select', opciones: OPCIONES_ESTADO_PROVEEDOR },
];

const COLUMNAS_PROVEEDORES = [
  { titulo: 'ID', clave: 'id_proveedor' },
  { titulo: 'Nombre', clave: 'nombre' },
  { titulo: 'Contacto', clave: 'contacto' },
  { titulo: 'Teléfono', clave: 'telefono' },
  { titulo: 'Correo', clave: 'correo' },
  { titulo: 'Dirección', clave: 'direccion' },
  { titulo: 'Estado', clave: 'estado', formato: (valor) => <EtiquetaEstado valor={valor} /> },
];

const SERVICIO_PROVEEDORES = {
  listar: listarProveedores,
  crear: crearProveedor,
  actualizar: (clave, datos) => actualizarProveedor(clave.id, datos),
  eliminar: (clave) => eliminarProveedor(clave.id),
};

export function ProveedoresModulo() {
  return (
    <CrudModulo
      titulo="Proveedores"
      descripcion="Organiza la información de los proveedores de la repostería."
      servicio={SERVICIO_PROVEEDORES}
      campos={CAMPOS_PROVEEDORES}
      columnas={COLUMNAS_PROVEEDORES}
      clave={clavePor('id_proveedor')}
      nombreRegistro="proveedor"
      inicial={formularioInicial(CAMPOS_PROVEEDORES)}
      filtros={FILTROS_PROVEEDORES}
      etiquetaRegistro={(registro) => `el proveedor ${registro.nombre}`}
    />
  );
}

/* ABASTECIMIENTO */

const CAMPOS_COMPRAS = [
  {
    nombre: 'id_proveedor',
    etiqueta: 'Proveedor',
    tipo: 'select',
    requerido: true,
    opcionesKey: 'id_proveedor',
    ayuda: 'Solo se pueden usar proveedores activos.',
  },
  { nombre: 'numero_factura', etiqueta: 'Número de factura', tipo: 'text', requerido: true, maxLength: 50 },
  {
    nombre: 'fecha',
    etiqueta: 'Fecha',
    tipo: 'datetime-local',
    ayuda: 'Si se deja vacío, el backend registra la fecha actual.',
  },
];

const FILTROS_COMPRAS = [
  { nombre: 'estado', etiqueta: 'Estado', tipo: 'select', opciones: OPCIONES_ESTADO_COMPRA },
  { nombre: 'id_proveedor', etiqueta: 'Proveedor', tipo: 'select', opcionesKey: 'id_proveedor' },
];

const COLUMNAS_COMPRAS = [
  { titulo: 'ID', clave: 'id_compra' },
  { titulo: 'Proveedor', clave: 'proveedorNombre' },
  { titulo: 'Factura', clave: 'numero_factura' },
  { titulo: 'Fecha', clave: 'fecha', formato: formatearFecha },
  { titulo: 'Total', clave: 'total' },
  { titulo: 'Estado', clave: 'estado', formato: (valor) => <EtiquetaEstado valor={valor} /> },
];

const SERVICIO_COMPRAS = {
  listar: listarCompras,
  crear: crearCompra,
  actualizar: (clave, datos) => actualizarCompra(clave.id, datos),
  eliminar: (clave) => eliminarCompra(clave.id),
};

const cargarOpcionesCompras = async () => {
  const proveedores = await listarProveedores({ estado: 'Activo' });
  return {
    id_proveedor: (proveedores || []).map((proveedor) => ({
      valor: proveedor.id_proveedor,
      etiqueta: proveedor.nombre,
    })),
  };
};

const transformarCompras = (registros, opciones) =>
  (registros || []).map((compra) => ({
    ...compra,
    proveedorNombre: compra.proveedor?.nombre || textoOpcion(opciones.id_proveedor, compra.id_proveedor),
  }));

const soloBorrador = (compra) => compra.estado === 'Borrador';

export function ComprasModulo() {
  const [detalle, setDetalle] = useState(null);
  const [productos, setProductos] = useState([]);
  const [nuevoDetalle, setNuevoDetalle] = useState({ id_producto: '', cantidad: '1', costo_unitario: '' });
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState('');
  const [avisoDetalle, setAvisoDetalle] = useState('');
  const [refresco, setRefresco] = useState(0);

  useEffect(() => {
    listarProductos()
      .then((respuesta) => setProductos(Array.isArray(respuesta) ? respuesta : []))
      .catch((err) => setErrorDetalle(err.message));
  }, []);

  const opcionesProductos = useMemo(
    () =>
      productos.map((producto) => ({
        valor: producto.id_producto,
        etiqueta: `${producto.nombre} · stock ${producto.stock}`,
      })),
    [productos],
  );

  const recargarDetalle = useCallback(async (id) => {
    const respuesta = await obtenerCompra(id);
    setDetalle(respuesta);
    setRefresco((valor) => valor + 1);
  }, []);

  const acciones = useMemo(
    () => [
      {
        etiqueta: 'Ver detalle',
        ejecutar: async (compra) => {
          setCargandoDetalle(true);
          setErrorDetalle('');
          setAvisoDetalle('');
          try {
            setDetalle(await obtenerCompra(compra.id_compra));
          } catch (err) {
            setErrorDetalle(err.message);
            throw err;
          } finally {
            setCargandoDetalle(false);
          }
        },
      },
      {
        etiqueta: 'Confirmar',
        visible: soloBorrador,
        confirmar: (compra) =>
          `¿Confirmar la compra ${compra.numero_factura}? Se actualizará el inventario y se enviará un correo al proveedor.`,
        ejecutar: async (compra) => {
          const respuesta = await confirmarCompra(compra.id_compra);
          if (detalle?.id_compra === compra.id_compra) await recargarDetalle(compra.id_compra);
          return respuesta.message;
        },
      },
    ],
    [detalle, recargarDetalle],
  );

  const cambiarDetalle = (nombre, valor) =>
    setNuevoDetalle((actual) => ({ ...actual, [nombre]: valor }));

  const agregarProducto = async (evento) => {
    evento.preventDefault();
    if (!detalle) return;
    const cantidad = Number(nuevoDetalle.cantidad);
    const costo = Number(nuevoDetalle.costo_unitario);
    if (!nuevoDetalle.id_producto || !Number.isInteger(cantidad) || cantidad < 1 || !(costo > 0)) {
      setErrorDetalle('Selecciona un producto, una cantidad entera mayor a cero y un costo válido.');
      return;
    }
    setCargandoDetalle(true);
    setErrorDetalle('');
    setAvisoDetalle('');
    try {
      await agregarDetalleCompra(detalle.id_compra, {
        id_producto: Number(nuevoDetalle.id_producto),
        cantidad,
        costo_unitario: costo,
      });
      await recargarDetalle(detalle.id_compra);
      setNuevoDetalle({ id_producto: '', cantidad: '1', costo_unitario: '' });
      setAvisoDetalle('Producto agregado. El backend recalculó los totales de la compra.');
    } catch (err) {
      setErrorDetalle(err.message);
    } finally {
      setCargandoDetalle(false);
    }
  };

  const quitarProducto = async (item) => {
    if (!window.confirm(`¿Quitar ${item.producto || `el producto ${item.id_producto}`} de esta compra?`)) return;
    setCargandoDetalle(true);
    setErrorDetalle('');
    setAvisoDetalle('');
    try {
      await eliminarDetalleCompra(detalle.id_compra, item.id_detalle_compra);
      await recargarDetalle(detalle.id_compra);
      setAvisoDetalle('Producto eliminado. El backend recalculó los totales de la compra.');
    } catch (err) {
      setErrorDetalle(err.message);
    } finally {
      setCargandoDetalle(false);
    }
  };

  const confirmarDetalle = async () => {
    if (!window.confirm('¿Confirmar esta compra? El inventario se actualizará y se enviará un correo al proveedor.')) return;
    setCargandoDetalle(true);
    setErrorDetalle('');
    setAvisoDetalle('');
    try {
      const respuesta = await confirmarCompra(detalle.id_compra);
      await recargarDetalle(detalle.id_compra);
      setAvisoDetalle(respuesta.message);
    } catch (err) {
      setErrorDetalle(err.message);
    } finally {
      setCargandoDetalle(false);
    }
  };

  return (
    <>
      <CrudModulo
        titulo="Compras"
        descripcion="Registra compras a proveedores, administra sus productos y confirma el abastecimiento."
        servicio={SERVICIO_COMPRAS}
        campos={CAMPOS_COMPRAS}
        columnas={COLUMNAS_COMPRAS}
        clave={clavePor('id_compra')}
        nombreRegistro="compra"
        genero="femenino"
        inicial={formularioInicial(CAMPOS_COMPRAS)}
        filtros={FILTROS_COMPRAS}
        cargarOpciones={cargarOpcionesCompras}
        transformar={transformarCompras}
        puedeEditar={soloBorrador}
        puedeEliminar={soloBorrador}
        acciones={acciones}
        etiquetaRegistro={(registro) => `la compra ${registro.numero_factura}`}
        refresco={refresco}
      />

      {detalle && (
        <article className="tarjeta modulo-tarjeta detalle-compra">
          <header className="modulo-cabecera">
            <div>
              <h3>Detalle de la compra #{detalle.id_compra}</h3>
              <p>
                {detalle.numero_factura} · {detalle.proveedor?.nombre || 'Proveedor no disponible'} ·{' '}
                {detalle.estado}
              </p>
            </div>
            <button type="button" className="boton secundario" onClick={() => setDetalle(null)}>
              Cerrar detalle
            </button>
          </header>

          {avisoDetalle && <p className="aviso">{avisoDetalle}</p>}
          {errorDetalle && <p className="error">{errorDetalle}</p>}

          <div className="totales-compra">
            <div><span>Subtotal</span><strong>{detalle.subtotal ?? '0.00'}</strong></div>
            <div><span>Impuesto</span><strong>{detalle.impuesto ?? '0.00'}</strong></div>
            <div><span>Total</span><strong>{detalle.total ?? '0.00'}</strong></div>
          </div>

          <div className="tabla-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Producto</th>
                  <th scope="col">Cantidad</th>
                  <th scope="col">Costo unitario</th>
                  <th scope="col">Subtotal</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {(detalle.detalles || []).length === 0 ? (
                  <tr><td colSpan={5} className="fila-vacia">Esta compra aún no tiene productos.</td></tr>
                ) : (
                  detalle.detalles.map((item) => (
                    <tr key={item.id_detalle_compra}>
                      <td>{item.producto || textoOpcion(opcionesProductos, item.id_producto)}</td>
                      <td>{item.cantidad}</td>
                      <td>{item.costo_unitario}</td>
                      <td>{item.subtotal}</td>
                      <td className="acciones-tabla">
                        <button
                          type="button"
                          className="boton enlinea peligro"
                          disabled={detalle.estado !== 'Borrador' || cargandoDetalle}
                          onClick={() => quitarProducto(item)}
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {soloBorrador(detalle) && (
            <form className="formulario-detalle" onSubmit={agregarProducto}>
              <h4>Agregar producto</h4>
              <div className="grid-formulario">
                <CampoFormulario
                  prefijo="detalle-producto"
                  definicion={{ nombre: 'id_producto', etiqueta: 'Producto', tipo: 'select', requerido: true }}
                  valor={nuevoDetalle.id_producto}
                  opciones={opcionesProductos}
                  onChange={cambiarDetalle}
                />
                <CampoFormulario
                  prefijo="detalle-cantidad"
                  definicion={{ nombre: 'cantidad', etiqueta: 'Cantidad', tipo: 'number', requerido: true, min: 1 }}
                  valor={nuevoDetalle.cantidad}
                  onChange={cambiarDetalle}
                />
                <CampoFormulario
                  prefijo="detalle-costo"
                  definicion={{ nombre: 'costo_unitario', etiqueta: 'Costo unitario', tipo: 'number', requerido: true, min: 0.01, step: '0.01' }}
                  valor={nuevoDetalle.costo_unitario}
                  onChange={cambiarDetalle}
                />
              </div>
              {opcionesProductos.length === 0 && (
                <p className="ayuda-campo">No hay productos activos disponibles en el catálogo.</p>
              )}
              <div className="acciones-formulario">
                <button type="submit" className="boton primario" disabled={cargandoDetalle}>
                  {cargandoDetalle ? 'Actualizando…' : 'Agregar producto'}
                </button>
                <button type="button" className="boton secundario" onClick={confirmarDetalle} disabled={cargandoDetalle}>
                  Confirmar compra
                </button>
              </div>
            </form>
          )}
        </article>
      )}
    </>
  );
}
