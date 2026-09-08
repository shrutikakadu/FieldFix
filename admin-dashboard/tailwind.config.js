/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          400: '#38bdf8',
          500: '#0284c7',
          600: '#0369a1',
          900: '#0c4a6e',
        }
      },
      boxShadow: {
        'glow-sky': '0 0 20px -3px rgba(56, 189, 248, 0.35)',
        'glow-emerald': '0 0 20px -3px rgba(52, 211, 153, 0.35)',
        'glow-amber': '0 0 20px -3px rgba(251, 191, 36, 0.35)',
      }
    },
  },
  plugins: [],
}
