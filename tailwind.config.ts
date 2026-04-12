import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: '#C8391A',
        'brand-light': '#FBEAE6',
        gold: '#C49A2A',
        dark: '#1C1410',
        muted: '#6B6B6B',
        surface: '#FFFFFF',
        surface2: '#F5F4F1',
        border: '#D0CEC8',
      },
    },
  },
  plugins: [],
};
export default config;
