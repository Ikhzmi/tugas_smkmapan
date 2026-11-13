import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  ArrowRight,
  Building2,
  Calculator,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  History,
  Home,
  Image as ImageIcon,
  LayoutGrid,
  LogIn,
  Menu,
  Network,
  Palette,
  Phone,
  School,
  Search,
  Target,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler'
import { useTheme } from '../../hooks/useTheme'
import { useContent } from '../../context/ContentContext'

const navStructure = [
  {
    key: 'beranda',
    label: 'Beranda',
    icon: Home,
    href: '#beranda',
    sections: ['beranda'],
  },
  {
    key: 'profil',
    label: 'Profil',
    icon: Building2,
    href: '#profil',
    sections: ['profil'],
    dropdown: {
      type: 'menu',
      items: [
        {
          label: 'Sejarah',
          icon: History,
          href: '#profil',
          tabIndex: 0,
        },
        {
          label: 'Visi & Misi',
          icon: Target,
          href: '#profil',
          tabIndex: 1,
        },
        {
          label: 'Kepala Sekolah',
          icon: GraduationCap,
          href: '#profil',
          tabIndex: 2,
        },
        {
          label: 'Identitas',
          icon: School,
          href: '#profil',
          tabIndex: 3,
        },
      ],
    },
  },
  {
    key: 'program',
    label: 'Program',
    icon: LayoutGrid,
    href: '#program',
    sections: ['program'],
    dropdown: { type: 'majors' },
  },
  {
    key: 'sekolah',
    label: 'Sekolah',
    icon: School,
    href: '#ekstrakurikuler',
    sections: ['ekstrakurikuler', 'galeri', 'fasilitas', 'tenaga-pendidik'],
    dropdown: {
      type: 'menu',
      items: [
        { label: 'Ekstrakurikuler', icon: Users, href: '#ekstrakurikuler' },
        { label: 'Galeri', icon: ImageIcon, href: '#galeri' },
        { label: 'Fasilitas', icon: Building2, href: '#fasilitas' },
        {
          label: 'Tenaga Pendidik',
          icon: GraduationCap,
          href: '#tenaga-pendidik',
        },
      ],
    },
  },
  {
    key: 'kontak',
    label: 'Kontak',
    icon: Phone,
    href: '#kontak',
    sections: ['kontak'],
  },
]

const sectionIds = navStructure.flatMap((item) => item.sections)

const majorIcons = {
  AKL: Calculator,
  DKV: Palette,
  TKJ: Network,
  TBSM: Wrench,
}

const pillTransition = { type: 'spring', stiffness: 380, damping: 32 }
const dropdownTransition = { duration: 0.18, ease: 'easeOut' }

function selectNavEntry(entry) {
  if (typeof entry?.tabIndex !== 'number') return
  window.dispatchEvent(
    new CustomEvent('open-profil-tab', {
      detail: { tabIndex: entry.tabIndex },
    }),
  )
}

function buildNavItems(menuLabels, majors) {
  return navStructure.map((item) => {
    const dropdown =
      item.dropdown?.type === 'majors'
        ? {
            type: 'menu',
            items: (majors || []).map((major) => ({
              label: major.name,
              icon: majorIcons[String(major.code || '').toUpperCase()] || GraduationCap,
              href: '#program',
            })),
          }
        : item.dropdown

    return { ...item, label: menuLabels?.[item.key] || item.label, dropdown }
  })
}

function buildSearchEntries(items) {
  return items.flatMap((item) => [
    { label: item.label, href: item.href },
    ...(item.dropdown?.items ?? []).map((sub) => ({
      label: sub.label,
      href: sub.href,
      tabIndex: sub.tabIndex,
    })),
  ])
}

