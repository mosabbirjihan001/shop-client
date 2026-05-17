/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // 👈 This MUST cover all subfolders in src
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
}