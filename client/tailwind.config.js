/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Tactical color palette - R6S inspired
        tactical: {
          base: '#0D0D0D',
          surface: '#262626',
          elevated: '#333333',
          border: '#404040',
        },
        text: {
          primary: '#F2F2F2',
          secondary: '#A3A3A3',
          muted: '#666666',
        },
        accent: {
          action: '#FF8C00',
          'action-hover': '#FF9F2E',
          highlight: '#FFEE00',
        },
        status: {
          online: '#4DE94C',
          alert: '#F60000',
          warning: '#FFB800',
          muted: '#6B7280',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Rajdhani', 'Roboto Condensed', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 1.5s ease-in-out infinite',
        'speaking-glow': 'speaking-glow 0.8s ease-in-out infinite alternate',
        'speaking-glow-filter': 'speaking-glow-filter 0.8s ease-in-out infinite alternate',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
        'scan-line': 'scan-line 2s linear infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': {
            boxShadow: '0 0 5px rgba(77, 233, 76, 0.5), 0 0 10px rgba(77, 233, 76, 0.3)'
          },
          '50%': {
            boxShadow: '0 0 15px rgba(77, 233, 76, 0.8), 0 0 25px rgba(77, 233, 76, 0.5)'
          },
        },
        'speaking-glow': {
          '0%': {
            boxShadow: '0 0 5px rgba(77, 233, 76, 0.4), 0 0 10px rgba(77, 233, 76, 0.2), inset 0 0 5px rgba(77, 233, 76, 0.1)'
          },
          '100%': {
            boxShadow: '0 0 15px rgba(77, 233, 76, 0.9), 0 0 30px rgba(77, 233, 76, 0.5), inset 0 0 10px rgba(77, 233, 76, 0.2)'
          },
        },
        'speaking-glow-filter': {
          '0%': {
            filter: 'drop-shadow(0 0 4px rgba(77, 233, 76, 0.6)) drop-shadow(0 0 8px rgba(77, 233, 76, 0.3))'
          },
          '100%': {
            filter: 'drop-shadow(0 0 8px rgba(77, 233, 76, 0.9)) drop-shadow(0 0 16px rgba(77, 233, 76, 0.5))'
          },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
      clipPath: {
        'corner-cut': 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
      },
    },
  },
  plugins: [],
};
