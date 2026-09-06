/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#090d16',
        surface: '#111827',
        'surface-card': '#162032',
        'surface-light': '#1e293b',
        accent: '#06b6d4',
        'accent-hover': '#0891b2',
        primary: '#3b82f6',
        neon: {
          cyan: '#06b6d4',
          purple: '#8b5cf6',
          pink: '#f43f5e',
          green: '#10b981',
          yellow: '#f59e0b',
        }
      },
      boxShadow: {
        'neon-cyan': '0 0 20px -3px rgba(6, 182, 212, 0.45)',
        'neon-purple': '0 0 20px -3px rgba(139, 92, 246, 0.45)',
        'neon-pink': '0 0 20px -3px rgba(244, 63, 94, 0.45)',
        'dark-card': '0 10px 30px -10px rgba(0, 0, 0, 0.7)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.35s ease-out',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce': 'bounce 1s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
