/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          lime: '#C2EF51',
          'lime-dark': '#A3D936',
          lavender: '#D9D7F8',
          pill: '#F1F3F9',
        },
        surface: {
          light: '#F5F6FA',
          card: '#FFFFFF',
          'card-subtle': '#FAFAFC',
          dark: '#0F172A',
          'dark-card': '#1E293B',
          'dark-border': '#334155',
        }
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        heading: ['Inter', 'sans-serif'],
        title: ['Inter', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        manrope: ['Manrope', 'sans-serif'],
      },
      boxShadow: {
        'soft-glass': '0 8px 30px rgba(0, 0, 0, 0.04)',
        'pill-inset': 'inset 0 1px 2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
