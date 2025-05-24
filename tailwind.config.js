/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0866FF', // Meta blue
          dark: '#0555d4',
          light: '#3b89ff',
          50: '#e6f0ff',
          100: '#cce0ff',
          200: '#99c2ff',
          300: '#66a3ff',
          400: '#3385ff',
          500: '#0866FF',
          600: '#0652cc',
          700: '#053d99',
          800: '#042966',
          900: '#021433',
        },
        secondary: {
          DEFAULT: '#65676B', // Meta secondary text
          dark: '#4E4F52',
          light: '#8A8D91',
        },
        background: {
          DEFAULT: '#F0F2F5', // Meta background
          dark: '#E4E6EB',
          card: '#FFFFFF',
        },
        dark: {
          DEFAULT: '#18191A', // Meta dark mode
          light: '#242526',
          card: '#3A3B3C',
        },
        success: '#31A24C', // Meta green
        warning: '#F7B928', // Meta yellow
        error: '#E41E3F',   // Meta red
      },
      fontFamily: {
        sans: [
          'SF Pro Display',
          'Segoe UI',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      borderRadius: {
        'sm': '0.25rem',
        DEFAULT: '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'card': '0 2px 4px rgba(0, 0, 0, 0.1), 0 12px 28px rgba(0, 0, 0, 0.1)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-app': 'linear-gradient(to bottom, #e6f0ff, #ffffff)',
        'gradient-card': 'linear-gradient(to bottom, #ffffff, #f8faff)',
        'gradient-vibrant': 'linear-gradient(135deg, #6366f1, #8b5cf6, #d946ef)',
        'gradient-colorful': 'linear-gradient(135deg, #3b82f6, #10b981, #f59e0b)',
        'gradient-sunset': 'linear-gradient(135deg, #f97316, #ec4899, #8b5cf6)',
        'gradient-ocean': 'linear-gradient(135deg, #0ea5e9, #06b6d4, #14b8a6)',
        'gradient-fire': 'linear-gradient(135deg, #ef4444, #f97316, #f59e0b)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
