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
        sans: ['var(--font-manrope)', 'Arial', 'sans-serif'],
        display: ['var(--font-outfit)', 'Arial', 'sans-serif'],
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
        'celebration-pop': {
          '0%': { transform: 'scale(0.82) translateY(18px)', opacity: '0' },
          '65%': { transform: 'scale(1.035) translateY(0)', opacity: '1' },
          '100%': { transform: 'scale(1) translateY(0)', opacity: '1' },
        },
        'confetti-fall': {
          '0%': { transform: 'translateY(-4vh) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(105vh) rotate(620deg)', opacity: '0.15' },
        },
      },
      animation: {
        'pop-win': 'pop-win 260ms ease-out',
        'slide-out-left': 'slide-out-left 320ms ease-in forwards',
        'slide-out-right': 'slide-out-right 320ms ease-in forwards',
        'celebration-pop': 'celebration-pop 480ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'confetti-fall': 'confetti-fall 1.6s ease-in both',
      },
    },
  },
  plugins: [],
};

export default config;
