import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          coral: '#FF6B6B',
          navy: '#2C3E50',
          mint: '#4ECDC4',
          yellow: '#FFD93D',
        },
        secondary: {
          lightCoral: '#FFB4B4',
          lightMint: '#A8E6E2',
          sand: '#FFE4B5',
          lavender: '#E6E6FA',
        },
        neutral: {
          white: '#FFFFFF',
          lightest: '#F8F9FA',
          light: '#E9ECEF',
          medium: '#CED4DA',
          dark: '#6C757D',
          darkest: '#343A40',
        },
      },
      backgroundImage: {
        'paw-pattern': "url('/patterns/paw-pattern.svg')",
      },
      boxShadow: {
        'soft': '0 2px 15px rgba(0, 0, 0, 0.05)',
        'medium': '0 4px 20px rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config; 