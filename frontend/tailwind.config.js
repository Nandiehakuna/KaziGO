/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        kazi: {
          green: "#1D9E75",
          "green-dark": "#085041",
          "green-light": "#E1F5EE",
          purple: "#534AB7",
          "purple-light": "#EEEDFE",
          amber: "#BA7517",
          "amber-light": "#FAEEDA",
          coral: "#993C1D",
          "coral-light": "#FAECE7",
          blue: "#185FA5",
          "blue-light": "#E6F1FB",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
}
