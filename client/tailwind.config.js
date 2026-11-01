/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        earth: {
          bg: '#F5EFE6',         // Warm Beige
          surface: '#FBF7F1',    // Cream / Warm White Card
          sand: '#E3D5C0',       // Sand Border & Accent
          primary: '#6B4F3A',    // Primary Brown
          deep: '#3E2C20',       // Deep Brown (Headings, Sidebar)
          terracotta: '#B5651D', // Terracotta Accent (CTAs, Highlights)
          olive: '#7A8450',      // Muted Olive (Positive Trends)
          clay: '#A8452F',       // Clay Red (Negative Trends / Risks)
          text: '#3E2C20',       // Text on Light
          muted: '#7D6B5D',      // Muted Secondary Text
        }
      },
      fontFamily: {
        serif: ['Lora', 'Merriweather', 'serif'],
        sans: ['DM Sans', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        'warm': '0 4px 20px -2px rgba(62, 44, 32, 0.06)',
        'warm-lg': '0 10px 30px -4px rgba(62, 44, 32, 0.1)',
      }
    },
  },
  plugins: [],
}

