/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          200: "#D5DAE1"
        },
        black: {
          DEFAULT: "#000",
          500: "#1D2235"
        },
        blue: {
          500: "#2b77e7"
        },
        accent: "#FF6B35",
      },
      fontFamily: {
        // Unified type system — mirrors CSS variables in index.css
        display: ['"Space Grotesk"', "sans-serif"],
        body:    ['"Space Grotesk"', "sans-serif"],
        mono:    ['"Space Mono"', "monospace"],  // overrides Tailwind built-in font-mono
        accent:  ['"Bitcount Prop Double"', "serif"],
      },
      boxShadow: {
        card: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)'
      }
    },
  },
  plugins: [],
}

