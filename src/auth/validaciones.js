export const esCorreo = (valor) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)

export const contrasenaValida = (valor) =>
  /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(valor)
