import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from 'react';
import {
  actualizarCompra,
  actualizarProveedor,
  agregarDetalleCompra,
  confirmarCompra,
  crearCompra,
  crearProveedor,
  eliminarCompra,
  eliminarDetalleCompra,
  eliminarProveedor,
  listarCompras,
  listarProductos,
  listarProveedores,
  mensajeError,
  obtenerCompra,
  type Compra,
  type Cuerpo,
  type DetalleCompra,
  type Filtros,
  type Producto,
  type Proveedor,
} from './api';

type EventoCampo = ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;

interface Opcion {
  valor: string | number;
  etiqueta: string;
}

interface DefinicionCampo {
  nombre: string;
  etiqueta: string;
  tipo?: string;
  requerido?: boolean;
  maxLength?: number;
  min?: number | string;
  step?: number | string;
  placeholder?: string;
  autoComplete?: string;
  ayuda?: string;
  opciones?: Opcion[];
  opcionesKey?: string;
  valorInicial?: string;
  auto?: boolean;
  soloCrear?: boolean;
  soloEdicion?: boolean;
}

interface ClaveRegistro {
  [clave: string]: unknown;
  id?: unknown;
}

interface Servicio<T> {
  listar: (filtros: Filtros) => Promise<T[]>;
  crear: (datos: Cuerpo) => Promise<unknown>;
  actualizar: (clave: ClaveRegistro, datos: Cuerpo) => Promise<unknown>;
  eliminar: (clave: ClaveRegistro) => Promise<unknown>;
}

interface Columna<T> {
  titulo: string;
  clave: keyof T | ((registro: T) => unknown);
  formato?: (valor: unknown, registro: T) => ReactNode;
}

interface Accion<T> {
  etiqueta: string;
  ejecutar?: (registro: T) => Promise<unknown>;
  confirmar?: (registro: T) => string;
  visible?: (registro: T) => boolean;
}

interface CrudModuloProps<T extends object> {
  titulo: string;
  descripcion: string;
  servicio: Servicio<T>;
  campos: DefinicionCampo[];
  columnas: Columna<T>[];
  clave: (registro: T) => ClaveRegistro;
  nombreRegistro?: string;
  genero?: 'masculino' | 'femenino';
  inicial?: Record<string, string>;
  filtros?: DefinicionCampo[];
  acciones?: Accion<T>[];
  cargarOpciones?: () => Promise<Record<string, Opcion[]>>;
  transformar?: (registros: T[], opciones: Record<string, Opcion[]>) => T[];
  puedeEditar?: (registro: T) => boolean;
  puedeEliminar?: (registro: T) => boolean;
  etiquetaRegistro?: (registro: T) => string;
  refresco?: number;
}

const opcionesDe = (...valores: Array<string | number>): Opcion[] =>
  valores.map((valor) => ({ valor, etiqueta: String(valor) }));

const OPCIONES_ESTADO_PROVEEDOR = opcionesDe('Activo', 'Inactivo');
const OPCIONES_ESTADO_COMPRA = opcionesDe('Borrador', 'Confirmada', 'Anulada');

const clavePor = <T extends object>(nombre: keyof T) => (registro: T): ClaveRegistro => ({
  [String(nombre)]: registro[nombre],
});

const valorDe = (registro: unknown, nombre: string): unknown =>
  typeof registro === 'object' && registro !== null
    ? (registro as Record<string, unknown>)[nombre]
    : undefined;

const formularioInicial = (campos: DefinicionCampo[]): Record<string, string> =>
  Object.fromEntries(campos.map((campo) => [campo.nombre, campo.valorInicial ?? ''])) as Record<string, string>;

const textoOpcion = (opciones: Opcion[] = [], valor: unknown): string => {
  if (valor === undefined || valor === null || valor === '') return '—';
  const encontrada = opciones.find((opcion) => String(opcion.valor) === String(valor));
  return encontrada?.etiqueta || String(valor);
};

