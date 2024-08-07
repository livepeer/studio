/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./layouts/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: {
          DEFAULT: "hsl(var(--border))",
        },
        background: {
          DEFAULT: "hsl(var(--background))",
        },
        foreground: {
          DEFAULT: "hsl(var(--foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
        },
        surface: {
          DEFAULT: "hsl(var(--surface))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
        },
      },
    },
  },
  plugins: [],
};
