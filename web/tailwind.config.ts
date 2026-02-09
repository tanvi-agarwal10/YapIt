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
        ink: '#0b0f1a',
        panel: '#0f1625',
        'panel-2': '#141c2f',
        'panel-3': '#1a2340',
        neon: {
          blue: '#4cc3ff',
          purple: '#9b6bff',
          pink: '#ff5ce6',
        },
        accent: '#7c5cff',
        muted: '#94a3b8',
      },
      fontFamily: {
        sans: ['var(--font-manrope)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 14px 40px rgba(5, 10, 25, 0.45)',
        glow: '0 0 24px rgba(124, 92, 255, 0.45)',
        glowBlue: '0 0 28px rgba(76, 195, 255, 0.45)',
      },
      backgroundImage: {
        'radial-glow': 'radial-gradient(600px circle at 20% 10%, rgba(124, 92, 255, 0.16), transparent 55%)',
        'radial-glow-2': 'radial-gradient(520px circle at 80% 20%, rgba(76, 195, 255, 0.18), transparent 55%)',
        'radial-glow-3': 'radial-gradient(420px circle at 60% 80%, rgba(255, 92, 230, 0.16), transparent 55%)',
      },
      keyframes: {
        'message-in': {
          '0%': { opacity: '0', transform: 'translateY(6px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 18px rgba(124, 92, 255, 0.35)' },
          '50%': { boxShadow: '0 0 26px rgba(76, 195, 255, 0.45)' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(-12px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      animation: {
        'message-in': 'message-in 0.28s ease-out',
        'fade-in': 'fade-in 0.35s ease-out',
        'pulse-glow': 'pulse-glow 2.4s ease-in-out infinite',
        'slide-in': 'slide-in 0.3s ease-out',
      },
    },
  },
  plugins: [],
}
export default config
