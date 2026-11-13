import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  Sun, 
  Moon, 
  Home,
  Building2,
  GraduationCap, 
  Trophy,
  Sparkles,
  Users,
  BookOpen, 
  Phone,
  LayoutDashboard,
  Compass
} from 'lucide-react';
import { ASSETS } from '../data/assets';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import GlassIcons from './ui/GlassIcons';
import './Navbar.css';

const NAV_ITEMS_BASE = [
  { id: 'beranda', label: 'Beranda', href: '#beranda', icon: <Home size={18} strokeWidth={2.2} />, color: 'orange' },
  { id: 'profil', label: 'Profil', href: '#profil', icon: <Building2 size={18} strokeWidth={2.2} />, color: 'blue' },
  { id: 'jurusan', label: 'Jurusan', href: '#jurusan', icon: <GraduationCap size={18} strokeWidth={2.2} />, color: 'indigo' },
  { id: 'showcase', label: 'Galeri', href: '#showcase', icon: <Trophy size={18} strokeWidth={2.2} />, color: 'purple' },
  { id: 'eskul', label: 'Ekskul', href: '#eskul', icon: <Sparkles size={18} strokeWidth={2.2} />, color: 'teal' },
  { id: 'guru', label: 'Guru', href: '#guru', icon: <Users size={18} strokeWidth={2.2} />, color: 'green' },
  { id: 'fasilitas', label: 'Fasilitas', href: '#fasilitas', icon: <BookOpen size={18} strokeWidth={2.2} />, color: 'pink' },
  { id: 'kontak', label: 'Kontak', href: '#kontak', icon: <Phone size={18} strokeWidth={2.2} />, color: 'red' },
];

