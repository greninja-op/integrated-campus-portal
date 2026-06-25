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
        // ONE primary accent — iris. Reserve for the primary action per screen.
        primary: {
          DEFAULT: '#6d5efc',
          50: '#eeecff',
          100: '#dcd8ff',
          200: '#bdb4ff',
          300: '#9b8dff',
          400: '#8b7cff',
          500: '#6d5efc',
          600: '#5b4ef0',
          700: '#4a3ed6',
          800: '#3c34ab',
          900: '#332f87',
        },
        // Semantic status colors (not decoration).
        success: { DEFAULT: '#14b8a6', dark: '#2dd4bf' },
        danger: { DEFAULT: '#f43f5e', dark: '#fb7185' },
        warning: { DEFAULT: '#f59e0b', dark: '#fbbf24' },
      },
      fontFamily: {
        display: ['Sora', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      boxShadow: {
        // Soft, tinted, layered — never the flat 0 2px 4px default.
        glass: '0 8px 32px rgba(31, 38, 135, 0.12)',
        'glass-lg': '0 16px 48px rgba(31, 38, 135, 0.18)',
        'glass-xl': '0 24px 64px rgba(31, 38, 135, 0.25)',
      },
      backdropBlur: {
        xs: '2px',
      },
      transitionTimingFunction: {
        'out-soft': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-soft': 'cubic-bezier(0.4, 0, 1, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        meshShift: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)' },
          '50%': { transform: 'translate3d(0, -2%, 0) scale(1.05)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
}
