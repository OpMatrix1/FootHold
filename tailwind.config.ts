import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#14161F',
        coal: '#1E2130',
        ember: '#FF7A45',
        amber: '#FFC85C',
        fog: '#F5F1EA',
        line: 'rgba(255,255,255,0.12)',
      },
      fontFamily: {
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
        body: ['Inter', 'Public Sans', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 18px 48px rgba(255, 122, 69, 0.18)',
      },
    },
  },
  plugins: [],
} satisfies Config;
