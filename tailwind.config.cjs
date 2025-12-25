/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"] ,
  theme: {
    extend: {
      colors: {
        slate: {
          950: "#0b1220"
        }
      }
    }
  },
  plugins: []
};
