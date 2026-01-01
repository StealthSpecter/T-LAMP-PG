/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        powergrid: {
          green: '#22c55e',
          blue: '#3b82f6',
          red: '#ef4444',
          orange: '#f97316'
        }
      }
    },
  },
  plugins: [],
}
