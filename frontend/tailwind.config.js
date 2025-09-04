/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#0B0F14",
        accent: "#4ADE80",
        accent2: "#60A5FA"
      }
    },
  },
  plugins: [],
}
