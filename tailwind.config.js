/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#07070C',
          900: '#0B0B13',
          850: '#0E0E18',
          800: '#12121D',
          700: '#1A1A28',
          600: '#232334',
        },
        crimson: {
          400: '#FB7185',
          500: '#F43F5E',
          600: '#E11D48',
        },
        cyber: {
          300: '#67E8F9',
          400: '#22D3EE',
          500: '#06B6D4',
        },
        pack: {
          400: '#4ADE80',
          500: '#34D399',
          600: '#10B981',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 40px -12px rgba(244, 63, 94, 0.45)',
        'glow-cyan': '0 0 40px -12px rgba(34, 211, 238, 0.45)',
        'glow-pack': '0 0 32px -10px rgba(52, 211, 153, 0.6)',
        dock: '0 24px 60px -20px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255,255,255,0.06)',
      },
      backgroundImage: {
        'grid-fade':
          'radial-gradient(circle at 50% 0%, rgba(244,63,94,0.12), transparent 55%), radial-gradient(circle at 85% 15%, rgba(34,211,238,0.10), transparent 45%)',
      },
      animation: {
        'pulse-ring': 'pulse-ring 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'float-slow 9s ease-in-out infinite',
        'shimmer': 'shimmer 2.4s linear infinite',
        'ping-slow': 'ping-slow 2.8s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        'pulse-ring': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.45', transform: 'scale(0.97)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'ping-slow': {
          '0%': { transform: 'scale(1)', opacity: '0.7' },
          '75%, 100%': { transform: 'scale(2.2)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
