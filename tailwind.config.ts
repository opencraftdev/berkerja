import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        background: '#F5F7FB',
        foreground: '#0F172A',
        card: '#FFFFFF',
        border: '#DCE3F1',
        primary: '#2563EB',
        muted: '#64748B',
        accent: '#EEF4FF',
      },
    },
  },
  plugins: [],
};

export default config;
