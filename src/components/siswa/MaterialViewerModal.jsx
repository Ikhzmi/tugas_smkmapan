import React from 'react';
import {
  FileText, Video, Link2, ExternalLink, Calendar, UserCheck,
  BookOpen, Layers, PlayCircle,
} from 'lucide-react';
import AppModal from '../ui/AppModal';
import './MaterialViewerModal.css';

const formatTanggal = (iso) => {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  } catch {
    return iso;
  }
};


const toYouTubeEmbed = (url) => {
  if (!url) return '';
  const t = String(url).trim();
  try {
    const u = new URL(t);
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') return `https://www.youtube.com/embed${u.pathname}`;
    if (host.endsWith('youtube.com')) {
      if (u.pathname.startsWith('/shorts/')) return `https://www.youtube.com/embed/${u.pathname.split('/')[2] || ''}`;
      if (u.pathname.startsWith('/embed/')) return t;
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
  } catch {
    return '';
  }
  return '';
};

const TIPE_META = {
  video: { label: 'Video Pembelajaran', icon: Video, tone: 'is-video' },
  link: { label: 'Tautan Referensi', icon: Link2, tone: 'is-link' },
  file: { label: 'Dokumen / Berkas', icon: FileText, tone: 'is-file' },
  teks: { label: 'Materi Teks', icon: FileText, tone: 'is-file' },
};

export default function MaterialViewerModal({ open, material, subjectName, teacherName, onClose }) {
  if (!material) return null;

  const meta = TIPE_META[material.tipe] || TIPE_META.file;
  const TipeIcon = meta.icon;
  const embed = material.tipe === 'video' ? toYouTubeEmbed(material.file_url) : '';
  const isPdf = /\.pdf($|\?)/i.test(material.file_url || '');

  return (
    <AppModal
      open={open}
      size={embed ? 'xl' : 'lg'}
      title={material.judul}
      subtitle={`${subjectName || 'Mata Pelajaran'} • ${meta.label}`}
      icon={<BookOpen size={20} />}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="gm-btn-ghost" onClick={onClose}>Tutup</button>
          {material.file_url && (
            <a
              className="gm-btn-primary"
              href={material.file_url}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={15} />
              Buka di tab baru
            </a>
          )}
        </>
      }
    >
      <div className="mvm-wrap">
        <div className="mvm-meta">
          <span className={`mvm-badge ${meta.tone}`}>
            <TipeIcon size={13} /> {meta.label}
          </span>
          <span className="mvm-meta-item">
            <Layers size={13} /> {subjectName || '-'}
          </span>
          <span className="mvm-meta-item">
            <UserCheck size={13} /> {teacherName || '-'}
          </span>
          <span className="mvm-meta-item">
            <Calendar size={13} /> {formatTanggal(material.created_at)}
          </span>
        </div>

        {embed ? (
          <div className="mvm-player">
            <iframe
              src={embed}
              title={material.judul}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : material.tipe === 'video' && material.file_url ? (
          <a className="mvm-fallback" href={material.file_url} target="_blank" rel="noreferrer">
            <PlayCircle size={30} />
            <strong>Tonton video materi</strong>
            <span>Video dibuka di tab baru</span>
          </a>
        ) : null}

        {material.deskripsi ? (
          <div className="mvm-desc">
            <h4>Deskripsi Materi</h4>
            <p>{material.deskripsi}</p>
          </div>
        ) : (
          <p className="mvm-empty">Guru belum menambahkan deskripsi untuk materi ini.</p>
        )}

        {material.file_url && (
          <div className="mvm-link-card">
            <span className="mvm-link-icon"><Link2 size={16} /></span>
            <div className="mvm-link-body">
              <strong>{isPdf ? 'Dokumen PDF' : 'Tautan materi'}</strong>
              <span>{material.file_url}</span>
            </div>
            <a href={material.file_url} target="_blank" rel="noreferrer" className="mvm-link-btn">
              Buka <ExternalLink size={13} />
            </a>
          </div>
        )}
      </div>
    </AppModal>
  );
}
