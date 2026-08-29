import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Exact background match to orderupfantasy.com's dark theme (#07090D).
        ink: {
          950: '#07090d',
          900: '#0b0d12',
          850: '#10131a',
          800: '#161a23',
          700: '#1f232f',
          600: '#2b303f',
          500: '#3c4256',
        },
        // Bold "order up" orange in place of the old blue — punchy against
        // the near-black background, fits a playful/competitive sports brand.
        accent: {
          DEFAULT: '#ff5a1f',
          bright: '#ff7a45',
          dim: '#c23f10',
          50: '#fff1ea',
        },
        positive: '#22c55e',
        negative: '#ef4444',
        gold: '#d4af37',
      },
      fontFamily: {
        // Body copy stays a clean system stack for readability.
        sans: ['var(--font-inter)', '-apple-system', 'Segoe UI', 'Roboto', 'system-ui', 'sans-serif'],
        // Headlines/scores use a bold condensed display face (loaded via a
        // runtime <link> in app/layout.tsx, not next/font — see that file's
        // comment for why) for a scoreboard/sports-ticket feel.
        display: ['var(--font-display)', 'Impact', '-apple-system', 'Segoe UI', 'Roboto', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -8px rgba(0,0,0,0.6)',
        glow: '0 0 0 1px rgba(255,90,31,0.4), 0 0 32px -4px rgba(255,90,31,0.35)',
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
