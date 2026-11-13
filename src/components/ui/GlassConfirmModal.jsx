import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, LogOut, Info, CheckCircle2, Loader2, X } from 'lucide-react';
import './GlassConfirmModal.css';

/**
 * GlassConfirmModal
 * Modal konfirmasi modern dengan efek Glassmorphism premium (frosted glass blur,
 * border tipis bercahaya, bayangan dinamis, dan animasi pegas).
 */
export default function GlassConfirmModal({
  open = false,
  title = 'Konfirmasi Tindakan',
  message = 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  tone = 'danger', // 'danger' | 'warning' | 'primary' | 'info' | 'logout'
  icon = null,
  loading = false,
  extraDetails = null,
  onConfirm,
  onCancel,
}) {
  // Tutup dengan tombol Escape
  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) {
        onCancel?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, loading, onCancel]);

  const defaultIcon = () => {
    switch (tone) {
      case 'logout':
        return <LogOut size={26} />;
      case 'danger':
        return <Trash2 size={26} />;
      case 'warning':
        return <AlertTriangle size={26} />;
      case 'info':
        return <Info size={26} />;
      case 'primary':
      default:
        return <CheckCircle2 size={26} />;
    }
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className="glass-confirm-portal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="glass-modal-title"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Backdrop gelap blur */}
          <motion.div
            className="glass-confirm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              if (!loading) onCancel?.();
            }}
          />

          {/* Modal Card Ber-efek Glass */}
          <div className="glass-confirm-wrapper">
            <motion.div
              className={`glass-confirm-card tone-${tone}`}
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              transition={{
                type: 'spring',
                damping: 25,
                stiffness: 350,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Tombol Tutup Silang di Sudut Atas */}
              <button
                type="button"
                className="glass-confirm-close"
                onClick={() => {
                  if (!loading) onCancel?.();
                }}
                disabled={loading}
                aria-label="Tutup modal"
              >
                <X size={18} />
              </button>

              {/* Ambient Glow Lingkaran di Belakang Ikon */}
              <div className="glass-confirm-glow" />

              {/* Ikon Utama */}
              <div className="glass-confirm-icon-wrap">
                <div className="glass-confirm-icon-inner">
                  {icon || defaultIcon()}
                </div>
              </div>

              {/* Judul & Pesan */}
              <div className="glass-confirm-content">
                <h3 id="glass-modal-title" className="glass-confirm-title">
                  {title}
                </h3>
                <p className="glass-confirm-message">
                  {message}
                </p>

                {extraDetails && (
                  <div className="glass-confirm-extra">
                    {extraDetails}
                  </div>
                )}
              </div>

              {/* Aksi Tombol */}
              <div className="glass-confirm-actions">
                <button
                  type="button"
                  className="glass-confirm-btn glass-confirm-btn-cancel"
                  onClick={() => onCancel?.()}
                  disabled={loading}
                >
                  {cancelText}
                </button>
                <button
                  type="button"
                  className={`glass-confirm-btn glass-confirm-btn-confirm tone-${tone}`}
                  onClick={() => onConfirm?.()}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="glass-confirm-spinner" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    confirmText
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
