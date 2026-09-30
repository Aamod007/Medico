/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pharmico: {
          dark: "#0B4A3A",
          emerald: "#10B981",
          yellow: "#F5C043",
          tint: "#F4F6F5",
          cream: "#FAF3EA",
          lime: "#E6F4B8",
          peach: "#FDE6D3",
          lightblue: "#DCEBFA",
          text: "#0F2A22",
          muted: "#5B6B65",
          border: "#D7DEDB",
        },
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "Manrope", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "24px",
      },
    },
  },
  plugins: [],
};
