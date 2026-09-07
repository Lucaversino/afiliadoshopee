import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Cor de destaque dinâmica: cada página de produto seta
        // --accent / --accent-dark via inline style (ver product/[slug]/page.tsx)
        accent: 'var(--accent, #ff5722)',
        'accent-dark': 'var(--accent-dark, #c41e1e)',
        ink: '#12131a',
        paper: '#faf9f7',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
      },
      boxShadow: {
        glow: '0 20px 60px -15px var(--accent, #ff5722)',
      },
      perspective: {
        '1200': '1200px',
      },
    },
  },
  plugins: [],
};

export default config;
