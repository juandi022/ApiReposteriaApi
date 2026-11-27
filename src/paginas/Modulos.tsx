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
  obtenerCompra,
} from '../api';
import type { Id, Opcion, Registro } from '../tipos';

type DatosFormulario = Record<string, string>;
type ClaveRegistro = Record<string, Id>;
type OpcionesPorCampo = Record<string, Opcion[]>;

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
  soloEdicion?: boolean;
  soloCrear?: boolean;
}

interface Columna {
  titulo: string;
  clave: string | ((registro: Registro) => unknown);
  formato?: (valor: unknown, registro: Registro) => ReactNode;
}

interface ServicioCrud {
  listar: (filtros: Record<string, unknown>) => Promise<unknown> | unknown;
  crear: (datos: Record<string, unknown>) => Promise<unknown> | unknown;
  actualizar: (clave: ClaveRegistro, datos: Record<string, unknown>) => Promise<unknown> | unknown;
  eliminar: (clave: ClaveRegistro) => Promise<unknown> | unknown;
}

interface AccionCrud {
  etiqueta: string;
  visible?: (registro: Registro) => boolean;
  confirmar?: (registro: Registro) => string;
  ejecutar?: (registro: Registro) => unknown | Promise<unknown>;
}

interface CrudModuloProps {
  titulo: string;
  descripcion: string;
  servicio: ServicioCrud;
  campos: DefinicionCampo[];
  columnas: Columna[];
  clave: (registro: Registro) => ClaveRegistro;
  nombreRegistro?: string;
  genero?: 'masculino' | 'femenino';
  inicial?: DatosFormulario;
  filtros?: DefinicionCampo[];
  acciones?: AccionCrud[];
  cargarOpciones?: () => Promise<OpcionesPorCampo> | OpcionesPorCampo;
  transformar?: (respuesta: unknown, opciones: OpcionesPorCampo) => unknown;
  puedeEditar?: (registro: Registro) => boolean;
  puedeEliminar?: (registro: Registro) => boolean;
  etiquetaRegistro?: (registro: Registro) => string;
  refresco?: number;
}

interface DetalleCompra extends Registro {
  id_compra?: unknown;
  numero_factura?: unknown;
  proveedor?: { nombre?: unknown };
  estado?: unknown;
  subtotal?: unknown;
  impuesto?: unknown;
  total?: unknown;
  detalles?: unknown;
}

const mensajeError = (err: unknown): string =>
  err instanceof Error ? err.message : 'No se pudo completar la solicitud.';

const texto = (valor: unknown, porDefecto = '—'): string =>
  valor === undefined || valor === null || valor === '' ? porDefecto : String(valor);

const aId = (valor: unknown): Id => {
  if (typeof valor === 'number') return valor;
  return valor === undefined || valor === null ? '' : String(valor);
};

const opcionesDe = (...valores: string[]): Opcion[] =>
  valores.map((valor) => ({ valor, etiqueta: valor }));

const OPCIONES_ESTADO_PROVEEDOR = opcionesDe('Activo', 'Inactivo');
const OPCIONES_ESTADO_COMPRA = opcionesDe('Borrador', 'Confirmada', 'Anulada');

const clavePor = (nombre: string) => (registro: Registro): ClaveRegistro => ({
  [nombre]: aId(registro[nombre]),
});

const formularioInicial = (campos: DefinicionCampo[]): DatosFormulario =>
  Object.fromEntries(campos.map((campo) => [campo.nombre, campo.valorInicial ?? '']));

const textoOpcion = (opciones: Opcion[] = [], valor: unknown): string => {
  if (valor === undefined || valor === null || valor === '') return '—';
  const encontrada = opciones.find((opcion) => String(opcion.valor) === String(valor));
  return encontrada?.etiqueta || String(valor);
};

