/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Esto reemplaza la fuente por defecto 'sans' por Outfit
        sans: ['Outfit', 'sans-serif'], 
      },
    },
  },
  plugins: [],
}