import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Pagination.css';


const buildPages = (page, pageCount) => {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const pages = new Set([1, pageCount, page, page - 1, page + 1]);
  const list = Array.from(pages).filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  const out = [];
  list.forEach((p, i) => {
    if (i > 0 && p - list[i - 1] > 1) out.push('…');
    out.push(p);
  });
  return out;
};

export default function Pagination({
  page, pageCount, onChange, total, pageSize, label = 'item',
}) {
  if (!total || pageCount <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="pgn-root">
      <span className="pgn-info">
        Menampilkan <strong>{from}–{to}</strong> dari <strong>{total}</strong> {label}
      </span>

      <div className="pgn-controls">
        <button
          type="button"
          className="pgn-btn"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft size={15} />
        </button>

        {buildPages(page, pageCount).map((p, i) => (
          p === '…' ? (
            <span key={`gap-${i}`} className="pgn-gap">…</span>
          ) : (
            <button
              key={p}
              type="button"
              className={`pgn-btn ${p === page ? 'is-active' : ''}`}
              onClick={() => onChange(p)}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          )
        ))}

        <button
          type="button"
          className="pgn-btn"
          onClick={() => onChange(page + 1)}
          disabled={page >= pageCount}
          aria-label="Halaman berikutnya"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
