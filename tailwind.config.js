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
    extend: {},
  },
  plugins: [],
};
