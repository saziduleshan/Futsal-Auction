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
        pitch: '#07111f',
        cyan: '#11d5ff',
        lime: '#a3ff12',
        magenta: '#ff3cac',
        gold: '#f8cf52',
        panel: '#0d1b2f'
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(17,213,255,0.25), 0 0 32px rgba(17,213,255,0.18)'
      },
      backgroundImage: {
        'hero-radial': 'radial-gradient(circle at top, rgba(17,213,255,0.18), transparent 28%), radial-gradient(circle at bottom right, rgba(255,60,172,0.18), transparent 20%)'
      }
    }
  },
  plugins: []
};

export default config;