export default function Navbar({ onOpenPpdb, onOpenAdmin }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [activeSection, setActiveSection] = useState('#beranda');

  const lastScrollYRef = useRef(0);
  const openRef = useRef(open);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const { theme, setTheme } = useTheme();
  const { user, profile } = useAuth();
  const isDark = theme === 'dark';

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const dashboardTarget = !user
    ? null
    : profile?.role === 'guru'
      ? { path: '/guru/dashboard', label: 'Panel Guru' }
      : profile?.role === 'admin'
        ? { path: '/admin/dashboard', label: 'Panel Admin' }
        : profile?.role === 'siswa'
          ? { path: '/lms/dashboard', label: 'Panel Siswa' }
          : null;

  // Auto-hide saat scroll ke bawah, tampil saat scroll ke atas (persis Kerental Nav.tsx)
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Toggle scrolled state saat melebihi 20px
      setScrolled(currentScrollY > 20);

      const diff = currentScrollY - lastScrollYRef.current;

      if (currentScrollY > 60) {
        // Scroll ke bawah (diff > 5) -> animasi navbar NAIK KE ATAS (sembunyi)
        if (diff > 5) {
          if (!openRef.current) setVisible(false);
        }
        // Scroll ke atas (diff < -5) -> animasi navbar TURUN (tampil)
        else if (diff < -5) {
          setVisible(true);
        }
      } else {
        setVisible(true);
      }

      lastScrollYRef.current = currentScrollY;

      // Track active section hash
      const sections = ['#kontak', '#fasilitas', '#guru', '#eskul', '#showcase', '#jurusan', '#profil', '#beranda'];
      for (const sec of sections) {
        const el = document.querySelector(sec);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 160 && rect.bottom >= 100) {
            setActiveSection(sec);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Tutup drawer jika window diperlebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleScrollTo = (e, href) => {
    if (e && e.preventDefault) e.preventDefault();
    setOpen(false);
    setActiveSection(href);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const desktopNavItems = NAV_ITEMS_BASE.map(item => ({
    ...item,
    className: activeSection === item.href ? 'is-nav-active' : '',
    onClick: (e) => handleScrollTo(e, item.href)
  }));

  const mobileNavItems = NAV_ITEMS_BASE.map(item => ({
    ...item,
    className: activeSection === item.href ? 'is-nav-active' : '',
    onClick: (e) => handleScrollTo(e, item.href)
  }));

  return (
    <>
      <motion.nav
        initial={{ y: '-100%' }}
        animate={{ y: visible ? '0%' : '-100%' }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={[
          // Base layout
          'fixed z-[100] flex items-center justify-between',
          // Gunakan glass saat scrolled ATAU saat menu terbuka ATAU saat sedang tersembunyi
          (scrolled || !visible || open)
            ? `top-0 left-0 right-0 ${open ? 'rounded-b-none' : 'rounded-b-3xl'} p-2.5 sm:p-3 md:px-6 md:py-3.5 shadow-xl md:shadow-2xl backdrop-blur-2xl ${isDark ? 'nav-mobile-glass-dark nav-desktop-glass-dark' : 'nav-mobile-glass-light nav-desktop-glass-light'}`
            : 'top-0 left-0 right-0 p-3.5 sm:p-4 md:px-8 md:py-5 nav-desktop-transparent',
        ].join(' ')}
      >
        {/* Brand Logo & Name */}
        <a 
          href="#beranda" 
          onClick={(e) => handleScrollTo(e, '#beranda')}
          className="flex items-center gap-2.5 no-underline group shrink-0"
        >
          <img 
            src={ASSETS.logos.official} 
            alt="Logo SMK Muhammadiyah 8 Medan" 
            className="w-9 h-9 sm:w-10 sm:h-10 object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-105" 
          />
          <div className="flex flex-col">
            <span className={`text-sm sm:text-base font-extrabold tracking-tight leading-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              SMK MUHAMMADIYAH 8
            </span>
            <span className="text-[10px] font-bold text-orange-500 tracking-wider flex items-center gap-1">
              MEDAN <span className="text-[8px] opacity-60">&bull;</span> PUSAT KEUNGGULAN
            </span>
          </div>
        </a>

        {/* Desktop Navigation - React Bits GlassIcons Dock in Center Pill */}
        <div className={`
          hidden md:flex items-center justify-center
          glass-nav-links backdrop-blur-2xl rounded-full px-3 py-1.5
          absolute left-1/2 -translate-x-1/2 shadow-lg transition-all duration-300
        `}>
          <GlassIcons 
            items={desktopNavItems}
            size={36}
            gap={7}
            plate="offset"
            hover="lift"
            labels="hover"
            theme={isDark ? 'dark' : 'light'}
            intro={false}
          />
        </div>

        {/* Right Side Actions - Desktop */}
        <div className="hidden md:flex items-center gap-3 ml-auto shrink-0">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2.5 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 cursor-pointer ${
              isDark
                ? 'glass-daftar-btn-dark text-white/80 hover:text-white'
                : 'glass-daftar-btn-light text-slate-600 hover:text-slate-900'
            }`}
            aria-label="Toggle theme"
            title={isDark ? 'Mode Terang' : 'Mode Gelap'}
          >
            <AnimatePresence mode="wait">
              {isDark ? (
                <motion.div
                  key="sun"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sun size={18} className="text-yellow-400" />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon size={18} className="text-neutral-600" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          {!dashboardTarget ? (
            <>
              <Link
                to="/login/siswa"
                className={`text-xs font-semibold px-4 py-2 rounded-full glass-nav-links transition-all duration-300 ${
                  isDark ? 'text-white/85 hover:text-white' : 'text-neutral-700 hover:text-neutral-900'
                }`}
              >
                Login Siswa
              </Link>
              <button
                onClick={onOpenPpdb}
                className={`text-xs font-bold px-5 py-2 rounded-full transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                  isDark
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:brightness-110 shadow-lg shadow-orange-500/25'
                    : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:brightness-105 shadow-md shadow-orange-500/30'
                }`}
              >
                Daftar PPDB
              </button>
            </>
          ) : (
            <>
              <Link
                to={dashboardTarget.path}
                className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full glass-nav-links transition-all duration-300 ${
                  isDark ? 'text-orange-300 hover:text-orange-200' : 'text-orange-600'
                }`}
              >
                <LayoutDashboard size={14} />
                <span>{dashboardTarget.label}</span>
              </Link>
              <button
                onClick={onOpenPpdb}
                className={`text-xs font-bold px-5 py-2 rounded-full transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                  isDark
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:brightness-110 shadow-lg shadow-orange-500/25'
                    : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:brightness-105 shadow-md shadow-orange-500/30'
                }`}
              >
                PPDB Online
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Buttons Cluster */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 cursor-pointer ${
              isDark
                ? 'glass-daftar-btn-dark text-white/70 hover:text-white'
                : 'glass-daftar-btn-light text-slate-500 hover:text-slate-900'
            }`}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-neutral-600" />}
          </button>

          <button
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 glass-nav-links transition-all duration-300 cursor-pointer ${
              isDark ? 'text-white' : 'text-neutral-900'
            }`}
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu - Sibling element outside motion.nav to prevent nested backdrop-filter clipping bug (persis Kerental Nav.tsx) */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={`md:hidden fixed left-3 right-3 z-[99] p-4 sm:p-5 flex flex-col gap-3 rounded-3xl shadow-2xl backdrop-blur-2xl border ${
              scrolled ? 'top-[58px]' : 'top-[68px]'
            } ${
              isDark 
                ? 'nav-mobile-glass-dark text-white border-white/15 shadow-black/60' 
                : 'nav-mobile-glass-light text-neutral-900 border-white/80 shadow-orange-500/10'
            }`}
          >
            {/* Header info strip inside drawer */}
            <div className="flex items-center justify-between px-1 pb-1.5 border-b border-black/5 dark:border-white/10">
              <span className="text-[11px] font-bold tracking-wider uppercase text-orange-500 flex items-center gap-1.5">
                <Compass size={14} className="text-orange-500" />
                Navigasi Cepat
              </span>
              <span className="text-[10px] font-medium opacity-60">
                8 Menu
              </span>
            </div>

            {/* React Bits GlassIcons Grid (4 columns) */}
            <div className="py-2.5 flex justify-center w-full overflow-hidden">
              <GlassIcons
                items={mobileNavItems}
                columns={4}
                size={50}
                gap={12}
                plate="tilt"
                hover="press"
                labels="always"
                theme={isDark ? 'dark' : 'light'}
                intro={false}
              />
            </div>

            {/* Divider */}
            <div className={`h-px my-1 ${isDark ? 'bg-white/10' : 'bg-neutral-200/80'}`} />

            {/* Quick Action Buttons */}
            {!dashboardTarget ? (
              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={() => { setOpen(false); onOpenPpdb(); }}
                  className={`w-full py-2.5 rounded-2xl text-center text-xs font-bold transition-all shadow-md cursor-pointer ${
                    isDark
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:brightness-110 shadow-orange-500/20'
                      : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:brightness-105 shadow-orange-500/30'
                  }`}
                >
                  Daftar PPDB Online
                </button>
                <Link
                  to="/login/siswa"
                  onClick={() => setOpen(false)}
                  className={`w-full py-2.5 rounded-2xl text-center text-xs font-semibold glass-nav-links transition-all ${
                    isDark ? 'text-white/90 hover:text-white' : 'text-neutral-800 hover:text-black'
                  }`}
                >
                  Masuk Portal Siswa (LMS)
                </Link>
                <div className="flex items-center justify-center gap-4 pt-1">
                  <Link
                    to="/login/guru"
                    onClick={() => setOpen(false)}
                    className={`text-xs font-medium transition-colors ${
                      isDark ? 'text-white/60 hover:text-white' : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    Portal Guru
                  </Link>
                  <span className={isDark ? 'text-white/30' : 'text-neutral-300'}>&bull;</span>
                  <button
                    onClick={() => { setOpen(false); onOpenAdmin(); }}
                    className={`text-xs font-medium transition-colors cursor-pointer ${
                      isDark ? 'text-white/60 hover:text-white' : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    Portal Admin CMS
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <Link
                  to={dashboardTarget.path}
                  onClick={() => setOpen(false)}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-bold transition-colors ${
                    isDark ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' : 'bg-orange-100 text-orange-900 border border-orange-200'
                  }`}
                >
                  <LayoutDashboard size={15} />
                  <span>Buka {dashboardTarget.label}</span>
                </Link>
                <button
                  onClick={() => { setOpen(false); onOpenPpdb(); }}
                  className={`w-full py-2.5 rounded-2xl text-center text-xs font-bold transition-all shadow-md cursor-pointer ${
                    isDark
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:brightness-110 shadow-orange-500/20'
                      : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:brightness-105 shadow-orange-500/30'
                  }`}
                >
                  Daftar PPDB Online
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
