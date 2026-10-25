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
        cream: {
          50: '#FFFDF9',
          100: '#FBF7EF',
          200: '#F3EBDD',
          300: '#E8DCC8',
          400: '#D4C5A9',
          500: '#BFA97E',
        },
        sand: {
          100: '#F8F3EB',
          200: '#F3EBDD',
          300: '#E8DCC8',
          400: '#D4C5A9',
        },
        ink: {
          DEFAULT: '#2B2A28',
          50: '#F5F5F4',
          100: '#E5E4E3',
          200: '#C5C4C2',
          300: '#A5A3A0',
          400: '#85837F',
          500: '#65635F',
          600: '#4B4A47',
          700: '#3B3A38',
          800: '#2B2A28',
          900: '#1B1A18',
        },
        teal: {
          DEFAULT: '#1F7A8C',
          50: '#E8F4F6',
          100: '#C5E4E9',
          200: '#9FD3DB',
          300: '#79C1CD',
          400: '#4FA9B8',
          500: '#1F7A8C',
          600: '#1A6576',
          700: '#155060',
          800: '#103B4A',
          900: '#0B2634',
        },
        saffron: {
          DEFAULT: '#F28C28',
          50: '#FEF3E6',
          100: '#FDE0BF',
          200: '#FBCC95',
          300: '#F9B86B',
          400: '#F4A24A',
          500: '#F28C28',
          600: '#D97A20',
          700: '#BF6918',
          800: '#A65810',
          900: '#8C4808',
        },
        risk: {
          low: '#4CAF7A',
          moderate: '#F2B134',
          high: '#EE7B30',
          severe: '#D9453D',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
        noto: ['Noto Sans', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(43, 42, 40, 0.06)',
        'soft-md': '0 4px 16px rgba(43, 42, 40, 0.08)',
        'soft-lg': '0 8px 32px rgba(43, 42, 40, 0.10)',
        'soft-xl': '0 12px 48px rgba(43, 42, 40, 0.12)',
        'glow-teal': '0 0 20px rgba(31, 122, 140, 0.15)',
        'glow-saffron': '0 0 20px rgba(242, 140, 40, 0.15)',
        'card-hover': '0 8px 30px rgba(43, 42, 40, 0.12)',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease-out forwards',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-down': 'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.2s ease-out forwards',
        'shimmer': 'shimmer 2s infinite linear',
        'pulse-glow': 'pulseGlow 2s infinite ease-in-out',
        'gauge-sweep': 'gaugeSweep 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'count-up': 'countUp 1s ease-out forwards',
        'rain-drop': 'rainDrop 1.5s infinite linear',
        'sun-glow': 'sunGlow 3s infinite ease-in-out',
        'breathing': 'breathing 2s infinite ease-in-out',
        'float': 'float 3s infinite ease-in-out',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(217, 69, 61, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(217, 69, 61, 0.6)' },
        },
        gaugeSweep: {
          '0%': { strokeDashoffset: '283' },
          '100%': { strokeDashoffset: 'var(--gauge-target)' },
        },
        countUp: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        rainDrop: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '10%': { opacity: '1' },
          '100%': { transform: 'translateY(60px)', opacity: '0' },
        },
        sunGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(242, 140, 40, 0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(242, 140, 40, 0.4)' },
        },
        breathing: {
          '0%, 100%': { opacity: '0.7' },
          '50%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      backgroundImage: {
        'gradient-cream': 'linear-gradient(135deg, #FBF7EF 0%, #F3EBDD 100%)',
        'gradient-teal': 'linear-gradient(135deg, #1F7A8C 0%, #155060 100%)',
        'gradient-saffron': 'linear-gradient(135deg, #F28C28 0%, #D97A20 100%)',
        'gradient-risk-low': 'linear-gradient(135deg, #4CAF7A 0%, #3D9466 100%)',
        'gradient-risk-moderate': 'linear-gradient(135deg, #F2B134 0%, #D99A20 100%)',
        'gradient-risk-high': 'linear-gradient(135deg, #EE7B30 0%, #D56A20 100%)',
        'gradient-risk-severe': 'linear-gradient(135deg, #D9453D 0%, #BF3830 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
