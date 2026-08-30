import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#070b12',
          900: '#0b111c',
          850: '#0e1624',
          800: '#121c2b',
          700: '#1d2a3d',
          600: '#2a3850',
          500: '#71809a',
        },
        accent: {
          DEFAULT: '#2f7df4',
          bright: '#73a4ff',
          dim: '#1f5fc5',
          50: '#eef5ff',
        },
        blue: '#5f94ff',
        positive: '#3ecf8e',
        negative: '#f2585c',
        gold: '#d4af37',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Arial', 'sans-serif'],
        display: ['var(--font-poppins)', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: '0 20px 50px -32px rgba(0,0,0,0.95)',
        glow: '0 0 0 1px rgba(47,125,244,0.45), 0 0 32px -9px rgba(47,125,244,0.55)',
      },
      keyframes: {
        'pop-win': {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.04)' },
          '100%': { transform: 'scale(1)' },
        },
        'slide-out-left': {
          '0%': { transform: 'translateX(0) rotate(0)', opacity: '1' },
          '100%': { transform: 'translateX(-120%) rotate(-8deg)', opacity: '0' },
        },
        'slide-out-right': {
          '0%': { transform: 'translateX(0) rotate(0)', opacity: '1' },
          '100%': { transform: 'translateX(120%) rotate(8deg)', opacity: '0' },
        },
      },
      animation: {
        'pop-win': 'pop-win 260ms ease-out',
        'slide-out-left': 'slide-out-left 320ms ease-in forwards',
        'slide-out-right': 'slide-out-right 320ms ease-in forwards',
      },
    },
  },
  plugins: [],
};

export default config;
