/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Liquid Metal / Chrome palette
        mercury: {
          50: '#FEFEFE',
          100: '#FAFAFA',  // Highlights
          200: '#E4E4E7',
          300: '#D4D4D8',  // Base Chrome
          400: '#A1A1AA',
          500: '#71717A',
          600: '#52525B',  // Shadows
          700: '#3F3F46',
          800: '#27272A',
          900: '#18181B',  // Deep Metal
          950: '#09090B',
        },
        chrome: {
          light: 'rgba(255, 255, 255, 0.9)',
          mid: 'rgba(212, 212, 216, 0.8)',
          dark: 'rgba(82, 82, 91, 0.9)',
          reflection: 'rgba(255, 255, 255, 0.4)',
        },
        accent: {
          acid: '#CCFF00',        // Neon Acid Green for active states
          cyan: '#00FFFF',        // Neon Cyan alternative
          glow: '#B8FF00',        // Acid glow variant
        },
        status: {
          speaking: '#CCFF00',    // Acid green for speaking
          online: '#00FF88',      // Softer green for connected
          alert: '#FF3366',       // Vibrant pink-red for errors
          warning: '#FFAA00',     // Amber warning
          muted: '#71717A',       // Mercury gray for muted
        },
        glass: {
          light: 'rgba(255, 255, 255, 0.1)',
          medium: 'rgba(255, 255, 255, 0.2)',
          heavy: 'rgba(255, 255, 255, 0.3)',
          border: 'rgba(255, 255, 255, 0.4)',
        },
      },
      fontFamily: {
        display: ['Orbitron', 'Syncopate', 'sans-serif'],
        body: ['Exo 2', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        // Metallic gradients
        'chrome-gradient': 'linear-gradient(135deg, #FAFAFA 0%, #D4D4D8 25%, #A1A1AA 50%, #D4D4D8 75%, #FAFAFA 100%)',
        'chrome-vertical': 'linear-gradient(180deg, #FAFAFA 0%, #A1A1AA 50%, #D4D4D8 100%)',
        'mercury-pool': 'radial-gradient(ellipse at center, #3F3F46 0%, #27272A 40%, #18181B 70%, #09090B 100%)',
        'mercury-deep': 'radial-gradient(ellipse at 30% 20%, #3F3F46 0%, #27272A 30%, #18181B 60%, #09090B 100%)',
        'liquid-shine': 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
        'acid-glow': 'radial-gradient(ellipse at center, rgba(204, 255, 0, 0.3) 0%, transparent 70%)',
        'cyan-glow': 'radial-gradient(ellipse at center, rgba(0, 255, 255, 0.3) 0%, transparent 70%)',
      },
      boxShadow: {
        'chrome': '0 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(0, 0, 0, 0.2)',
        'chrome-lg': '0 8px 40px rgba(0, 0, 0, 0.5), inset 0 2px 0 rgba(255, 255, 255, 0.4), inset 0 -2px 0 rgba(0, 0, 0, 0.3)',
        'chrome-inset': 'inset 0 2px 10px rgba(0, 0, 0, 0.4), inset 0 -1px 0 rgba(255, 255, 255, 0.2)',
        'mercury-drop': '0 10px 40px rgba(0, 0, 0, 0.6), 0 2px 10px rgba(0, 0, 0, 0.4)',
        'acid-glow': '0 0 20px rgba(204, 255, 0, 0.5), 0 0 40px rgba(204, 255, 0, 0.3)',
        'acid-glow-sm': '0 0 10px rgba(204, 255, 0, 0.4), 0 0 20px rgba(204, 255, 0, 0.2)',
        'cyan-glow': '0 0 20px rgba(0, 255, 255, 0.5), 0 0 40px rgba(0, 255, 255, 0.3)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
      },
      animation: {
        'liquid-pulse': 'liquid-pulse 2s ease-in-out infinite',
        'chrome-shimmer': 'chrome-shimmer 3s ease-in-out infinite',
        'acid-ripple': 'acid-ripple 1.5s ease-out infinite',
        'speaking-chrome': 'speaking-chrome 0.8s ease-in-out infinite alternate',
        'mercury-blob': 'mercury-blob 4s ease-in-out infinite',
        'glint': 'glint 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        'liquid-pulse': {
          '0%, 100%': {
            transform: 'scale(1)',
            opacity: '1',
          },
          '50%': {
            transform: 'scale(1.02)',
            opacity: '0.95',
          },
        },
        'chrome-shimmer': {
          '0%': {
            backgroundPosition: '-200% center',
          },
          '100%': {
            backgroundPosition: '200% center',
          },
        },
        'acid-ripple': {
          '0%': {
            boxShadow: '0 0 0 0 rgba(204, 255, 0, 0.6)',
            opacity: '1',
          },
          '100%': {
            boxShadow: '0 0 0 20px rgba(204, 255, 0, 0)',
            opacity: '0',
          },
        },
        'speaking-chrome': {
          '0%': {
            boxShadow: '0 0 10px rgba(204, 255, 0, 0.4), 0 0 20px rgba(204, 255, 0, 0.2), inset 0 0 10px rgba(204, 255, 0, 0.1)',
            filter: 'drop-shadow(0 0 5px rgba(204, 255, 0, 0.5))',
          },
          '100%': {
            boxShadow: '0 0 20px rgba(204, 255, 0, 0.8), 0 0 40px rgba(204, 255, 0, 0.4), inset 0 0 15px rgba(204, 255, 0, 0.2)',
            filter: 'drop-shadow(0 0 10px rgba(204, 255, 0, 0.8))',
          },
        },
        'mercury-blob': {
          '0%, 100%': {
            borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
          },
          '50%': {
            borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%',
          },
        },
        'glint': {
          '0%, 100%': {
            opacity: '0',
            transform: 'translateX(-100%) rotate(45deg)',
          },
          '50%': {
            opacity: '1',
          },
          '100%': {
            opacity: '0',
            transform: 'translateX(100%) rotate(45deg)',
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
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
