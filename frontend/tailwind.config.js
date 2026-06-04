/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        teal: { 50:'#f0fdf9', 100:'#ccfbef', 200:'#99f6e0', 300:'#5eead4', 400:'#2dd4bf', 500:'#14b8a6', 600:'#0f766e', 700:'#0d5d5a', 800:'#0a4744', 900:'#083532' },
      },
    },
  },
  plugins: [],
}
