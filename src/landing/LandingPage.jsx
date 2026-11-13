import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ProfilSekolah } from './components/ProfilSekolah';
import { ProgramKeahlian } from './components/ProgramKeahlian';
import { Ekstrakurikuler } from './components/Ekstrakurikuler';
import { Galeri } from './components/Galeri';
import { Fasilitas } from './components/Fasilitas';
import { TenagaPendidik } from './components/TenagaPendidik';
import { Kontak } from './components/Kontak';
import { Footer } from './components/Footer';
import './landing.css';

export default function LandingPage({ onOpenPpdb }) {
  const navigate = useNavigate();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('landing-mode');

    return () => root.classList.remove('landing-mode');
  }, []);

  return (
    <div className="landing-root">
      <Navbar
        onLogin={() => navigate('/login')}
        onOpenPpdb={onOpenPpdb}
      />

      <main className="landing-main">
        <Hero onOpenPpdb={onOpenPpdb} />
        <ProfilSekolah />
        <ProgramKeahlian />
        <Ekstrakurikuler />
        <Galeri />
        <Fasilitas />
        <TenagaPendidik />
        <Kontak />
      </main>

      <Footer />
    </div>
  );
}
