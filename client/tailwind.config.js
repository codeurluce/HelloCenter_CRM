/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        purple: {
          DEFAULT: '#635FC7', // Couleur principale (modifiez-la selon vos besoins)
          50: '#EDE9FE',
          100: '#D0BCFF',
          200: '#B794F4',
          300: '#9CA3AF',
          400: '#818CF8',
          500: '#635FC7',
          600: '#4534B8',
          700: '#372FA4',
          800: '#2A2188',
          900: '#1E176D',
        },
      }
    }
  },
  plugins: [],
}
