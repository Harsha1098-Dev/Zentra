import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1E3A8A', // Primary Navy
          hover: '#1D4ED8',
          soft: '#E0E7FF',
        },
        background: {
          DEFAULT: '#F6F8FB',
          surface: '#FFFFFF',
        },
        border: {
          DEFAULT: '#E2E8F0',
        },
        zentra: {
          text: '#0F172A',
          secondary: '#475569',
          muted: '#64748B',
          success: '#059669',
          warning: '#D97706',
          danger: '#DC2626',
          info: '#2563EB',
        },
      },
    },
  },
  plugins: [],
};

export default config;
