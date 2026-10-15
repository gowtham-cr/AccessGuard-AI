/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070D19',
          900: '#0B1329',
          850: '#0F1A36',
          800: '#142347',
          700: '#1E3363',
          600: '#2A4685',
        },
        teal: {
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
        },
        barrier: {
          critical: '#EF4444',
          serious: '#F97316',
          moderate: '#F59E0B',
          minor: '#3B82F6',
        },
        glass: {
          panel: 'rgba(13, 20, 38, 0.65)',
          surface: 'rgba(16, 24, 46, 0.55)',
          border: 'rgba(255, 255, 255, 0.09)',
          'border-highlight': 'rgba(255, 255, 255, 0.18)',
        }
      },
      boxShadow: {
        'glow-purple': '0 0 25px -4px rgba(139, 92, 246, 0.45)',
        'glow-blue': '0 0 25px -4px rgba(59, 130, 246, 0.45)',
        'glass-card': '0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}
