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
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#2d6a4f', // Forest green core
          600: '#1b4332',
          700: '#153d2c',
          800: '#0f291e',
          900: '#081c13',
          950: '#041209',
        },
        forest: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#40916c',
          500: '#2d6a4f',
          600: '#1b4332',
          700: '#153d2c',
          800: '#0f291e',
          900: '#081c13',
        },
        ivory: {
          50: '#fcfbf8',
          100: '#f8f5ee', // Warm ivory background
          200: '#f0ebd8',
          300: '#e4dcbe',
          400: '#cdc09a',
          500: '#b0a075',
          600: '#8f7e56',
          700: '#6f6040',
          800: '#4a3f29',
          900: '#2b2416',
        },
        sage: {
          50: '#f4f7f5',
          100: '#e5ede7',
          200: '#cdddd1',
          300: '#a7c2ae',
          400: '#81a38a',
          500: '#61856b',
          600: '#4a6b53',
          700: '#3c5543',
          800: '#324538',
          900: '#2b3930',
        },
        charcoal: {
          50: '#f6f6f7',
          100: '#ececed',
          200: '#d5d5d8',
          300: '#b1b1b7',
          400: '#878791',
          500: '#686873',
          600: '#53535d',
          700: '#43434c',
          800: '#3a3a41',
          900: '#1a1a1f',
          950: '#101013',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'serif'],
        dyslexic: ['Atkinson Hyperlegible', 'OpenDyslexic', 'Comic Sans MS', 'sans-serif'],
        mono: ['Fira Code', 'Menlo', 'monospace']
      },
      lineHeight: {
        'relaxed-plus': '1.8',
        'loose-plus': '2.1',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(45, 106, 79, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(45, 106, 79, 0.6)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.4s ease-out',
        slideUp: 'slideUp 0.35s ease-out',
        slideDown: 'slideDown 0.35s ease-out',
        scaleIn: 'scaleIn 0.3s ease-out',
        shimmer: 'shimmer 2s ease-in-out infinite',
        float: 'float 3s ease-in-out infinite',
        glow: 'glow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
