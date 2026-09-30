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
        sage: {
          50: '#f2f7f2',
          100: '#dce8dc',
          200: '#b8d4b8',
          300: '#8fba8f',
          400: '#6a9e6a',
          500: '#4d7f4d',
          600: '#3d6b3d',
          700: '#2f5530',
          800: '#234023',
          900: '#1a3a1a',
        },
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
        'glow-sage': '0 0 20px -3px rgba(77, 127, 77, 0.35)',
      }
    },
  },
  plugins: [],
}
