// tailwind.config.ts
import { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'my-custom-color': '#f00',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};

export default config;