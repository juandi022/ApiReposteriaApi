export default function Encabezado({ titulo, subtitulo }) {
  return (
    <header className="encabezado">
      <div className="marca" aria-label="Repostería">
        <span className="marca-icono" aria-hidden="true">R</span>
        <span>Repostería</span>
      </div>
      <h1>{titulo}</h1>
      <p>{subtitulo}</p>
    </header>
  )
}
