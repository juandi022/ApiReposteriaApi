import { useState } from 'react'

export function useEnvio() {
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const enviar = async (evento, accion) => {
    evento?.preventDefault()
    setError('')
    setCargando(true)
    try {
      await accion()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la solicitud.')
    } finally {
      setCargando(false)
    }
  }

  return { error, cargando, enviar, setError }
}