const formatearFecha = (valor: unknown): string => {
  if (!valor) return '—';
  const fecha = new Date(String(valor));
  if (Number.isNaN(fecha.getTime())) return String(valor);
  return new Intl.DateTimeFormat('es-HN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(fecha);
};

const normalizarValor = (definicion: DefinicionCampo, valor: unknown): string => {
  if (valor === undefined || valor === null) return '';
  if (definicion.tipo === 'datetime-local') {
    const fecha = new Date(String(valor));
    if (!Number.isNaN(fecha.getTime())) {
      const local = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
      return local.toISOString().slice(0, 16);
    }
  }
  if (definicion.tipo === 'date') return String(valor).slice(0, 10);
  return String(valor);
};

const prepararValor = (definicion: DefinicionCampo, valor: string): unknown => {
  if (valor === undefined || valor === null || valor === '') return undefined;
  if (definicion.tipo === 'number') return Number(valor);
  if (definicion.tipo === 'datetime-local') {
    const fecha = new Date(valor);
    if (!Number.isNaN(fecha.getTime())) return fecha.toISOString();
  }
  return valor;
};

const prepararCuerpo = (
  campos: DefinicionCampo[],
  formulario: Record<string, string>,
  { crear }: { crear: boolean },
): Cuerpo => {
  const cuerpo: Cuerpo = {};
  campos.forEach((campo) => {
    if (campo.auto || (crear && campo.soloEdicion) || (!crear && campo.soloCrear)) return;
    const valor = prepararValor(campo, formulario[campo.nombre] ?? '');
    if (valor !== undefined) cuerpo[campo.nombre] = valor;
  });
  return cuerpo;
};

function EtiquetaEstado({ valor }: { valor: unknown }) {
  if (!valor) return <span className="estado neutro">—</span>;
  const activo = ['ACT', 'Activo', 'Borrador'].includes(String(valor));
  return <span className={`estado ${activo ? 'activo' : 'inactivo'}`}>{String(valor)}</span>;
}

interface CampoFormularioProps {
  definicion: DefinicionCampo;
  valor: string;
  onChange: (nombre: string, valor: string) => void;
  opciones?: Opcion[];
  deshabilitado?: boolean;
  prefijo?: string;
}

function CampoFormulario({
  definicion,
  valor,
  onChange,
  opciones = [],
  deshabilitado = false,
  prefijo = 'campo',
}: CampoFormularioProps) {
  const id = `${prefijo}-${definicion.nombre}`;
  const comun = {
    id,
    name: definicion.nombre,
    value: valor,
    onChange: (evento: EventoCampo) => onChange(definicion.nombre, evento.target.value),
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

function CrudModulo<T extends object>({
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
}: CrudModuloProps<T>) {
  const valoresFiltroIniciales = useMemo<Record<string, string>>(
    () => Object.fromEntries(filtros.map((filtro) => [filtro.nombre, filtro.valorInicial ?? ''])) as Record<string, string>,
    [filtros],
  );
  const [filtrosActuales, setFiltrosActuales] = useState<Record<string, string>>(valoresFiltroIniciales);
  const [registros, setRegistros] = useState<T[]>([]);
  const [opciones, setOpciones] = useState<Record<string, Opcion[]>>({});
  const [formulario, setFormulario] = useState<Record<string, string>>(
    () => inicial ?? formularioInicial(campos),
  );
  const [editando, setEditando] = useState<ClaveRegistro | null>(null);
  const [cargando, setCargando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const cargar = useCallback(
    async (parametros: Filtros = {}) => {
      setCargando(true);
      setError('');
      try {
        const respuesta = await servicio.listar(parametros);
        const opcionesRespuesta = cargarOpciones ? await cargarOpciones() : {};
        const lista = transformar ? transformar(respuesta, opcionesRespuesta) : respuesta;
        setRegistros(Array.isArray(lista) ? lista : []);
        setOpciones(opcionesRespuesta);
      } catch (err) {
        setError(mensajeError(err));
        setRegistros([]);
      } finally {
        setCargando(false);
      }
    },
    [servicio, cargarOpciones, transformar],
  );

  useEffect(() => {
    void cargar(filtrosActuales);
  }, [cargar, filtrosActuales, refresco]);

  const cambiarCampo = (nombre: string, valor: string) =>
    setFormulario((actual) => ({ ...actual, [nombre]: valor }));

  const nuevo = () => {
    setEditando(null);
    setFormulario(inicial ?? formularioInicial(campos));
    setError('');
    setAviso('');
  };

  const editar = (registro: T) => {
    setEditando(clave(registro));
    setFormulario(
      Object.fromEntries(
        campos.map((campo) => [
          campo.nombre,
          campo.soloCrear ? '' : normalizarValor(campo, valorDe(registro, campo.nombre)),
        ]),
      ) as Record<string, string>,
    );
    setError('');
    setAviso('');
  };

  const guardar = async (evento: FormEvent<HTMLFormElement>) => {
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
      setError(mensajeError(err));
    } finally {
      setProcesando(false);
    }
  };

  const eliminar = async (registro: T) => {
    const nombre = etiquetaRegistro?.(registro) ?? nombreRegistro;
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
      setError(mensajeError(err));
    } finally {
      setProcesando(false);
    }
  };

  const ejecutarAccion = async (accion: Accion<T>, registro: T) => {
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
      setError(mensajeError(err));
    } finally {
      setProcesando(false);
    }
  };

  const valorCelda = (columna: Columna<T>, registro: T): ReactNode => {
    const valor =
      typeof columna.clave === 'function' ? columna.clave(registro) : valorDe(registro, String(columna.clave));
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
              opciones={filtro.opcionesKey ? opciones[filtro.opcionesKey] ?? [] : filtro.opciones ?? []}
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
              registros.map((registro, indice) => {
                const id = clave(registro);
                return (
                  <tr key={Object.values(id).join('-') || indice}>
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
                            onClick={() => void ejecutarAccion(accion, registro)}
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
                          onClick={() => void eliminar(registro)}
                        >
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
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
                opciones={campo.opcionesKey ? opciones[campo.opcionesKey] ?? [] : campo.opciones ?? []}
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

/* RED DE SUMINISTRO */

const CAMPOS_PROVEEDORES: DefinicionCampo[] = [
  { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'text', requerido: true, maxLength: 120 },
  { nombre: 'contacto', etiqueta: 'Contacto', tipo: 'text', maxLength: 120 },
  { nombre: 'telefono', etiqueta: 'Teléfono', tipo: 'text', maxLength: 20 },
  { nombre: 'correo', etiqueta: 'Correo electrónico', tipo: 'email', maxLength: 120 },
  { nombre: 'direccion', etiqueta: 'Dirección', tipo: 'text', maxLength: 255 },
  {
    nombre: 'estado',
    etiqueta: 'Estado',
    tipo: 'select',
    opciones: OPCIONES_ESTADO_PROVEEDOR,
    valorInicial: 'Activo',
  },
];

const FILTROS_PROVEEDORES: DefinicionCampo[] = [
  { nombre: 'estado', etiqueta: 'Estado', tipo: 'select', opciones: OPCIONES_ESTADO_PROVEEDOR },
];

const COLUMNAS_PROVEEDORES: Columna<Proveedor>[] = [
  { titulo: 'ID', clave: 'id_proveedor' },
  { titulo: 'Nombre', clave: 'nombre' },
  { titulo: 'Contacto', clave: 'contacto' },
  { titulo: 'Teléfono', clave: 'telefono' },
  { titulo: 'Correo', clave: 'correo' },
  { titulo: 'Dirección', clave: 'direccion' },
  { titulo: 'Estado', clave: 'estado', formato: (valor) => <EtiquetaEstado valor={valor} /> },
];

const SERVICIO_PROVEEDORES: Servicio<Proveedor> = {
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

const CAMPOS_COMPRAS: DefinicionCampo[] = [
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

const FILTROS_COMPRAS: DefinicionCampo[] = [
  { nombre: 'estado', etiqueta: 'Estado', tipo: 'select', opciones: OPCIONES_ESTADO_COMPRA },
  { nombre: 'id_proveedor', etiqueta: 'Proveedor', tipo: 'select', opcionesKey: 'id_proveedor' },
];

const COLUMNAS_COMPRAS: Columna<Compra>[] = [
  { titulo: 'ID', clave: 'id_compra' },
  { titulo: 'Proveedor', clave: 'proveedorNombre' },
  { titulo: 'Factura', clave: 'numero_factura' },
  { titulo: 'Fecha', clave: 'fecha', formato: formatearFecha },
  { titulo: 'Total', clave: 'total' },
  { titulo: 'Estado', clave: 'estado', formato: (valor) => <EtiquetaEstado valor={valor} /> },
];

const SERVICIO_COMPRAS: Servicio<Compra> = {
  listar: listarCompras,
  crear: crearCompra,
  actualizar: (clave, datos) => actualizarCompra(clave.id, datos),
  eliminar: (clave) => eliminarCompra(clave.id),
};

const cargarOpcionesCompras = async (): Promise<Record<string, Opcion[]>> => {
  const proveedores = await listarProveedores({ estado: 'Activo' });
  return {
    id_proveedor: (proveedores ?? []).map((proveedor) => ({
      valor: proveedor.id_proveedor,
      etiqueta: proveedor.nombre,
    })),
  };
};

const transformarCompras = (
  registros: Compra[],
  opciones: Record<string, Opcion[]>,
): Compra[] =>
  (registros ?? []).map((compra) => ({
    ...compra,
    proveedorNombre: compra.proveedor?.nombre || textoOpcion(opciones.id_proveedor, compra.id_proveedor),
  }));

const soloBorrador = (compra: Compra): boolean => compra.estado === 'Borrador';

export function ComprasModulo() {
  const [detalle, setDetalle] = useState<Compra | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [nuevoDetalle, setNuevoDetalle] = useState({ id_producto: '', cantidad: '1', costo_unitario: '' });
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState('');
  const [avisoDetalle, setAvisoDetalle] = useState('');
  const [refresco, setRefresco] = useState(0);

  useEffect(() => {
    listarProductos()
      .then((respuesta) => setProductos(Array.isArray(respuesta) ? respuesta : []))
      .catch((err: unknown) => setErrorDetalle(mensajeError(err)));
  }, []);

  const opcionesProductos = useMemo<Opcion[]>(
    () =>
      productos.map((producto) => ({
        valor: producto.id_producto,
        etiqueta: `${producto.nombre} · stock ${producto.stock ?? 0}`,
      })),
    [productos],
  );

  const recargarDetalle = useCallback(async (id: unknown) => {
    const respuesta = await obtenerCompra(id);
    setDetalle(respuesta);
    setRefresco((valor) => valor + 1);
  }, []);

  const acciones = useMemo<Accion<Compra>[]>(
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
            setErrorDetalle(mensajeError(err));
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
          return respuesta.message ?? respuesta.mensaje ?? 'Compra confirmada.';
        },
      },
    ],
    [detalle, recargarDetalle],
  );

  const cambiarDetalle = (nombre: string, valor: string) =>
    setNuevoDetalle((actual) => ({ ...actual, [nombre]: valor }));

  const agregarProducto = async (evento: FormEvent<HTMLFormElement>) => {
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
      setErrorDetalle(mensajeError(err));
    } finally {
      setCargandoDetalle(false);
    }
  };

  const quitarProducto = async (item: DetalleCompra) => {
    if (!detalle) return;
    if (!window.confirm(`¿Quitar ${item.producto || `el producto ${item.id_producto}`} de esta compra?`)) return;
    setCargandoDetalle(true);
    setErrorDetalle('');
    setAvisoDetalle('');
    try {
      await eliminarDetalleCompra(detalle.id_compra, item.id_detalle_compra);
      await recargarDetalle(detalle.id_compra);
      setAvisoDetalle('Producto eliminado. El backend recalculó los totales de la compra.');
    } catch (err) {
      setErrorDetalle(mensajeError(err));
    } finally {
      setCargandoDetalle(false);
    }
  };

  const confirmarDetalle = async () => {
    if (!detalle) return;
    if (!window.confirm('¿Confirmar esta compra? El inventario se actualizará y se enviará un correo al proveedor.')) return;
    setCargandoDetalle(true);
    setErrorDetalle('');
    setAvisoDetalle('');
    try {
      const respuesta = await confirmarCompra(detalle.id_compra);
      await recargarDetalle(detalle.id_compra);
      setAvisoDetalle(respuesta.message ?? respuesta.mensaje ?? 'Compra confirmada.');
    } catch (err) {
      setErrorDetalle(mensajeError(err));
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
                {(detalle.detalles ?? []).length === 0 ? (
                  <tr><td colSpan={5} className="fila-vacia">Esta compra aún no tiene productos.</td></tr>
                ) : (
                  detalle.detalles?.map((item) => (
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
                          onClick={() => void quitarProducto(item)}
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
                <button type="button" className="boton secundario" onClick={() => void confirmarDetalle()} disabled={cargandoDetalle}>
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
