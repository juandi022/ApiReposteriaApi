import { useEffect, useState, type ChangeEvent, type ComponentType, type FormEvent } from 'react';
import {
  actualizarContrasena,
  cerrarSesion,
  clearToken,
  enviarPin,
  getToken,
  iniciarSesion,
  mensajeError,
  obtenerPerfil,
  registro,
  setToken,
  type Usuario,
} from './api';
import { ComprasModulo, ProveedoresModulo } from './Modulos';

type Pantalla = 'login' | 'registro' | 'recuperacion' | 'pin' | 'inicio' | 'compras' | 'proveedores';

interface Modulo {
  id: 'compras' | 'proveedores';
  grupo: string;
  etiqueta: string;
  descripcion: string;
  componente: ComponentType;
}

const esCorreo = (valor: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
const contrasenaValida = (valor: string): boolean =>
  /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(valor);

const GRUPOS_MODULOS = ['Abastecimiento', 'Red de suministro'] as const;

const MODULOS: Modulo[] = [
  {
    id: 'compras',
    grupo: 'Abastecimiento',
    etiqueta: 'Compras',
    descripcion: 'Facturas, productos y confirmación.',
    componente: ComprasModulo,
  },
  {
    id: 'proveedores',
    grupo: 'Red de suministro',
    etiqueta: 'Proveedores',
    descripcion: 'Contactos y datos de abastecimiento.',
    componente: ProveedoresModulo,
  },
];

function Ojo({ visible }: { visible: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="3" />
      {!visible && <path d="M4 4l16 16" strokeLinecap="round" />}
    </svg>
  );
}

interface CampoPasswordProps {
  id: string;
  name: string;
  value: string;
  onChange: (evento: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  autoComplete: string;
}

function CampoPassword({ id, name, value, onChange, placeholder, autoComplete }: CampoPasswordProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="input-wrap">
      <input
        id={id}
        name={name}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
      />
      <button
        type="button"
        className="toggle-password"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      >
        <Ojo visible={visible} />
      </button>
    </div>
  );
}

function Encabezado({ titulo, subtitulo }: { titulo: string; subtitulo: string }) {
  return (
    <header className="encabezado">
      <div className="marca" aria-label="Repostería">
        <span className="marca-icono" aria-hidden="true">R</span>
        <span>Repostería</span>
      </div>
      <h1>{titulo}</h1>
      <p>{subtitulo}</p>
    </header>
  );
}

export default function App() {
  const [pantalla, setPantalla] = useState<Pantalla>('login');
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [cargando, setCargando] = useState(false);
  const [verificando, setVerificando] = useState(true);

  const [login, setLogin] = useState({ identificador: '', userpswd: '' });
  const [registroForm, setRegistroForm] = useState({ useremail: '', username: '', userpswd: '', confirmar: '' });
  const [recuperacion, setRecuperacion] = useState({ username: '', useremail: '' });
  const [pinForm, setPinForm] = useState({ pin: '', userpswdNueva: '', confirmar: '' });

  useEffect(() => {
    if (!getToken()) {
      setVerificando(false);
      return;
    }
    obtenerPerfil()
      .then((data) => setUsuario(data.usuario ?? null))
      .catch(() => clearToken())
      .finally(() => setVerificando(false));
  }, []);

  const ir = (destino: Pantalla, mensaje = '') => {
    setError('');
    setAviso(mensaje);
    setPantalla(destino);
  };

  const enviar = async (event: FormEvent<HTMLFormElement>, accion: () => Promise<void>) => {
    event.preventDefault();
    setError('');
    setAviso('');
    setCargando(true);
    try {
      await accion();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setCargando(false);
    }
  };

  const hacerLogin = (event: FormEvent<HTMLFormElement>) =>
    enviar(event, async () => {
      const { identificador, userpswd } = login;
      if (!identificador.trim() || !userpswd) throw new Error('Ingresa tu usuario y contraseña.');
      const data = await iniciarSesion(identificador.trim(), userpswd);
      setToken(data.token);
      setUsuario(data.usuario);
      setError('');
      setAviso('');
      setPantalla('inicio');
    });

  const hacerRegistro = (event: FormEvent<HTMLFormElement>) =>
    enviar(event, async () => {
      const { useremail, username, userpswd, confirmar } = registroForm;
      if (!esCorreo(useremail.trim())) throw new Error('Ingresa un correo electrónico válido.');
      if (username.trim().length < 3) throw new Error('El usuario debe tener al menos 3 caracteres.');
      if (!contrasenaValida(userpswd)) {
        throw new Error('La contraseña necesita 8 caracteres, una mayúscula, un número y un símbolo.');
      }
      if (userpswd !== confirmar) throw new Error('Las contraseñas no coinciden.');
      await registro(useremail.trim(), username.trim(), userpswd);
      setRegistroForm({ useremail: '', username: '', userpswd: '', confirmar: '' });
      ir('login', 'Cuenta creada correctamente. Ya puedes iniciar sesión.');
    });

  const hacerRecuperacion = (event: FormEvent<HTMLFormElement>) =>
    enviar(event, async () => {
      const { username, useremail } = recuperacion;
      if (username.trim().length < 3) throw new Error('El usuario debe tener al menos 3 caracteres.');
      if (!esCorreo(useremail.trim())) throw new Error('Ingresa un correo electrónico válido.');
      await enviarPin(username.trim(), useremail.trim());
      setPinForm({ pin: '', userpswdNueva: '', confirmar: '' });
      ir('pin', 'Enviamos un PIN de 4 dígitos a tu correo.');
    });

  const hacerCambioContrasena = (event: FormEvent<HTMLFormElement>) =>
    enviar(event, async () => {
      const { pin, userpswdNueva, confirmar } = pinForm;
      if (!/^\d{4}$/.test(pin)) throw new Error('El PIN debe tener 4 dígitos.');
      if (!contrasenaValida(userpswdNueva)) {
        throw new Error('La contraseña necesita 8 caracteres, una mayúscula, un número y un símbolo.');
      }
      if (userpswdNueva !== confirmar) throw new Error('Las contraseñas no coinciden.');
      await actualizarContrasena(
        recuperacion.username.trim(),
        recuperacion.useremail.trim(),
        pin,
        userpswdNueva,
      );
      ir('login', 'Contraseña actualizada. Ingresa con tu nueva contraseña.');
    });

  const hacerLogout = async () => {
    setCargando(true);
    try {
      await cerrarSesion();
    } catch {
      clearToken();
    }
    clearToken();
    setUsuario(null);
    setCargando(false);
    ir('login', 'Cerraste sesión correctamente.');
  };

  if (verificando) {
    return <main className="layout"><div className="cargando">Cargando…</div></main>;
  }

  const modulo = MODULOS.find((item) => item.id === pantalla);

  if (pantalla === 'inicio' && usuario) {
    return (
      <main className="layout app-layout">
        <section className="tarjeta ancha panel-principal">
          <Encabezado titulo="¡Bienvenido!" subtitulo="Tu sesión está activa" />
          <div className="perfil">
            <div><span>Usuario</span><strong>{usuario.username}</strong></div>
            <div><span>Correo</span><strong>{usuario.useremail}</strong></div>
            <div><span>Tipo</span><strong>{usuario.usertipo || 'PLB'}</strong></div>
          </div>
          {aviso && <p className="aviso">{aviso}</p>}
          <nav className="modulos" aria-label="Módulos de la repostería">
            {GRUPOS_MODULOS.map((grupo) => (
              <div className="grupo-modulos" key={grupo}>
                <h2>{grupo}</h2>
                <div className="modulos-grid">
                  {MODULOS.filter((item) => item.grupo === grupo).map((item) => (
                    <button
                      type="button"
                      className="modulo-boton"
                      key={item.id}
                      onClick={() => ir(item.id)}
                    >
                      <strong>{item.etiqueta}</strong>
                      <span>{item.descripcion}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>
          <button className="boton primario" onClick={hacerLogout} disabled={cargando}>
            {cargando ? 'Cerrando…' : 'Cerrar sesión'}
          </button>
        </section>
      </main>
    );
  }

  if (modulo) {
    if (!usuario) {
      return (
        <main className="layout">
          <section className="tarjeta">
            <Encabezado titulo="Sesión requerida" subtitulo="Inicia sesión para acceder a los módulos" />
            <button type="button" className="boton primario" onClick={() => ir('login')}>
              Ir a iniciar sesión
            </button>
          </section>
        </main>
      );
    }

    const ComponenteModulo = modulo.componente;
    return (
      <main className="layout app-layout modulo-layout">
        <div className="barra-superior">
          <button type="button" className="enlace" onClick={() => ir('inicio')}>
            ← Volver al inicio
          </button>
          <button type="button" className="enlace" onClick={hacerLogout} disabled={cargando}>
            {cargando ? 'Cerrando…' : 'Cerrar sesión'}
          </button>
        </div>
        <div className="contenido-modulo">
          {aviso && <p className="aviso">{aviso}</p>}
          {error && <p className="error">{error}</p>}
          <ComponenteModulo />
        </div>
      </main>
    );
  }

  return (
    <main className="layout">
      <section className="tarjeta">
        {pantalla === 'login' && (
          <>
            <Encabezado titulo="Iniciar sesión" subtitulo="Ingresa tus credenciales para continuar" />
            {aviso && <p className="aviso">{aviso}</p>}
            {error && <p className="error">{error}</p>}
            <form onSubmit={hacerLogin}>
              <label htmlFor="identificador">Usuario o correo electrónico</label>
              <input
                id="identificador"
                name="username"
                type="text"
                value={login.identificador}
                onChange={(e) => setLogin({ ...login, identificador: e.target.value })}
                placeholder="tu_usuario"
                autoComplete="username"
                required
              />
              <label htmlFor="userpswd">Contraseña</label>
              <CampoPassword
                id="userpswd"
                name="userpswd"
                value={login.userpswd}
                onChange={(e) => setLogin({ ...login, userpswd: e.target.value })}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button type="button" className="enlace" onClick={() => ir('recuperacion')}>
                ¿Olvidaste tu contraseña?
              </button>
              <button className="boton primario" disabled={cargando}>
                {cargando ? 'Ingresando…' : 'Ingresar'}
              </button>
            </form>
            <p className="pie">
              ¿Aún no tienes cuenta?{' '}
              <button type="button" className="enlace" onClick={() => ir('registro')}>Regístrate</button>
            </p>
          </>
        )}

        {pantalla === 'registro' && (
          <>
            <Encabezado titulo="Crear cuenta" subtitulo="Regístrate para acceder a la repostería" />
            {aviso && <p className="aviso">{aviso}</p>}
            {error && <p className="error">{error}</p>}
            <form onSubmit={hacerRegistro}>
              <label htmlFor="registro-email">Correo electrónico</label>
              <input
                id="registro-email"
                name="useremail"
                type="email"
                value={registroForm.useremail}
                onChange={(e) => setRegistroForm({ ...registroForm, useremail: e.target.value })}
                placeholder="cliente@ejemplo.com"
                autoComplete="email"
                required
              />
              <label htmlFor="registro-user">Usuario</label>
              <input
                id="registro-user"
                name="username"
                type="text"
                value={registroForm.username}
                onChange={(e) => setRegistroForm({ ...registroForm, username: e.target.value })}
                placeholder="tu_usuario"
                autoComplete="username"
                required
              />
              <label htmlFor="registro-pswd">Contraseña</label>
              <CampoPassword
                id="registro-pswd"
                name="userpswd"
                value={registroForm.userpswd}
                onChange={(e) => setRegistroForm({ ...registroForm, userpswd: e.target.value })}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
              />
              <label htmlFor="registro-confirmar">Confirmar contraseña</label>
              <CampoPassword
                id="registro-confirmar"
                name="confirmar"
                value={registroForm.confirmar}
                onChange={(e) => setRegistroForm({ ...registroForm, confirmar: e.target.value })}
                placeholder="Repite tu contraseña"
                autoComplete="new-password"
              />
              <button className="boton primario" disabled={cargando}>
                {cargando ? 'Registrando…' : 'Registrarse'}
              </button>
            </form>
            <button type="button" className="enlace volver" onClick={() => ir('login')}>Volver al inicio de sesión</button>
          </>
        )}

        {pantalla === 'recuperacion' && (
          <>
            <Encabezado titulo="Recuperar contraseña" subtitulo="Ingresa tu usuario y correo para continuar" />
            {aviso && <p className="aviso">{aviso}</p>}
            {error && <p className="error">{error}</p>}
            <form onSubmit={hacerRecuperacion}>
              <label htmlFor="rec-user">Usuario</label>
              <input
                id="rec-user"
                name="username"
                type="text"
                value={recuperacion.username}
                onChange={(e) => setRecuperacion({ ...recuperacion, username: e.target.value })}
                placeholder="tu_usuario"
                autoComplete="username"
                required
              />
              <label htmlFor="rec-email">Correo electrónico</label>
              <input
                id="rec-email"
                name="useremail"
                type="email"
                value={recuperacion.useremail}
                onChange={(e) => setRecuperacion({ ...recuperacion, useremail: e.target.value })}
                placeholder="cliente@ejemplo.com"
                autoComplete="email"
                required
              />
              <button className="boton primario" disabled={cargando}>
                {cargando ? 'Enviando…' : 'Continuar'}
              </button>
            </form>
            <button type="button" className="enlace volver" onClick={() => ir('login')}>Volver al inicio de sesión</button>
          </>
        )}

        {pantalla === 'pin' && (
          <>
            <Encabezado titulo="Verifica tu identidad" subtitulo="Ingresa el PIN enviado a tu correo y tu nueva contraseña" />
            {aviso && <p className="aviso">{aviso}</p>}
            {error && <p className="error">{error}</p>}
            <form onSubmit={hacerCambioContrasena}>
              <label htmlFor="pin">PIN de recuperación</label>
              <input
                id="pin"
                name="pin"
                type="text"
                inputMode="numeric"
                maxLength={4}
                pattern="[0-9]{4}"
                value={pinForm.pin}
                onChange={(e) => setPinForm({ ...pinForm, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                placeholder="0000"
                required
              />
              <label htmlFor="pin-nueva">Nueva contraseña</label>
              <CampoPassword
                id="pin-nueva"
                name="userpswdNueva"
                value={pinForm.userpswdNueva}
                onChange={(e) => setPinForm({ ...pinForm, userpswdNueva: e.target.value })}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
              />
              <label htmlFor="pin-confirmar">Confirmar contraseña</label>
              <CampoPassword
                id="pin-confirmar"
                name="confirmar"
                value={pinForm.confirmar}
                onChange={(e) => setPinForm({ ...pinForm, confirmar: e.target.value })}
                placeholder="Repite tu contraseña"
                autoComplete="new-password"
              />
              <button className="boton primario" disabled={cargando}>
                {cargando ? 'Actualizando…' : 'Actualizar contraseña'}
              </button>
            </form>
            <button type="button" className="enlace volver" onClick={() => ir('login')}>Volver al inicio de sesión</button>
          </>
        )}
      </section>
    </main>
  );
}