const formatearFecha = (valor: unknown): string => {
  if (!valor) return '—';
  const fecha = valor instanceof Date ? valor : new Date(String(valor));
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
    const fecha = valor instanceof Date ? valor : new Date(String(valor));
    if (!Number.isNaN(fecha.getTime())) {
      const local = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
      return local.toISOString().slice(0, 16);
    }
  }
  if (definicion.tipo === 'date') return String(valor).slice(0, 10);
  return String(valor);
};

const prepararValor = (definicion: DefinicionCampo, valor: unknown): unknown => {
  if (valor === undefined || valor === null || valor === '') return undefined;
  if (definicion.tipo === 'number') return Number(valor);
  if (definicion.tipo === 'datetime-local') {
    const fecha = valor instanceof Date ? valor : new Date(String(valor));
    if (!Number.isNaN(fecha.getTime())) return fecha.toISOString();
  }
  return valor;
};

const prepararCuerpo = (
  campos: DefinicionCampo[],
  formulario: DatosFormulario,
  { crear }: { crear: boolean },
): Record<string, unknown> => {
  const cuerpo: Record<string, unknown> = {};
  campos.forEach((campo) => {
    if (campo.auto || (crear && campo.soloEdicion) || (!crear && campo.soloCrear)) return;
    const valor = prepararValor(campo, formulario[campo.nombre]);
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
    onChange: (evento: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      onChange(definicion.nombre, evento.target.value),
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
}: CrudModuloProps) {
  const valoresFiltroIniciales = useMemo(
    () => Object.fromEntries(filtros.map((filtro) => [filtro.nombre, filtro.valorInicial ?? ''])),
    [filtros],
  );
  const [filtrosActuales, setFiltrosActuales] = useState<DatosFormulario>(valoresFiltroIniciales);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [opciones, setOpciones] = useState<OpcionesPorCampo>({});
  const [formulario, setFormulario] = useState<DatosFormulario>(
    inicial ?? formularioInicial(campos),
  );
  const [editando, setEditando] = useState<ClaveRegistro | null>(null);
  const [cargando, setCargando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const cargar = useCallback(
    async (parametros: Record<string, unknown> = {}) => {
      setCargando(true);
      setError('');
      try {
        const respuesta = await servicio.listar(parametros);
        const opcionesRespuesta: OpcionesPorCampo = cargarOpciones ? await cargarOpciones() : {};
        const lista = transformar ? transformar(respuesta, opcionesRespuesta) : respuesta;
        setRegistros(Array.isArray(lista) ? (lista as Registro[]) : []);
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

  const editar = (registro: Registro) => {
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

  const eliminar = async (registro: Registro) => {
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
      setError(mensajeError(err));
    } finally {
      setProcesando(false);
    }
  };

  const ejecutarAccion = async (accion: AccionCrud, registro: Registro) => {
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

  const valorCelda = (columna: Columna, registro: Registro): ReactNode => {
    const valor =
      typeof columna.clave === 'function' ? columna.clave(registro) : registro[columna.clave];
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
              opciones={
                (filtro.opcionesKey ? opciones[filtro.opcionesKey] : undefined) ??
                filtro.opciones ??
                []
              }
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
                <tr key={Object.values(clave(registro)).join('-') || indice}>
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
                opciones={
                  (campo.opcionesKey ? opciones[campo.opcionesKey] : undefined) ??
                  campo.opciones ??
                  []
                }
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
  { nombre: 'estado', etiqueta: 'Estado', tipo: 'select', opciones: OPCIONES_ESTADO_PROVEEDOR, valorInicial: 'Activo' },
];

const FILTROS_PROVEEDORES: DefinicionCampo[] = [
  { nombre: 'estado', etiqueta: 'Estado', tipo: 'select', opciones: OPCIONES_ESTADO_PROVEEDOR },
];

const COLUMNAS_PROVEEDORES: Columna[] = [
  { titulo: 'ID', clave: 'id_proveedor' },
  { titulo: 'Nombre', clave: 'nombre' },
  { titulo: 'Contacto', clave: 'contacto' },
  { titulo: 'Teléfono', clave: 'telefono' },
  { titulo: 'Correo', clave: 'correo' },
  { titulo: 'Dirección', clave: 'direccion' },
  { titulo: 'Estado', clave: 'estado', formato: (valor) => <EtiquetaEstado valor={valor} /> },
];

const SERVICIO_PROVEEDORES: ServicioCrud = {
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
      etiquetaRegistro={(registro) => `el proveedor ${texto(registro.nombre)}`}
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

const COLUMNAS_COMPRAS: Columna[] = [
  { titulo: 'ID', clave: 'id_compra' },
  { titulo: 'Proveedor', clave: 'proveedorNombre' },
  { titulo: 'Factura', clave: 'numero_factura' },
  { titulo: 'Fecha', clave: 'fecha', formato: formatearFecha },
  { titulo: 'Total', clave: 'total' },
  { titulo: 'Estado', clave: 'estado', formato: (valor) => <EtiquetaEstado valor={valor} /> },
];

const SERVICIO_COMPRAS: ServicioCrud = {
  listar: listarCompras,
  crear: crearCompra,
  actualizar: (clave, datos) => actualizarCompra(clave.id, datos),
  eliminar: (clave) => eliminarCompra(clave.id),
};

const cargarOpcionesCompras = async (): Promise<OpcionesPorCampo> => {
  const proveedores = await listarProveedores({ estado: 'Activo' });
  const lista = Array.isArray(proveedores) ? (proveedores as Registro[]) : [];
  return {
    id_proveedor: lista.map((proveedor) => ({
      valor: aId(proveedor.id_proveedor),
      etiqueta: texto(proveedor.nombre),
    })),
  };
};

const transformarCompras = (respuesta: unknown, opciones: OpcionesPorCampo): Registro[] => {
  const lista = Array.isArray(respuesta) ? (respuesta as Registro[]) : [];
  return lista.map((compra) => ({
    ...compra,
    proveedorNombre: texto(
      (compra.proveedor as { nombre?: unknown } | undefined)?.nombre,
      textoOpcion(opciones.id_proveedor, compra.id_proveedor),
    ),
  }));
};

const soloBorrador = (compra: Registro): boolean => compra.estado === 'Borrador';

export function ComprasModulo() {
  const [detalle, setDetalle] = useState<DetalleCompra | null>(null);
  const [productos, setProductos] = useState<Registro[]>([]);
  const [nuevoDetalle, setNuevoDetalle] = useState<DatosFormulario>({
    id_producto: '',
    cantidad: '1',
    costo_unitario: '',
  });
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState('');
  const [avisoDetalle, setAvisoDetalle] = useState('');
  const [refresco, setRefresco] = useState(0);

  useEffect(() => {
    listarProductos()
      .then((respuesta) => setProductos(Array.isArray(respuesta) ? (respuesta as Registro[]) : []))
      .catch((err: unknown) => setErrorDetalle(mensajeError(err)));
  }, []);

  const opcionesProductos = useMemo<Opcion[]>(
    () =>
      productos.map((producto) => ({
        valor: aId(producto.id_producto),
        etiqueta: `${texto(producto.nombre)} · stock ${texto(producto.stock)}`,
      })),
    [productos],
  );

  const recargarDetalle = useCallback(async (id: Id) => {
    const respuesta = await obtenerCompra(id);
    setDetalle((respuesta ?? null) as DetalleCompra | null);
    setRefresco((valor) => valor + 1);
  }, []);

  const acciones = useMemo<AccionCrud[]>(
    () => [
      {
        etiqueta: 'Ver detalle',
        ejecutar: async (compra) => {
          setCargandoDetalle(true);
          setErrorDetalle('');
          setAvisoDetalle('');
          try {
            setDetalle((await obtenerCompra(aId(compra.id_compra))) as DetalleCompra | null);
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
          `¿Confirmar la compra ${texto(compra.numero_factura)}? Se actualizará el inventario y se enviará un correo al proveedor.`,
        ejecutar: async (compra) => {
          const idCompra = aId(compra.id_compra);
          const respuesta = await confirmarCompra(idCompra);
          if (detalle && aId(detalle.id_compra) === idCompra) await recargarDetalle(idCompra);
          return respuesta?.message ?? 'Compra confirmada correctamente.';
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
    const idCompra = aId(detalle.id_compra);
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
      await agregarDetalleCompra(idCompra, {
        id_producto: Number(nuevoDetalle.id_producto),
        cantidad,
        costo_unitario: costo,
      });
      await recargarDetalle(idCompra);
      setNuevoDetalle({ id_producto: '', cantidad: '1', costo_unitario: '' });
      setAvisoDetalle('Producto agregado. El backend recalculó los totales de la compra.');
    } catch (err) {
      setErrorDetalle(mensajeError(err));
    } finally {
      setCargandoDetalle(false);
    }
  };

  const quitarProducto = async (item: Registro) => {
    if (!detalle) return;
    if (!window.confirm(`¿Quitar ${texto(item.producto, `el producto ${texto(item.id_producto)}`)} de esta compra?`)) return;
    setCargandoDetalle(true);
    setErrorDetalle('');
    setAvisoDetalle('');
    try {
      await eliminarDetalleCompra(aId(detalle.id_compra), aId(item.id_detalle_compra));
      await recargarDetalle(aId(detalle.id_compra));
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
      const respuesta = await confirmarCompra(aId(detalle.id_compra));
      await recargarDetalle(aId(detalle.id_compra));
      setAvisoDetalle(texto(respuesta?.message, 'Compra confirmada correctamente.'));
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
        etiquetaRegistro={(registro) => `la compra ${texto(registro.numero_factura)}`}
        refresco={refresco}
      />

      {detalle && (
        <article className="tarjeta modulo-tarjeta detalle-compra">
          <header className="modulo-cabecera">
            <div>
              <h3>Detalle de la compra #{texto(detalle.id_compra)}</h3>
              <p>
                {texto(detalle.numero_factura)} · {texto(detalle.proveedor?.nombre, 'Proveedor no disponible')} ·{' '}
                {texto(detalle.estado)}
              </p>
            </div>
            <button type="button" className="boton secundario" onClick={() => setDetalle(null)}>
              Cerrar detalle
            </button>
          </header>

          {avisoDetalle && <p className="aviso">{avisoDetalle}</p>}
          {errorDetalle && <p className="error">{errorDetalle}</p>}

          <div className="totales-compra">
            <div><span>Subtotal</span><strong>{texto(detalle.subtotal, '0.00')}</strong></div>
            <div><span>Impuesto</span><strong>{texto(detalle.impuesto, '0.00')}</strong></div>
            <div><span>Total</span><strong>{texto(detalle.total, '0.00')}</strong></div>
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
                {(Array.isArray(detalle.detalles) ? (detalle.detalles as Registro[]) : []).length === 0 ? (
                  <tr><td colSpan={5} className="fila-vacia">Esta compra aún no tiene productos.</td></tr>
                ) : (
                  (detalle.detalles as Registro[]).map((item) => (
                    <tr key={texto(item.id_detalle_compra)}>
                      <td>{texto(item.producto || textoOpcion(opcionesProductos, item.id_producto))}</td>
                      <td>{texto(item.cantidad)}</td>
                      <td>{texto(item.costo_unitario)}</td>
                      <td>{texto(item.subtotal)}</td>
                      <td className="acciones-tabla">
                        <button
                          type="button"
                          className="boton enlinea peligro"
                          disabled={texto(detalle.estado) !== 'Borrador' || cargandoDetalle}
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
