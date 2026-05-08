/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        serif:   ['"Cormorant Garamond"', 'Georgia', 'serif'],
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      colors: {
        /* ── Brand Gold ── elegant warm accent inspired by the logo_white tones */
        brand: {
          50:  '#faf8f0',
          100: '#f5f0dc',
          200: '#ebe0b8',
          300: '#dccb8a',
          400: '#c9b162',
          500: '#b89b47',
          600: '#a3843a',
          700: '#866a31',
          800: '#6e562d',
          900: '#5c4829',
          950: '#352714',
        },
        /* ── Surface: sophisticated dark neutrals ── */
        surface: {
          50:  '#f7f7f6',
          100: '#eeeded',
          200: '#dedddb',
          300: '#c5c3c0',
          400: '#a09d98',
          500: '#7c7872',
          600: '#5e5a55',
          700: '#48453f',
          800: '#302e2a',
          900: '#1e1d1a',
          950: '#121110',
        },
        accent: {
          50:  '#f9f6f0',
          100: '#f0e8d5',
          200: '#e2d0ac',
          300: '#d1b37e',
          400: '#c49b5c',
          500: '#b5864a',
          600: '#9e6c3c',
          700: '#825434',
          800: '#6b4530',
          900: '#5a3b2b',
        },
      },
      boxShadow: {
        'card':     '0 1px 3px 0 rgb(0 0 0 / 0.15), 0 4px 12px 0 rgb(0 0 0 / 0.08)',
        'card-lg':  '0 4px 6px -1px rgb(0 0 0 / 0.12), 0 10px 25px -5px rgb(0 0 0 / 0.15)',
        'glow':     '0 0 0 3px rgb(184 155 71 / 0.15)',
        'glow-sm':  '0 0 0 2px rgb(184 155 71 / 0.12)',
        'elegant':  '0 2px 20px 0 rgb(0 0 0 / 0.25)',
      },
      backgroundImage: {
        'gradient-brand':  'linear-gradient(135deg, #c9b162 0%, #b89b47 50%, #a3843a 100%)',
        'gradient-dark':   'linear-gradient(180deg, #1e1d1a 0%, #121110 100%)',
        'gradient-sidebar':'linear-gradient(180deg, #18171a 0%, #0f0e10 100%)',
      },
      borderRadius: {
        'elegant': '10px',
      },
    },
  },
  plugins: [],
};
