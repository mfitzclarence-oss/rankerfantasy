import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Exact background match to orderupfantasy.com's dark theme (#07090D).
        ink: {
          950: '#14161a',
          900: '#17191e',
          850: '#1f2228',
          800: '#262a32',
          700: '#2c303a',
          600: '#3a4050',
          500: '#6b7280',
        },
        // Bold "order up" orange in place of the old blue — punchy against
        // the near-black background, fits a playful/competitive sports brand.
        accent: {
          DEFAULT: '#ff7a35',
          bright: '#ff8c52',
          dim: '#e0590f',
          50: '#fff2e9',
        },
        blue: '#5c93ff',
        positive: '#3ecf8e',
        negative: '#f2585c',
        gold: '#d4af37',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Arial', 'sans-serif'],
        display: ['var(--font-poppins)', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.18), 0 12px 30px -18px rgba(0,0,0,0.7)',
        glow: '0 0 0 1px rgba(255,122,53,0.45), 0 0 28px -7px rgba(255,122,53,0.35)',
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
