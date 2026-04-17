/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Primary Brand Color - CAPS Orange
        primary: {
          DEFAULT: '#FE6902',
          dark: '#E55A00',
          light: '#FF8533',
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#FE6902',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        // Student theme colors
        student: {
          bg: '#FF7A00',
          card: '#FFFFFF',
          text: '#1F2937',
          muted: '#6B7280',
          accent: '#FE6902',
        },
        // Background colors
        background: {
          light: '#FFFFFF',
          dark: '#0A0A0A',
          secondary: {
            light: '#F9FAFB',
            dark: '#111111',
          },
        },
        // Text colors
        foreground: {
          light: '#111827',
          dark: '#F9FAFB',
          muted: {
            light: '#6B7280',
            dark: '#9CA3AF',
          },
        },
        // Border colors
        border: {
          light: '#E5E7EB',
          dark: '#374151',
        },
        // Status colors
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
        // CAPS design-system colors (match studentColors object)
        caps: {
          orange: '#FF6E00',
          white: '#FFFFFF',
          text: '#0C092A',
          muted: '#858494',
          border: '#EFEEFC',
          'border-soft': '#F6F2FF',
          pink: '#FFD6DD',
          'pink-soft': '#FFC2CD',
          blue: '#C4D0FB',
          surface: '#FFF7F1',
          'surface-soft': '#FFF1E9',
          pale: '#F8F6FF',
          success: '#86D2A8',
          gold: '#FFD45C',
          silver: '#C9CBD7',
          bronze: '#D89757',
        },
      },
      fontFamily: {
        sans: ['Rubik', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
