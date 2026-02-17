/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('nativewind/preset')],
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3D8A5A',
        secondary: '#4D9B6A',
        background: '#F5F4F1',
        surface: '#FFFFFF',
        muted: '#EDECEA',
        text: '#1A1918',
        'text-secondary': '#6D6C6A',
        'text-tertiary': '#878685',
        border: '#E5E4E1',
        'border-strong': '#D1D0CD',
        success: '#4A6B4A',
        error: '#B5725E',
        warning: '#D4A64A',
        teal: '#5BA4A4',
        warm: '#D89575',
      },
      fontFamily: {
        sans: ['System', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
