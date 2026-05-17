import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        pitch: '#050d1a',
        cyan: '#00e5ff',
        lime: '#84ff00',
        magenta: '#ff1a8c',
        gold: '#ffd700',
        orange: '#ff6a00',
        purple: '#a855f7',
        rose: '#ff2050',
        panel: '#0a1628'
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(0,229,255,0.25), 0 0 32px rgba(0,229,255,0.18)',
        'glow-lime': '0 0 0 1px rgba(132,255,0,0.25), 0 0 32px rgba(132,255,0,0.18)',
        'glow-magenta': '0 0 0 1px rgba(255,26,140,0.25), 0 0 32px rgba(255,26,140,0.18)',
        'glow-orange': '0 0 0 1px rgba(255,106,0,0.25), 0 0 32px rgba(255,106,0,0.18)',
        'glow-purple': '0 0 0 1px rgba(168,85,247,0.25), 0 0 32px rgba(168,85,247,0.18)',
        'glow-gold': '0 0 0 1px rgba(255,215,0,0.25), 0 0 32px rgba(255,215,0,0.18)'
      },
      backgroundImage: {
        'hero-radial': 'radial-gradient(circle at top left, rgba(0,229,255,0.18), transparent 30%), radial-gradient(circle at top right, rgba(255,26,140,0.15), transparent 25%), radial-gradient(circle at bottom center, rgba(168,85,247,0.12), transparent 20%)',
        'panel-glow': 'radial-gradient(ellipse at top, rgba(0,229,255,0.08), transparent 60%)'
      }
    }
  },
  plugins: []
};

export default config;
