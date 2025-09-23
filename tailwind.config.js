/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/templates/**/*.html",
    "./static/js/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        brandTeal: '#3f7388',   // azul petróleo
        brandOrange: '#FF9A3D'  // naranja para tarjetas
      }
    }
  },
  plugins: []
}



