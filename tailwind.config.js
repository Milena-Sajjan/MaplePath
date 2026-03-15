/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        maple:  { DEFAULT: '#C8102E', light: '#E8344A', pale: '#FFF0F2' },
        forest: { DEFAULT: '#1A3A2A', mid: '#2D5A3D', light: '#4A8C5C', pale: '#F0FAF4' },
        gold:   { DEFAULT: '#D4A017', light: '#F5C842' },
        snow:   '#F8F6F2',
        slate:  '#2C2C2C',
      },
      fontFamily: {
        serif: ['"DM Serif Display"', 'serif'],
        sans:  ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
