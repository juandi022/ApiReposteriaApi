export interface UsuarioApi {
  usercod: number
  useremail: string
  username: string
  userest?: string
  usertipo?: string
}
export interface RolApi { rolescod: string; rolesdsc: string; rolesest?: string }
export interface AsignacionRol { usercod: number; rolescod: string; roleuserest?: string | null }
export interface UsuarioVista extends UsuarioApi { rolescod?: string; rolNombre: string }
