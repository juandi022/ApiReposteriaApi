import { Navigate, Route, Routes } from 'react-router-dom'
import { RutaPrivada, RutaPublica } from './auth/Rutas.jsx'
import LayoutModulo from './componentes/LayoutModulo.jsx'
import Inicio from './paginas/Inicio.jsx'
import Login from './paginas/Login.jsx'
import NoEncontrado from './paginas/NoEncontrado.jsx'
import NuevaContrasena from './paginas/NuevaContrasena.jsx'
import Registro from './paginas/Registro.jsx'
import Recuperacion from './paginas/Recuperacion.jsx'
import { ComprasModulo, ProveedoresModulo } from './paginas/Modulos.jsx'
import GestionUsuarios from './paginas/GestionUsuarios.tsx'

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<RutaPublica />}>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/recuperacion" element={<Recuperacion />} />
        <Route path="/nueva-contrasena" element={<NuevaContrasena />} />
      </Route>

      <Route element={<RutaPrivada />}>
        <Route path="/inicio" element={<Inicio />} />
        <Route path="/modulos" element={<LayoutModulo />}>
          <Route path="compras" element={<ComprasModulo />} />
          <Route path="proveedores" element={<ProveedoresModulo />} />
        </Route>
        <Route path="/usuarios" element={<GestionUsuarios />} />
      </Route>

      <Route path="/" element={<Navigate to="/inicio" replace />} />
      <Route path="*" element={<NoEncontrado />} />
    </Routes>
  )
}
