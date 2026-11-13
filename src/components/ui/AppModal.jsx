import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import './AppModal.css';


export default function AppModal({
  open,
  title,
  subtitle,
  icon,
  size = 'md',
  onClose,
  children,
  footer,
}) {
  useEffect(() => {
    if (!open) return undefined;

    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  // Portal ke body: kalau dirender di dalam .cms-panel yang punya transform,
  // position: fixed mengikuti panel sehingga dialog bisa keluar layar.
  return createPortal(
    <div
      className="gm-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`gm-dialog gm-size-${size}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="gm-head">
          <div className="gm-head-main">
            {icon && <span className="gm-head-icon">{icon}</span>}
            <div>
              <h3>{title}</h3>
              {subtitle && <p>{subtitle}</p>}
            </div>
          </div>
          <button type="button" className="gm-close" onClick={onClose} aria-label="Tutup">
            <X size={18} />
          </button>
        </header>

        <div className="gm-body">{children}</div>

        {footer && <footer className="gm-foot">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
