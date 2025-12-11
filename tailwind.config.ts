import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: "hsl(var(--secondary))",
        accent: "hsl(var(--accent))",
        muted: "hsl(var(--muted))",
        border: "hsl(var(--border))",
        terracotta: {
          DEFAULT: "hsl(var(--terracotta))",
          light: "hsl(var(--terracotta-light))",
          dark: "hsl(var(--terracotta-dark))",
        },
        olive: {
          DEFAULT: "hsl(var(--olive))",
          light: "hsl(var(--olive-light))",
          dark: "hsl(var(--olive-dark))",
        },
        cream: {
          DEFAULT: "hsl(var(--cream))",
          dark: "hsl(var(--cream-dark))",
        },
        charcoal: {
          DEFAULT: "hsl(var(--charcoal))",
          light: "hsl(var(--charcoal-light))",
        },
        sage: "hsl(var(--sage))",
        paprika: "hsl(var(--paprika))",
      },
      animation: {
        "slide-up": "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in": "fadeIn 0.3s ease-out",
        "scale-in": "scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
