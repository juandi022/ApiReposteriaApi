import { Navigate, Route, Routes } from 'react-router-dom'
import { RutaPrivada, RutaPublica } from './auth/Rutas'
import LayoutModulo from './componentes/LayoutModulo'
import Inicio from './paginas/Inicio'
import Login from './paginas/Login'
import NoEncontrado from './paginas/NoEncontrado'
import NuevaContrasena from './paginas/NuevaContrasena'
import Registro from './paginas/Registro'
import Recuperacion from './paginas/Recuperacion'
import { ComprasModulo, ProveedoresModulo } from './paginas/Modulos'
import GestionUsuarios from './paginas/GestionUsuarios'

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
