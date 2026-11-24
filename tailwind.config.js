/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Escanea todos los archivos de React en src
  ],
  theme: {
    extend: {
      // Puedes añadir aquí colores o fuentes personalizadas
    },
  },
  plugins: [],
}