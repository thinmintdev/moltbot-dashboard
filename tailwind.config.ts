import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // AutoClaude color scheme
        background: "#0a0a0b",
        sidebar: "#111113",
        card: "#18181b",
        border: "#27272a",
        muted: "#71717a",
        yellow: "#eab308",
        // Status colors
        error: "#ef4444",
        success: "#22c55e",
        progress: "#3b82f6",
        review: "#a855f7",
        planning: "#eab308",
        // Legacy theme colors (for compatibility)
        theme: {
          50: "#fafafa",
          100: "#f4f4f5",
          200: "#e4e4e7",
          300: "#d4d4d8",
          400: "#a1a1aa",
          500: "#71717a",
          600: "#52525b",
          700: "#3f3f46",
          800: "#27272a",
          900: "#18181b",
          950: "#0a0a0b",
        },
      },
    },
  },
  plugins: [],
}
export default config
