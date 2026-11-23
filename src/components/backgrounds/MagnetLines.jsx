import { useEffect, useRef } from 'react';
import './MagnetLines.css';

/** Lightweight canvas adaptation of the React Bits Magnet Lines background. */
export default function MagnetLines({
  className = '',
  lineColor = 'rgba(255, 140, 42, 0.48)',
  accentColor = 'rgba(255, 196, 128, 0.8)',
  vignetteColor = 'rgba(4, 8, 18, 0.34)',
  spacing = 34,
  lineLength = 13,
  maxDpr = 1.5,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { alpha: true });
    if (!canvas || !ctx) return undefined;

    const host = canvas.parentElement;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointer = { x: -1000, y: -1000, active: false };
    let width = 0;
    let height = 0;
    let frame = 0;
    let lastFrame = 0;
    let startTime = performance.now();
    let ripple = null;

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(performance.now());
    };

    const draw = (now) => {
      ctx.clearRect(0, 0, width, height);
      const elapsed = (now - startTime) / 1000;
      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;
      const centerX = width / 2;
      const centerY = height / 2;

      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          const x = col * spacing + spacing / 2;
          const y = row * spacing + spacing / 2;
          const dx = pointer.x - x;
          const dy = pointer.y - y;
          const distance = Math.hypot(dx, dy);
          const influence = pointer.active ? Math.max(0, 1 - distance / 230) : 0;
          const ambient = reduceMotion.matches ? 0 : Math.sin(elapsed * 0.8 + col * 0.19 + row * 0.13) * 0.045;
          let angle = -0.18 + ambient + influence * Math.atan2(dy, dx) * 0.34;
          let length = lineLength * (1 + influence * 0.65);
          let alpha = 0.36 + influence * 0.55;

          if (ripple) {
            const age = (now - ripple.time) / 1000;
            if (age > 1.25) ripple = null;
            else {
              const wave = Math.exp(-Math.pow((Math.hypot(x - ripple.x, y - ripple.y) - age * 260) / 54, 2)) * (1 - age / 1.25);
              angle += wave * 0.8;
              length += wave * 9;
              alpha = Math.min(1, alpha + wave * 0.55);
            }
          }

          const edge = Math.min(x / 100, (width - x) / 100, y / 100, (height - y) / 100, 1);
          ctx.save();
          ctx.translate(x + Math.cos(angle) * influence * 5, y + Math.sin(angle) * influence * 5);
          ctx.rotate(angle);
          ctx.globalAlpha = Math.max(0, Math.min(1, alpha * edge));
          ctx.strokeStyle = influence > 0.72 ? accentColor : lineColor;
          ctx.lineWidth = 1.15;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(-length / 2, 0);
          ctx.lineTo(length / 2, 0);
          ctx.stroke();
          ctx.restore();
        }
      }

      // Subtle vignette keeps the lines behind the login card rather than competing with it.
      const vignette = ctx.createRadialGradient(centerX, centerY, Math.min(width, height) * 0.1, centerX, centerY, Math.max(width, height) * 0.72);
      vignette.addColorStop(0, 'rgba(4, 8, 18, 0)');
      vignette.addColorStop(1, vignetteColor);
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);
    };

    const animate = (now) => {
      if (now - lastFrame >= 33) {
        draw(now);
        lastFrame = now;
      }
      if (!reduceMotion.matches && !document.hidden) frame = window.requestAnimationFrame(animate);
    };

    const start = () => {
      window.cancelAnimationFrame(frame);
      if (!reduceMotion.matches && !document.hidden) frame = window.requestAnimationFrame(animate);
      else draw(performance.now());
    };
    const onPointerMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = event.clientX >= rect.left && event.clientX <= rect.right
        && event.clientY >= rect.top && event.clientY <= rect.bottom;
      if (reduceMotion.matches) draw(performance.now());
    };
    const onPointerLeave = () => {
      pointer.active = false;
      if (reduceMotion.matches) draw(performance.now());
    };
    const onPointerDown = (event) => {
      const rect = canvas.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return;
      ripple = { x: event.clientX - rect.left, y: event.clientY - rect.top, time: performance.now() };
      if (reduceMotion.matches) draw(performance.now());
    };
    const onVisibility = () => start();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    reduceMotion.addEventListener?.('change', start);
    resize();
    start();

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('visibilitychange', onVisibility);
      reduceMotion.removeEventListener?.('change', start);
    };
  }, [accentColor, lineColor, lineLength, maxDpr, spacing, vignetteColor]);

  return <canvas ref={canvasRef} className={`magnet-lines ${className}`} aria-hidden="true" />;
}
