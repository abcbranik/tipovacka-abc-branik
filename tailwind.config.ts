import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palette derived from the club crest (ABC Braník): steel blue,
        // near-black, and white. See README "Vzhled a branding" section.
        club: {
          primary: "#4a86b3",
          "primary-dark": "#1c3a4f",
          "primary-light": "#eaf2f8",
          ink: "#111111",
        },
      },
    },
  },
  plugins: [],
};

export default config;
