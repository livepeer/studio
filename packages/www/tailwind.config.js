/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: {
          DEFAULT: "hsl(var(--color-border))",
        },
        background: {
          DEFAULT: "hsl(var(--color-background))",
        },
        foreground: {
          DEFAULT: "hsl(var(--color-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--color-muted))",
        },
        surface: {
          DEFAULT: "hsl(var(--color-surface))",
        },
        accent: {
          DEFAULT: "hsl(var(--color-accent))",
        },
      },
    },
  },
  plugins: [],
};
