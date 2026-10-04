import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        foe: {
          orange: "#F15A24",
          "orange-dark": "#EA580C",
          brown: "#4A2311",
          gold: "#D97706",
        },
      },
    },
  },
  plugins: [],
};

export default config;
