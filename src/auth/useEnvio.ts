import { useState, type Dispatch, type SetStateAction, type SyntheticEvent } from 'react'

export interface Envio {
  error: string
  cargando: boolean
  enviar: (evento: SyntheticEvent | undefined, accion: () => unknown | Promise<unknown>) => Promise<void>
  setError: Dispatch<SetStateAction<string>>
}

export function useEnvio(): Envio {
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const enviar = async (
    evento: SyntheticEvent | undefined,
    accion: () => unknown | Promise<unknown>,
  ): Promise<void> => {
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