function DropdownMenu({ data, activeSection, activeProfilTab, onSelect }) {
  if (data.type === 'menu') {
    return (
      <ul className="w-64 space-y-1 p-2">
        {data.items.map((item) => {
          const isCurrent =
            typeof item.tabIndex === 'number'
              ? activeSection === 'profil' && item.tabIndex === activeProfilTab
              : activeSection === item.href?.replace('#', '')

          return (
            <li key={item.label}>
              <a
                href={item.href}
                onClick={() => onSelect?.(item)}
                aria-current={isCurrent ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  isCurrent
                    ? 'bg-primary/10 text-primary hover:bg-primary/15 dark:bg-primary/15 dark:text-primary dark:hover:bg-primary/20'
                    : 'bg-white/10 text-neutral-700 backdrop-blur-sm hover:bg-white/30 hover:text-neutral-900 dark:bg-white/[0.03] dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white'
                }`}
              >
                <item.icon
                  className={`h-4 w-4 ${
                    isCurrent
                      ? 'text-primary'
                      : 'text-neutral-500 dark:text-neutral-400'
                  }`}
                />
                {item.label}
                {isCurrent ? (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                ) : (
                  <ChevronRight className="ml-auto h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500" />
                )}
              </a>
            </li>
          )
        })}
      </ul>
    )
  }

  if (data.type === 'cards') {
    return (
      <div className="w-[34rem] max-w-[90vw] p-4">
        <div className="rounded-2xl border border-primary/20 bg-primary/15 p-4">
          <p className="text-sm font-semibold text-neutral-900 dark:text-white">{data.title}</p>
          <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-300">{data.description}</p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {data.items.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => onSelect?.(item)}
              className="group/card flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-black/[0.03] transition-colors hover:border-black/20 hover:bg-black/[0.06] dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10"
            >
              <div className="relative h-24 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.label}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover/card:scale-105"
                />
                <div className="absolute inset-0 bg-[#0b0d12]/55" />
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-neutral-900 dark:text-white">{item.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                  {item.description}
                </p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs text-primary">
                  Selengkapnya
                  <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    )
  }

  return (
    <ul className="w-60 p-2">
      {data.items.map((item) => (
        <li key={item.label} className="group/nested relative">
          <a
            href={item.href || '#'}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-neutral-700 transition-colors hover:bg-black/5 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <item.icon className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
            {item.label}
            {item.children && (
              <ChevronRight className="ml-auto h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500" />
            )}
          </a>

          {item.children && (
            <div className="absolute left-full top-0 pl-2 opacity-0 invisible transition-all duration-150 group-hover/nested:visible group-hover/nested:opacity-100">
              <ul className="w-52 rounded-2xl border border-white/70 bg-white/40 p-2 shadow-2xl backdrop-blur-[32px] backdrop-saturate-[1.8] dark:border-white/10 dark:bg-[#0e1016]/65">
                {item.children.map((child) => (
                  <li key={child.label}>
                    <a
                      href={child.href}
                      onClick={() => onSelect?.(child)}
                      className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 text-sm text-neutral-700 backdrop-blur-sm transition-colors hover:bg-white/30 hover:text-neutral-900 dark:bg-white/[0.03] dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                      {child.label}
                      <ChevronRight className="ml-auto h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}

function NavItem({
  item,
  index,
  isActive,
  isCurrent,
  isOpen,
  activeSection,
  activeProfilTab,
  onEnter,
  onLeave,
}) {
  const hasDropdown = Boolean(item.dropdown)

  const handleSelect = (entry) => selectNavEntry(entry)

  return (
    <div
      className="relative"
      onMouseEnter={() => onEnter(index)}
      onFocus={() => onEnter(index)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) onLeave()
      }}
    >
      <a
        href={item.href}
        aria-current={isCurrent ? 'page' : undefined}
        aria-haspopup={hasDropdown ? 'menu' : undefined}
        aria-expanded={hasDropdown ? isOpen : undefined}
        className="relative flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors"
      >
        {isActive && (
          <motion.span
            layoutId="nav-pill"
            className="absolute inset-0 rounded-full bg-primary shadow-[0_10px_30px_-8px_rgba(254,64,0,0.7)]"
            transition={pillTransition}
          />
        )}
        <span
          className={`relative z-10 flex items-center gap-2 ${
            isActive
              ? 'text-white'
              : 'text-neutral-700 dark:text-neutral-300'
          }`}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
          {hasDropdown && (
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          )}
        </span>
      </a>

      <AnimatePresence>
        {hasDropdown && isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={dropdownTransition}
            className="absolute left-0 top-full z-50 pt-3"
          >
            <div className="overflow-visible rounded-2xl border border-white/70 bg-white/40 shadow-[0_25px_60px_-20px_rgba(15,27,45,0.35),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-[32px] backdrop-saturate-[1.8] dark:border-white/10 dark:bg-[#0e1016]/65 dark:shadow-[0_25px_60px_-20px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.08)]">
              <DropdownMenu
                data={item.dropdown}
                activeSection={activeSection}
                activeProfilTab={activeProfilTab}
                onSelect={handleSelect}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Navbar({ onLogin, onOpenPpdb }) {
  const { theme, setTheme } = useTheme()
  const { appearance, majors } = useContent()
  const [activeSection, setActiveSection] = useState('beranda')
  const [activeProfilTab, setActiveProfilTab] = useState(0)
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const [openMenu, setOpenMenu] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [openMobileMenu, setOpenMobileMenu] = useState(null)
  const searchRef = useRef(null)
  const searchBtnRef = useRef(null)

  const navItems = useMemo(
    () => buildNavItems(appearance?.menuLabels, majors),
    [appearance, majors],
  )
  const searchEntries = useMemo(() => buildSearchEntries(navItems), [navItems])

  const activeNavIndex = navItems.findIndex((item) =>
    item.sections.includes(activeSection),
  )
  const activeIndex = hoveredIndex ?? (activeNavIndex >= 0 ? activeNavIndex : 0)

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const searchMatches = normalizedQuery
    ? searchEntries
        .filter((entry) => entry.label.toLowerCase().includes(normalizedQuery))
        .slice(0, 6)
    : []

  const navigateToEntry = (entry) => {
    if (!entry?.href) return
    selectNavEntry(entry)
    setSearchOpen(false)
    setSearchQuery('')
    setMobileOpen(false)
    setOpenMobileMenu(null)

    if (entry.href.startsWith('#')) {
      const target = document.getElementById(entry.href.slice(1))
      if (!target) return
      window.history.replaceState(null, '', entry.href)
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      window.location.href = entry.href
    }
  }

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    if (searchMatches.length) navigateToEntry(searchMatches[0])
  }

  const toggleSearch = () => {
    if (!searchOpen) {
      setOpenMenu(null)
      setMobileOpen(false)
      setOpenMobileMenu(null)
    }
    setSearchOpen(!searchOpen)
  }

  useEffect(() => {
    const onProfilTabChange = (event) => {
      if (typeof event.detail?.tabIndex === 'number') {
        setActiveProfilTab(event.detail.tabIndex)
      }
    }
    window.addEventListener('profil-tab-change', onProfilTabChange)
    return () => window.removeEventListener('profil-tab-change', onProfilTabChange)
  }, [])

  useEffect(() => {
    if (!searchOpen) return

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setSearchOpen(false)
    }
    const onPointerDown = (event) => {
      if (searchRef.current?.contains(event.target)) return
      if (searchBtnRef.current?.contains(event.target)) return
      setSearchOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [searchOpen])

  const handleEnter = (index) => {
    setSearchOpen(false)
    setHoveredIndex(index)
    setOpenMenu(navItems[index].dropdown ? navItems[index].label : null)
  }

  const handleLeave = () => {
    setHoveredIndex(null)
    setOpenMenu(null)
  }

  useEffect(() => {
    let frame = 0

    const update = () => {
      frame = 0
      const line = window.scrollY + window.innerHeight * 0.35
      let current = 'beranda'

      for (const id of sectionIds) {
        const element = document.getElementById(id)
        if (!element) continue

        const top = element.getBoundingClientRect().top + window.scrollY
        if (top <= line) current = id
      }

      setActiveSection(current)
    }

    const schedule = () => {
      if (frame) return
      frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])

  const [navState, setNavState] = useState('merged')
  const lastScrollY = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      if (y <= 12) {
        lastScrollY.current = y
        setNavState('merged')
        return
      }

      const delta = y - lastScrollY.current
      if (Math.abs(delta) < 6) return
      lastScrollY.current = y
      setNavState(delta > 0 && y > 120 ? 'hidden' : 'detached')
    }

    lastScrollY.current = window.scrollY
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 top-0 z-50 w-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        navState === 'hidden' ? '-translate-y-[130%]' : 'translate-y-0'
      }`}
    >
      <div
        className={`relative mx-auto transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          navState === 'merged'
            ? 'max-w-none px-4 pt-0'
            : 'max-w-7xl px-4 pt-4'
        }`}
      >
        <div
          className={`pointer-events-auto flex items-center justify-between gap-3 border p-2 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            navState === 'merged'
              ? 'rounded-none border-transparent bg-transparent shadow-none'
              : 'rounded-full border-white/70 bg-white/40 shadow-[0_10px_40px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(255,255,255,0.4)] backdrop-blur-[28px] backdrop-saturate-[1.8] dark:border-white/15 dark:bg-white/[0.06] dark:shadow-[0_10px_40px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.1)]'
          }`}
        >
          <a
            href="#beranda"
            className="flex shrink-0 items-center gap-3 pl-3"
          >
            <img
              src={appearance?.logoUrl || ''}
              alt={`Logo ${appearance?.brand || 'SMK Muhammadiyah 8 Medan'}`}
              className="h-9 w-9 rounded-full object-contain"
            />
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-bold tracking-wide text-neutral-900 dark:text-white">
                {appearance?.brand || 'SMKM 8 MEDAN'}
              </span>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {appearance?.tagline || 'Tunas Bangsa Berkarakter'}
              </span>
            </span>
          </a>

          <nav
            aria-label="Navigasi utama"
            className="hidden items-center rounded-full border border-white/50 bg-white/20 p-1 backdrop-blur-xl xl:flex dark:border-white/10 dark:bg-white/[0.04]"
            onMouseLeave={handleLeave}
            onClick={(event) => {
              if (event.target.closest('a[href^="#"]')) handleLeave()
            }}
          >
            {navItems.map((item, index) => (
              <NavItem
                key={item.label}
                item={item}
                index={index}
                isActive={activeIndex === index}
                isCurrent={activeNavIndex === index}
                isOpen={openMenu === item.label}
                activeSection={activeSection}
                activeProfilTab={activeProfilTab}
                onEnter={handleEnter}
                onLeave={handleLeave}
              />
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <AnimatedThemeToggler
              theme={theme}
              onThemeChange={setTheme}
              duration={500}
              variant="circle"
              title="Ubah tema terang / gelap"
              className="grid h-10 w-10 place-items-center rounded-full text-neutral-700 transition-colors hover:bg-black/5 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white [&_svg]:h-4 [&_svg]:w-4"
            />
            <button
              ref={searchBtnRef}
              type="button"
              aria-label="Cari"
              aria-expanded={searchOpen}
              title="Cari"
              onClick={toggleSearch}
              className={`hidden h-10 w-10 place-items-center rounded-full transition-colors xl:grid ${
                searchOpen
                  ? 'bg-primary text-white'
                  : 'text-neutral-700 hover:bg-black/5 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white'
              }`}
            >
              <Search className="h-[18px] w-[18px]" />
            </button>
            <button
              type="button"
              aria-label="Masuk"
              title="Masuk"
              onClick={onLogin}
              className="grid h-10 w-10 place-items-center rounded-full text-neutral-700 transition-colors hover:bg-black/5 hover:text-neutral-900 dark:text-neutral-200 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <LogIn className="h-[18px] w-[18px]" />
            </button>
            <button
              type="button"
              onClick={onOpenPpdb}
              className="group hidden items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_-8px_rgba(254,64,0,0.7)] transition-transform hover:scale-[1.03] sm:flex"
            >
              PPDB
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              type="button"
              aria-label="Menu"
              onClick={() => {
                setSearchOpen(false)
                if (mobileOpen) {
                  setOpenMobileMenu(null)
                  setSearchQuery('')
                }
                setMobileOpen(!mobileOpen)
              }}
              className="grid h-10 w-10 place-items-center rounded-full text-neutral-700 transition-colors hover:bg-black/5 hover:text-neutral-900 dark:text-neutral-200 dark:hover:bg-white/10 dark:hover:text-white xl:hidden"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {searchOpen && (
            <motion.div
              ref={searchRef}
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={dropdownTransition}
              className="pointer-events-auto absolute right-4 top-full z-50 mt-3 hidden w-[min(26rem,calc(100vw-2rem))] xl:block"
            >
              <form
                role="search"
                onSubmit={handleSearchSubmit}
                className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/45 px-4 py-2 shadow-2xl backdrop-blur-[28px] backdrop-saturate-[1.8] dark:border-white/10 dark:bg-[#0e1016]/65"
              >
                <Search className="h-4 w-4 shrink-0 text-neutral-400 dark:text-neutral-500" />
                <input
                  autoFocus
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Cari program, fasilitas, atau informasi..."
                  className="h-10 min-w-0 flex-1 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-500 dark:text-neutral-100 dark:placeholder:text-neutral-400"
                />
                <kbd className="hidden shrink-0 rounded-md border border-black/10 bg-black/[0.03] px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 sm:block dark:border-white/10 dark:bg-white/5 dark:text-neutral-400">
                  ESC
                </kbd>
                <button
                  type="button"
                  aria-label="Tutup pencarian"
                  onClick={() => setSearchOpen(false)}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-neutral-500 transition-colors hover:bg-black/5 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {mobileOpen && (
            <motion.nav
              aria-label="Navigasi seluler"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={dropdownTransition}
              className="pointer-events-auto mt-3 max-h-[calc(100svh-7rem)] space-y-1 overflow-y-auto overscroll-contain rounded-3xl border border-white/70 bg-white/45 p-4 shadow-2xl backdrop-blur-[28px] backdrop-saturate-[1.8] dark:border-white/10 dark:bg-[#0e1016]/65 xl:hidden"
            >
              <div className="space-y-2 pb-3">
                <form
                  role="search"
                  onSubmit={handleSearchSubmit}
                  className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/40 px-4 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/[0.06]"
                >
                  <Search className="h-4 w-4 shrink-0 text-neutral-400 dark:text-neutral-500" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Cari di sini..."
                    className="h-10 min-w-0 flex-1 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-500 dark:text-neutral-100 dark:placeholder:text-neutral-400"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      aria-label="Bersihkan pencarian"
                      onClick={() => setSearchQuery('')}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-neutral-500 transition-colors hover:bg-white/40 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </form>
                {normalizedQuery && (
                  <div className="space-y-1 rounded-2xl border border-white/50 bg-white/25 p-2 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.04]">
                    {searchMatches.length ? (
                      searchMatches.map((entry) => (
                        <button
                          key={`${entry.href}-${entry.label}`}
                          type="button"
                          onClick={() => navigateToEntry(entry)}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-neutral-600 transition-colors hover:bg-white/40 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white"
                        >
                          <Search className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                          {entry.label}
                        </button>
                      ))
                    ) : (
                      <p className="px-3 py-2 text-sm text-neutral-500 dark:text-neutral-400">
                        Tidak ada hasil untuk &quot;{searchQuery}&quot;.
                      </p>
                    )}
                  </div>
                )}
              </div>
              {navItems.map((item) => {
                const isCurrent = item.sections.includes(activeSection)
                const isExpanded = openMobileMenu === item.label

                return (
                  <div key={item.label}>
                    <div className="flex items-center gap-1">
                      <a
                        href={item.href}
                        aria-current={isCurrent ? 'page' : undefined}
                        onClick={() => {
                          setMobileOpen(false)
                          setOpenMobileMenu(null)
                        }}
                        className={`flex flex-1 items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-colors ${
                          isCurrent
                            ? 'bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary'
                            : 'text-neutral-700 hover:bg-white/30 hover:text-neutral-900 dark:text-neutral-200 dark:hover:bg-white/10 dark:hover:text-white'
                        }`}
                      >
                        <item.icon
                          className={`h-4 w-4 ${
                            isCurrent
                              ? 'text-primary'
                              : 'text-neutral-500 dark:text-neutral-400'
                          }`}
                        />
                        {item.label}
                        {isCurrent && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                        )}
                      </a>
                      {item.dropdown && (
                        <button
                          type="button"
                          aria-label={`${isExpanded ? 'Tutup' : 'Buka'} submenu ${item.label}`}
                          aria-expanded={isExpanded}
                          onClick={() =>
                            setOpenMobileMenu(isExpanded ? null : item.label)
                          }
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-neutral-500 transition-colors hover:bg-white/30 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white"
                        >
                          <ChevronDown
                            className={`h-4 w-4 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      )}
                    </div>
                    <AnimatePresence initial={false}>
                      {item.dropdown && isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: 'easeOut' }}
                          className="overflow-hidden"
                        >
                          <div className="ml-6 mt-1 space-y-1 border-l border-white/50 pl-3 dark:border-white/10">
                            {(item.dropdown.items || []).map((sub) => {
                              const subCurrent =
                                item.dropdown.type === 'menu' &&
                                (typeof sub.tabIndex === 'number'
                                  ? activeSection === 'profil' &&
                                    sub.tabIndex === activeProfilTab
                                  : activeSection === sub.href?.replace('#', ''))

                              return (
                                <a
                                  key={sub.label}
                                  href={sub.href}
                                  aria-current={subCurrent ? 'page' : undefined}
                                  onClick={() => {
                                    selectNavEntry(sub)
                                    setMobileOpen(false)
                                    setOpenMobileMenu(null)
                                  }}
                                  className={`block rounded-xl px-3 py-2 text-sm backdrop-blur-sm transition-colors ${
                                    subCurrent
                                      ? 'bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary'
                                      : 'text-neutral-500 hover:bg-white/30 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white'
                                  }`}
                                >
                                  {sub.label}
                                </a>
                              )
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false)
                  onLogin?.()
                }}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_-8px_rgba(254,64,0,0.7)]"
              >
                <LogIn className="h-4 w-4" />
                Masuk
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false)
                  onOpenPpdb?.()
                }}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-3 text-sm font-semibold text-neutral-900 transition-colors hover:bg-black/[0.06] dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
              >
                Daftar PPDB
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
