/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  safelist: [
    { pattern: /(bg|text|border|ring)-(orange|blue|red|yellow|emerald|purple)-(500|600)/ },
    { pattern: /(bg|text|border|ring)-(orange|blue|red|yellow|emerald|purple)-(500|600)\/\d+/ },
  ],
  theme: {
    extend: {
      // ★v5.14.0★ 行強調用アニメ (現在話してる指標を視覚化)
      animation: {
        'pulse-soft': 'pulse-soft 1.4s ease-in-out infinite',
        'bounce-x': 'bounce-x 0.9s ease-in-out infinite',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.78' },
        },
        'bounce-x': {
          '0%, 100%': { transform: 'translateY(-50%) translateX(0)' },
          '50%': { transform: 'translateY(-50%) translateX(4px)' },
        },
      },
    },
  },
  plugins: [],
};
