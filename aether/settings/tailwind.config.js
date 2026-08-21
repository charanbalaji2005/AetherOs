/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aether: {
          dark: "#0a0e1a",
          card: "#13192b",
          border: "#1b2238",
          cyan: "#00f0ff",
          purple: "#a855f7",
          pink: "#f43f5e"
        }
      }
    },
  },
  plugins: [],
}
