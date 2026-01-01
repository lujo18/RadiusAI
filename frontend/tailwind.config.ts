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
        // Radius Brand Colors
        obsidian: {
          DEFAULT: '#0B0B0C',
        },
        kinetic: {
          mint: '#10B981',
        },
        electric: {
          violet: '#8B5CF6',
        },
        ghost: {
          white: '#F8FAFC',
        },
        // For backwards compatibility, map primary/secondary
        primary: {
          500: '#10B981', // Kinetic Mint
        },
        secondary: {
          500: '#8B5CF6', // Electric Violet
        },
        background: {
          DEFAULT: '#0B0B0C', // Obsidian
        },
        surface: {
          DEFAULT: '#F8FAFC', // Ghost White
        },
      },
      // Glassmorphism utilities
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '40px',
        '3xl': '64px',
      },
      // Border radius presets
      borderRadius: {
        'card': '16px',
        'button': '10px',
        'input': '12px',
        'modal': '20px',
      },
      // Box shadows for glassmorphism
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-sm': '0 4px 16px 0 rgba(0, 0, 0, 0.25)',
        'glass-lg': '0 12px 48px 0 rgba(0, 0, 0, 0.5)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
        'inner-glow': 'inset 0 2px 4px 0 rgba(255, 255, 255, 0.06)',
      },
      // Background patterns
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
        'dark-gradient': 'linear-gradient(180deg, #0a0a0a 0%, #151515 100%)',
      },
      // Typography
      fontFamily: {
        'main': ['Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-lg': ['3.5rem', { lineHeight: '1.1', fontWeight: '700' }],
        'display': ['3rem', { lineHeight: '1.2', fontWeight: '700' }],
        'display-sm': ['2.5rem', { lineHeight: '1.2', fontWeight: '600' }],
      },
      // Animation
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'glow': 'glow 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        glow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [
    // Custom plugin for glassmorphism components
    function({ addComponents }: any) {
      addComponents({
        '.glass-card': {
          '@apply bg-white/5 backdrop-blur-md border border-white/10 rounded-card shadow-glass': {},
        },
        '.glass-card-hover': {
          '@apply glass-card hover:bg-white/10 hover:border-white/20 transition-all duration-300': {},
        },
        '.dark-card': {
          '@apply bg-obsidian border border-white/5 rounded-card shadow-card': {},
        },
        '.dark-card-hover': {
          '@apply dark-card hover:bg-background hover:shadow-card-hover transition-all duration-300': {},
        },
        '.stat-card': {
          '@apply glass-card p-6 hover:bg-white/10 transition-all duration-300': {},
        },
        '.btn-primary': {
          '@apply bg-kinetic-mint hover:bg-kinetic-mint/80 text-obsidian font-medium px-6 py-2.5 rounded-button transition-all duration-200 shadow-lg hover:shadow-kinetic-mint/50': {},
        },
        '.btn-secondary': {
          '@apply bg-white/10 hover:bg-white/20 text-white font-medium px-6 py-2.5 rounded-button backdrop-blur-md border border-white/10 transition-all duration-200': {},
        },
        '.btn-ghost': {
          '@apply bg-transparent hover:bg-white/5 text-gray-300 hover:text-white font-medium px-4 py-2 rounded-button transition-all duration-200': {},
        },
        '.input-field': {
          '@apply bg-obsidian border border-white/10 rounded-input px-4 py-2.5 text-white placeholder-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all': {},
        },
        '.sidebar-item': {
          '@apply flex items-center gap-3 px-4 py-3 rounded-button text-ghost-white/50 hover:text-ghost-white hover:bg-white/5 transition-all duration-200 cursor-pointer': {},
        },
        '.sidebar-item-active': {
          '@apply sidebar-item bg-kinetic-mint/10 text-kinetic-mint border border-kinetic-mint/20': {},
        },
        '.metric-positive': {
          '@apply text-green-400 flex items-center gap-1': {},
        },
        '.metric-negative': {
          '@apply text-red-400 flex items-center gap-1': {},
        },
        '.badge': {
          '@apply inline-flex items-center px-3 py-1 rounded-full text-xs font-medium': {},
        },
        '.badge-blue': {
          '@apply badge bg-blue-500/10 text-blue-400 border border-blue-500/20': {},
        },
        '.badge-green': {
          '@apply badge bg-green-500/10 text-green-400 border border-green-500/20': {},
        },
        '.badge-orange': {
          '@apply badge bg-orange-500/10 text-orange-400 border border-orange-500/20': {},
        },
        '.badge-purple': {
          '@apply badge bg-purple-500/10 text-purple-400 border border-purple-500/20': {},
        },
        '.gradient-text': {
          '@apply bg-gradient-to-r from-kinetic-mint to-electric-violet bg-clip-text text-transparent': {},
        },
        '.chart-container': {
          '@apply glass-card p-6': {},
        },
        '.table-row': {
          '@apply hover:bg-white/5 transition-colors border-b border-white/5': {},
        },
      });
    },
  ],
};
export default config;
