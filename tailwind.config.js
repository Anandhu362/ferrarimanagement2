// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#2B2640', 
          light: '#5F558C',
          bg: '#F9F9FB',   
        }
      },
    },
  },
  plugins: [],
}