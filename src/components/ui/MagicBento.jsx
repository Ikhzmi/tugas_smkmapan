import React, { useRef } from 'react';
import './MagicBento.css';

const runCardWave = (cardEl, rect) => {
  const startTime = performance.now();
  const duration = 500;
  const animateWave = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const radiusPx = progress * (rect.width * 1.5);
    const alpha = 1 - progress;

    cardEl.style.setProperty('--mb-wr', `${radiusPx}px`);
    cardEl.style.setProperty('--mb-wa', `${alpha}`);

    if (progress < 1) {
      requestAnimationFrame(animateWave);
    } else {
      cardEl.style.setProperty('--mb-wa', '0');
    }
  };
  requestAnimationFrame(animateWave);
};

/**
 * MagicBento - Interactive bento card grid with cursor spotlight, 
 * edge light glow, and optional tilt. Inspired by React Bits.
 */
export default function MagicBento({
  items = [],
  children,
  columns = 4,
  gap = 16,
  radius = 20,
  glowColor = '59, 130, 246', // default blue rgb
  enableSpotlight = true,
  enableTilt = true,
  className = '',
  style = {},
  onItemClick,
}) {
  const rootRef = useRef(null);

  const handlePointerMove = (e, index, cardEl) => {
    if (!cardEl) return;
    const rect = cardEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    cardEl.style.setProperty('--mb-x', `${x}px`);
    cardEl.style.setProperty('--mb-y', `${y}px`);
    cardEl.style.setProperty('--mb-hot', '1');
    cardEl.style.setProperty('--mb-near', '1');

    if (enableTilt) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -5;
      const rotateY = ((x - centerX) / centerX) * 5;
      cardEl.style.setProperty('--mb-rx', `${rotateX.toFixed(2)}deg`);
      cardEl.style.setProperty('--mb-ry', `${rotateY.toFixed(2)}deg`);
    }
  };

  const handlePointerLeave = (cardEl) => {
    if (!cardEl) return;
    cardEl.style.setProperty('--mb-hot', '0');
    cardEl.style.setProperty('--mb-near', '0');
    if (enableTilt) {
      cardEl.style.setProperty('--mb-rx', '0deg');
      cardEl.style.setProperty('--mb-ry', '0deg');
    }
    setHoveredIdx(null);
  };

  const handleCardClick = (e, item, index) => {
    const cardEl = e.currentTarget;
    const rect = cardEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    cardEl.style.setProperty('--mb-wx', `${x}px`);
    cardEl.style.setProperty('--mb-wy', `${y}px`);
    cardEl.style.setProperty('--mb-wa', '1');
    cardEl.style.setProperty('--mb-wr', '0px');

    runCardWave(cardEl, rect);

    if (item?.onClick) {
      item.onClick(item, index);
    } else if (onItemClick) {
      onItemClick(item, index);
    }
  };

  const gridStyle = {
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    gap: `${gap}px`,
    '--mb-radius': `${radius}px`,
    '--mb-glow-rgb': glowColor,
    ...style,
  };

  return (
    <div ref={rootRef} className={`magic-bento ${className}`.trim()} style={gridStyle}>
      {children
        ? children
        : items.map((item, idx) => {
            const colSpan = item.colSpan || 1;
            const rowSpan = item.rowSpan || 1;
            const cardGlow = item.glowColor || glowColor;

            return (
              <div
                key={item.id || item.title || idx}
                className="magic-bento__cell"
                style={{
                  gridColumn: `span ${colSpan}`,
                  gridRow: `span ${rowSpan}`,
                }}
              >
                <div
                  className="magic-bento__card"
                  data-clickable={item.onClick || onItemClick ? '' : undefined}
                  style={{
                    '--mb-glow-rgb': cardGlow,
                    minHeight: item.minHeight || '150px',
                  }}
                  onPointerMove={(e) => {
                    setHoveredIdx(idx);
                    handlePointerMove(e, idx, e.currentTarget);
                  }}
                  onPointerLeave={(e) => handlePointerLeave(e.currentTarget)}
                  onClick={(e) => handleCardClick(e, item, idx)}
                >
                  {enableSpotlight && <div className="magic-bento__light" />}
                  <div className="magic-bento__rim" />
                  <div className="magic-bento__border" />

                  <div className="magic-bento__content">
                    {/* Header */}
                    <div className="magic-bento__header">
                      <div className="magic-bento__header-left">
                        {item.icon && (
                          <div
                            className="magic-bento__icon"
                            style={item.iconColor ? { color: item.iconColor } : {}}
                          >
                            {React.isValidElement(item.icon)
                              ? item.icon
                              : item.icon
                                ? React.createElement(item.icon, { size: 18 })
                                : null}
                          </div>
                        )}
                        {item.label && <span className="magic-bento__label">{item.label}</span>}
                      </div>
                      {item.badge && <span className="magic-bento__badge">{item.badge}</span>}
                    </div>

                    {/* Value / Custom Visual / Children */}
                    {item.children ? (
                      item.children
                    ) : (
                      <>
                        {item.value !== undefined && (
                          <div className="magic-bento__figure">
                            <span className="magic-bento__figure-value">{item.value}</span>
                            {item.note && <span className="magic-bento__figure-note">{item.note}</span>}
                          </div>
                        )}

                        {item.visual && <div className="magic-bento__visual">{item.visual}</div>}

                        {/* Title and Description */}
                        {(item.title || item.description) && (
                          <div className="magic-bento__text">
                            {item.title && <h4 className="magic-bento__title">{item.title}</h4>}
                            {item.description && (
                              <p className="magic-bento__description">{item.description}</p>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
    </div>
  );
}

export { MagicBento };
