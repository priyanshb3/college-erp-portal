/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        erp: {
          maroon: '#6B1D2F',
          maroonDark: '#4F1220',
          maroonLight: '#8C2B41',
          navy: '#1B2A4A',
          navyDark: '#121C33',
          navyLight: '#2D3F66',
          gold: '#C59B27',
          goldLight: '#E8BF4C',
          cream: '#F9F8F5',
          border: '#D9DFE7',
          header: '#0E1726',
        }
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
