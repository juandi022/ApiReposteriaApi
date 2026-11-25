import { Link } from 'react-router-dom'
import Encabezado from '../componentes/Encabezado.jsx'

export default function NoEncontrado() {
  return (
    <main className="layout">
      <section className="tarjeta">
        <Encabezado titulo="Página no encontrada" subtitulo="La ruta que intentas visitar no existe" />
        <p className="pie">Verifica la dirección o vuelve al inicio de la aplicación.</p>
        <Link className="boton primario" to="/">Ir al inicio</Link>
      </section>
    </main>
  )
}
