import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds — aligned with globals.css CSS variables
        arena: {
          void: '#06060b',
          deep: '#0b0b14',
          surface: '#10101c',
          card: '#151522',
          elevated: '#1c1c30',
        },
        // Primary accent — warm MUTED gold (not bright amber)
        gold: {
          DEFAULT: '#d4a843',
          bright: '#f0c654',
          dim: '#8a6d2b',
        },
        // Secondary accents
        fire: '#e8722a',
        blood: '#d44040',
        arcane: '#9b5de5',
        ice: '#4da8da',
        venom: '#3dba6f',
        // Rarity system
        rarity: {
          common: '#8a8478',
          uncommon: '#3dba6f',
          rare: '#4da8da',
          epic: '#9b5de5',
          legendary: '#e8722a',
        },
        // Text — warm off-whites
        'text-hero': '#f5f0e8',
        'text-primary': '#d4cfc5',
        'text-secondary': '#8a8478',
        'text-dim': '#5c574e',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Cinzel', 'serif'],
        body: ['var(--font-body)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'Fira Code', 'monospace'],
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        goldShimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        floatEmber: {
          '0%': { transform: 'translateY(0) translateX(0)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateY(-100vh) translateX(20px)', opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.4s ease-out backwards',
        'gold-shimmer': 'goldShimmer 3s linear infinite',
        'float-ember': 'floatEmber 6s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'breathe': 'breathe 4s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out backwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
