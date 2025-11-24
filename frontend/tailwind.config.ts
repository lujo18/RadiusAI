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
        primary: {
          50: '#fff1f7',
          100: '#ffe4f0',
          200: '#ffc9e1',
          300: '#ff9dc9',
          400: '#ff60a7',
          500: '#ff4f8b',
          600: '#f01d65',
          700: '#d10f4f',
          800: '#ad1042',
          900: '#90133b',
        },
      },
    },
  },
  plugins: [],
};
export default config;
