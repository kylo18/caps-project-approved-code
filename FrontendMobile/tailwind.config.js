/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // CAPS brand colors from current design
        primary: '#FE6902',
        'primary-dark': '#E55A00',
        'primary-light': '#FF8533',
        secondary: '#1E293B',
        // Add more custom colors as needed
      },
      fontFamily: {
        'open-sans': ['OpenSans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
