/** @type {import('tailwindcss').Config} */
// Tailwind dipakai KHUSUS untuk lapisan dashboard (admin/guru/siswa) yang
// meniru design system glassmorphic pada proyek referensi.
// preflight & container DIMATIKAN agar reset global Tailwind TIDAK merusak
// situs publik (landing page) yang memakai CSS murni + kelas ala-Bootstrap.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  corePlugins: {
    preflight: false,
    container: false,
  },
  theme: {
    extend: {
      colors: {
        // Palet mode gelap/terang (sama dengan referensi)
        dark: {
          bg: '#0a0a0a',
          surface: '#0f0f0f',
          elevated: '#1a1a1a',
        },
        light: {
          bg: '#F9EFE8',
          surface: '#ffffff',
          elevated: '#f5ebe0',
        },
        // Aksen oranye khas dashboard referensi
        accent: '#e8702a',
        // Token landing page (prototipe-smk8)
        primary: {
          DEFAULT: '#FE4000',
        },
        background: '#ffffff',
        foreground: '#0c1726',
        border: '#e5e4e7',
        ring: '#FE4000',
      },
      animation: {
        shimmer: 'shimmer 3s infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
}
