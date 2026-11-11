/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // 16-bit JRPG menu palette
        abyss: '#0A0E27',
        window: { DEFAULT: '#22349A', top: '#2E44B8', bottom: '#121C66', deep: '#0E1650' },
        frame: { DEFAULT: '#EEF1FB', shadow: '#05081C' },
        ink: { DEFAULT: '#F4F5FB', mist: '#A9B8EE', dim: '#7D8CC9' },
        gold: { DEFAULT: '#F2C14E', light: '#F8DA8A', dark: '#B98A1C' },
        jade: { DEFAULT: '#4ED18B', dark: '#2C9A60' },
        ember: { DEFAULT: '#F2703C', dark: '#B84A1E' },
        ruby: { DEFAULT: '#E5506A', dark: '#A8304A' },
      },
      fontFamily: {
        // Headings, menus, buttons, numbers
        display: ['"Jersey 10"', '"Arial Narrow"', 'sans-serif'],
        // Descriptions and dialog text
        body: ['DotGothic16', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
