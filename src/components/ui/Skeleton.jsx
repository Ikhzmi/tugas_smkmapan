import React from 'react';
import './Skeleton.css';

/**
 * Skeleton loader component inspired by Vibe UI Kit
 * Supports variants: 'pulse' | 'shimmer' | 'glow' | 'glass'
 */
export function Skeleton({
  variant = 'shimmer',
  width,
  height,
  borderRadius,
  className = '',
  style = {},
  children,
  ...props
}) {
  const inlineStyles = {
    ...(width !== undefined ? { width } : {}),
    ...(height !== undefined ? { height } : {}),
    ...(borderRadius !== undefined ? { borderRadius } : {}),
    ...style,
  };

  const variantClass = `vibe-skeleton-${variant}`;

  return (
    <div
      className={`vibe-skeleton ${variantClass} ${className}`.trim()}
      style={inlineStyles}
      {...props}
    >
      {children}
    </div>
  );
}

export function SkeletonCircle({ size = 40, variant = 'shimmer', className = '', style = {}, ...props }) {
  return (
    <Skeleton
      variant={variant}
      width={size}
      height={size}
      className={`vibe-skeleton-circle ${className}`}
      style={style}
      {...props}
    />
  );
}

export function SkeletonLine({ height = 14, width = '100%', variant = 'shimmer', className = '', style = {}, ...props }) {
  return (
    <Skeleton
      variant={variant}
      width={width}
      height={height}
      className={`vibe-skeleton-line ${className}`}
      style={style}
      {...props}
    />
  );
}

/**
 * Pre-composed Dashboard Loading Skeleton
 * Memakai class CSS agar otomatis ikut tema terang/gelap.
 */
export function DashboardSkeleton({ cards = 4, showHero = true }) {
  return (
    <div className="dashboard-skeleton-view skeleton-dashboard-view">
      {showHero && (
        <div className="skeleton-hero-panel">
          <SkeletonLine width="200px" height={16} />
          <SkeletonLine width="60%" height={28} />
          <SkeletonLine width="40%" height={14} />
          <div className="skeleton-inline-actions">
            <Skeleton width="120px" height={40} borderRadius={10} />
            <Skeleton width="140px" height={40} borderRadius={10} />
          </div>
        </div>
      )}

      <div className="skeleton-grid">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="skeleton-dashboard-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <SkeletonCircle size={44} />
              <Skeleton width="60px" height={22} borderRadius={12} />
            </div>
            <SkeletonLine width="50%" height={14} />
            <SkeletonLine width="80%" height={26} />
            <SkeletonLine width="40%" height={12} />
          </div>
        ))}
      </div>

      <div className="skeleton-footer-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <SkeletonLine width="200px" height={20} />
          <Skeleton width="100px" height={32} borderRadius={8} />
        </div>
        <div className="skeleton-stack">
          <SkeletonLine width="100%" height={48} borderRadius={8} />
          <SkeletonLine width="100%" height={48} borderRadius={8} />
          <SkeletonLine width="100%" height={48} borderRadius={8} />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton untuk tabel data admin (Data Guru / Data Siswa / Kelola Akun).
 * Grid kolom mengikuti `template` agar lebar selaras dengan tabel asli.
 */
export function TableSkeleton({
  rows = 6,
  template = '56px 1.4fr 1fr 1fr 1.2fr 160px',
  withToolbar = true,
  className = '',
}) {
  return (
    <div className={`skeleton-table-panel ${className}`.trim()} aria-hidden="true">
      {withToolbar && (
        <div className="skeleton-table-toolbar">
          <Skeleton width="260px" height={38} borderRadius={999} />
          <Skeleton width="120px" height={34} borderRadius={10} />
        </div>
      )}
      <div className="skeleton-table-row is-head" style={{ gridTemplateColumns: template }}>
        {Array.from({ length: template.split(' ').length }).map((_, i) => (
          <Skeleton key={`h-${i}`} height={10} width="70%" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={`r-${r}`} className="skeleton-table-row" style={{ gridTemplateColumns: template }}>
          {Array.from({ length: template.split(' ').length }).map((_, c) => (
            <div key={`c-${r}-${c}`} className="skeleton-table-cell">
              {c === 0
                ? <SkeletonCircle size={32} />
                : <SkeletonLine height={12} width={c === 1 ? '85%' : '65%'} />}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton ringkas untuk daftar kartu (mis. presensi, rekap, dsb.).
 */
export function ListSkeleton({ rows = 4, height = 62, className = '' }) {
  return (
    <div className={`skeleton-stack ${className}`.trim()} aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton
          key={i}
          height={height}
          borderRadius={12}
          variant="glass"
          width="100%"
        />
      ))}
    </div>
  );
}

export default Skeleton;
