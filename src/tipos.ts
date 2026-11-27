export type Id = string | number

export interface UsuarioSesion {
  usercod?: number
  username?: string
  useremail?: string
  usertipo?: string
  userest?: string
}

export interface Opcion {
  valor: Id
  etiqueta: string
}

export type Registro = Record<string, unknown>

export interface EstadoRuta {
  mensaje?: string
  from?: { pathname?: string }
  username?: string
  useremail?: string
}
