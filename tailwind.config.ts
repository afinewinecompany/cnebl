import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Heritage Diamond - Retro Baseball Theme
        leather: {
          DEFAULT: "#8B4513",
          light: "#A0522D",
          dark: "#6B3410",
        },
        dugout: {
          DEFAULT: "#5D4E37",
          light: "#7A6B52",
          dark: "#3D3225",
        },
        field: {
          DEFAULT: "#2D5A27",
          light: "#3D7A35",
          dark: "#1D3A17",
        },
        cream: {
          DEFAULT: "#F5F0E1",
          light: "#FAF8F3",
          dark: "#E8E0C8",
        },
        navy: {
          DEFAULT: "#1B3A5F",
          light: "#2B5A8F",
          dark: "#0B1A2F",
        },
        cardinal: {
          DEFAULT: "#BE1E2D",
          light: "#DE3E4D",
          dark: "#8E0E1D",
        },
        gold: {
          DEFAULT: "#C9A227",
          light: "#E9C247",
          dark: "#A98207",
        },
        charcoal: {
          DEFAULT: "#2C2C2C",
          light: "#4C4C4C",
          dark: "#1C1C1C",
        },
        chalk: "#FFFFFF",
        ivory: "#FAF8F3",
      },
      fontFamily: {
        display: ["var(--font-clarendon)", "Georgia", "serif"],
        headline: ["var(--font-oswald)", "sans-serif"],
        body: ["var(--font-source-serif)", "Georgia", "serif"],
        mono: ["var(--font-ibm-plex-mono)", "monospace"],
        script: ["var(--font-pacifico)", "cursive"],
      },
      backgroundImage: {
        "leather-texture": "url('/textures/leather.png')",
        "paper-texture": "url('/textures/aged-paper.png')",
        "grass-texture": "url('/textures/grass.png')",
      },
      boxShadow: {
        card: "0 2px 8px rgba(93, 78, 55, 0.15)",
        "card-hover": "0 4px 16px rgba(93, 78, 55, 0.25)",
        button: "0 2px 4px rgba(139, 69, 19, 0.3)",
      },
      borderRadius: {
        retro: "4px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
