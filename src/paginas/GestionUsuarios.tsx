import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ArrowLeft, Eye, Pencil, Plus, Search, Trash2, Users, ShieldCheck, RefreshCw, X, UserRound } from 'lucide-react'
import { usuarioService } from '../Services/usuarioService'
import type { AsignacionRol, RolApi, UsuarioVista } from '../interfaces/Usuario'
import './GestionUsuarios.css'

type Pantalla = 'lista' | 'agregar' | 'mostrar' | 'modificar' | 'eliminar'
type Formulario = { username: string; useremail: string; userpswd: string; rolescod: string; userest: string }
const inicial: Formulario = { username: '', useremail: '', userpswd: '', rolescod: '', userest: 'ACT' }

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState<UsuarioVista[]>([])
  const [roles, setRoles] = useState<RolApi[]>([])
  const [asignaciones, setAsignaciones] = useState<AsignacionRol[]>([])
  const [pantalla, setPantalla] = useState<Pantalla>('lista')
  const [seleccionado, setSeleccionado] = useState<UsuarioVista | null>(null)
  const [form, setForm] = useState<Formulario>(inicial)
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  async function cargar() {
    setCargando(true); setError('')
    try {
      const [lista, listaRoles, listaAsignaciones] = await Promise.all([usuarioService.listar(), usuarioService.roles(), usuarioService.asignaciones()])
      setUsuarios(lista.map(u => {
        const asignacion = listaAsignaciones.find(a => Number(a.usercod) === Number(u.usercod) && a.roleuserest !== 'INA')
        const codigo = asignacion?.rolescod || u.usertipo || ''
        const rol = listaRoles.find(r => r.rolescod === codigo)
        return { ...u, rolescod: codigo, rolNombre: rol?.rolesdsc || rol?.rolescod || codigo || 'Sin asignar' }
      }))
      setRoles(listaRoles.filter(r => r.rolesest !== 'INA')); setAsignaciones(listaAsignaciones)
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo conectar con la API.') }
    finally { setCargando(false) }
  }
  useEffect(() => { void cargar() }, [])

  const filtrados = useMemo(() => usuarios.filter(u => `${u.username} ${u.useremail} ${u.rolNombre} ${u.userest}`.toLowerCase().includes(busqueda.toLowerCase())), [usuarios, busqueda])
  function abrir(tipo: Pantalla, usuario?: UsuarioVista) {
    setError(''); setMensaje(''); setSeleccionado(usuario || null)
    setForm(usuario ? { username: usuario.username, useremail: usuario.useremail, userpswd: '', rolescod: usuario.rolescod || '', userest: usuario.userest || 'ACT' } : inicial)
    setPantalla(tipo)
  }
  async function guardar(e: FormEvent) {
    e.preventDefault(); setGuardando(true); setError('')
    try {
      if (pantalla === 'agregar') {
        const nuevo = await usuarioService.crear({ username: form.username, useremail: form.useremail, userpswd: form.userpswd, userpswdest: 'ACT', userest: form.userest, usertipo: form.rolescod || undefined })
        if (form.rolescod) await usuarioService.asignarRol(Number(nuevo.usercod), form.rolescod)
        setMensaje('Usuario agregado correctamente.')
      } else if (pantalla === 'modificar' && seleccionado) {
        await usuarioService.actualizar(seleccionado.usercod, { username: form.username, useremail: form.useremail, userest: form.userest, usertipo: form.rolescod || undefined })
        const anterior = seleccionado.rolescod
        if (form.rolescod && form.rolescod !== anterior) {
          const asignacionActiva = asignaciones.find(a => Number(a.usercod) === seleccionado.usercod && a.rolescod === anterior)
          if (asignacionActiva) await usuarioService.quitarRol(seleccionado.usercod, anterior!)
          await usuarioService.asignarRol(seleccionado.usercod, form.rolescod)
        }
        setMensaje('Cambios guardados correctamente.')
      }
      await cargar(); setPantalla('lista')
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo guardar el usuario.') }
    finally { setGuardando(false) }
  }
  async function confirmarEliminar() {
    if (!seleccionado) return
    setGuardando(true); setError('')
    try { await usuarioService.eliminar(seleccionado.usercod); await cargar(); setPantalla('lista') }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo eliminar el usuario.') }
    finally { setGuardando(false) }
  }
  const titulo = pantalla === 'agregar' ? 'Agregar usuario' : pantalla === 'modificar' ? 'Modificar usuario' : pantalla === 'mostrar' ? 'Información del usuario' : 'Eliminar usuario'
  const esFormulario = pantalla === 'agregar' || pantalla === 'modificar'

  return <div className="admin-shell">
    <aside className="sidebar"><div className="brand"><div className="brand-mark"><ShieldCheck size={23}/></div><div><strong>Repostería</strong><span>Panel administrativo</span></div></div><div className="side-label">MENÚ PRINCIPAL</div><div className="nav-item active"><Users size={18}/> Gestionar usuarios</div><div className="sidebar-bottom"><div className="avatar">A</div><div><strong>Administrador</strong><span>Gestión del sistema</span></div></div></aside>
    <main className="main-content"><header className="topbar"><div><span className="breadcrumb">Administración /</span> <strong>Usuarios</strong></div><span className="top-status"><span/> Sistema de gestión</span></header>
      <section className="page-content">
        {pantalla === 'lista' ? <>
          <div className="page-heading"><div><span className="eyebrow">ADMINISTRACIÓN</span><h1>Gestionar usuarios</h1><p>Administra las cuentas, roles y estados de acceso al sistema.</p></div><button className="primary-btn" onClick={() => abrir('agregar')}><Plus size={18}/> Agregar usuario</button></div>
          <div className="summary-grid"><div className="summary-card"><div className="summary-icon"><Users size={20}/></div><div><span>Total de usuarios</span><strong>{usuarios.length}</strong></div></div><div className="summary-card"><div className="summary-icon green"><ShieldCheck size={20}/></div><div><span>Usuarios activos</span><strong>{usuarios.filter(u => u.userest === 'ACT').length}</strong></div></div></div>
          <div className="table-card"><div className="table-toolbar"><div><h2>Listado de usuarios</h2><p>Consulta y administra los usuarios registrados.</p></div><div className="toolbar-actions"><label className="search-box"><Search size={17}/><input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar usuario..."/></label><button className="icon-btn" title="Actualizar" onClick={() => void cargar()}><RefreshCw size={17}/></button></div></div>
            {error && <div className="alert error">{error}</div>}{mensaje && <div className="alert success">{mensaje}</div>}
            {cargando ? <div className="empty-state">Cargando usuarios...</div> : filtrados.length === 0 ? <div className="empty-state">No se encontraron usuarios.</div> : <div className="table-wrap"><table><thead><tr><th>USUARIO</th><th>ROL</th><th>ESTADO</th><th className="actions-heading">ACCIONES</th></tr></thead><tbody>{filtrados.map(u => <tr key={u.usercod}><td><div className="user-cell"><div className="user-avatar"><UserRound size={18}/></div><div><strong>{u.username}</strong><span>{u.useremail}</span></div></div></td><td><span className="role-pill">{u.rolNombre}</span></td><td><span className={`state-pill ${u.userest === 'ACT' ? 'is-active' : 'is-inactive'}`}><i/>{u.userest === 'ACT' ? 'Activo' : 'Inactivo'}</span></td><td><div className="row-actions"><button title="Mostrar" onClick={() => abrir('mostrar', u)}><Eye size={17}/></button><button title="Modificar" onClick={() => abrir('modificar', u)}><Pencil size={17}/></button><button title="Eliminar" className="danger-icon" onClick={() => abrir('eliminar', u)}><Trash2 size={17}/></button></div></td></tr>)}</tbody></table></div>}
            <div className="table-footer">Mostrando {filtrados.length} de {usuarios.length} usuarios</div>
          </div>
        </> : <div className="form-page"><button className="back-btn" onClick={() => setPantalla('lista')}><ArrowLeft size={17}/> Volver al listado</button><div className="form-card"><div className="form-title"><div className="form-title-icon">{pantalla === 'mostrar' ? <Eye/> : pantalla === 'eliminar' ? <Trash2/> : pantalla === 'modificar' ? <Pencil/> : <Plus/>}</div><div><h1>{titulo}</h1><p>{pantalla === 'eliminar' ? 'Confirma si deseas eliminar esta cuenta.' : 'Completa la información solicitada.'}</p></div><button className="close-btn" onClick={() => setPantalla('lista')}><X size={19}/></button></div>
          {error && <div className="alert error">{error}</div>}
          {esFormulario ? <form onSubmit={guardar}><div className="form-grid"><label>Nombre de usuario<input required minLength={3} maxLength={80} value={form.username} onChange={e => setForm({...form, username:e.target.value})} placeholder="Ej. usuario01"/></label><label>Correo electrónico<input required type="email" value={form.useremail} onChange={e => setForm({...form, useremail:e.target.value})} placeholder="usuario@correo.com"/></label>{pantalla === 'agregar' && <label>Contraseña<input required type="password" minLength={8} value={form.userpswd} onChange={e => setForm({...form, userpswd:e.target.value})} placeholder="Mínimo 8 caracteres"/><small>Debe incluir mayúscula, número y símbolo.</small></label>}<label>Rol<select value={form.rolescod} onChange={e => setForm({...form, rolescod:e.target.value})}><option value="">Seleccionar rol</option>{roles.map(r => <option key={r.rolescod} value={r.rolescod}>{r.rolesdsc || r.rolescod}</option>)}</select></label><label>Estado<select value={form.userest} onChange={e => setForm({...form, userest:e.target.value})}><option value="ACT">Activo</option><option value="INA">Inactivo</option></select></label></div><div className="form-actions"><button type="button" className="secondary-btn" onClick={() => setPantalla('lista')}>Cancelar</button><button disabled={guardando} className="primary-btn" type="submit">{guardando ? 'Guardando...' : 'Guardar usuario'}</button></div></form> : pantalla === 'mostrar' && seleccionado ? <div className="detail-list"><div><span>Nombre de usuario</span><strong>{seleccionado.username}</strong></div><div><span>Correo electrónico</span><strong>{seleccionado.useremail}</strong></div><div><span>Rol</span><strong>{seleccionado.rolNombre}</strong></div><div><span>Estado</span><strong>{seleccionado.userest === 'ACT' ? 'Activo' : 'Inactivo'}</strong></div><div><span>Código de usuario</span><strong>#{seleccionado.usercod}</strong></div><div className="privacy-note">La contraseña no se muestra por seguridad.</div><div className="form-actions"><button className="secondary-btn" onClick={() => setPantalla('lista')}>Cerrar</button><button className="primary-btn" onClick={() => abrir('modificar', seleccionado)}><Pencil size={16}/> Modificar</button></div></div> : pantalla === 'eliminar' && seleccionado ? <div className="delete-content"><div className="delete-warning"><Trash2 size={24}/></div><h3>¿Eliminar este usuario?</h3><p>Se eliminará la cuenta <strong>{seleccionado.username}</strong> ({seleccionado.useremail}). Esta acción no se puede deshacer.</p><div className="form-actions"><button className="secondary-btn" onClick={() => setPantalla('lista')}>Cancelar</button><button className="delete-btn" disabled={guardando} onClick={() => void confirmarEliminar()}>{guardando ? 'Eliminando...' : 'Sí, eliminar'}</button></div></div> : null}
        </div></div>}
      </section>
    </main>
  </div>
}
