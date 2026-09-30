import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

interface SilhouetteIllusionProps {
  interactive?: boolean;
}

export const SilhouetteIllusion: React.FC<SilhouetteIllusionProps> = ({ interactive = true }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = width / 2;
    let targetMouseY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      targetMouseX = e.clientX - rect.left;
      targetMouseY = e.clientY - rect.top;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!interactive || !e.touches[0]) return;
      const rect = canvas.getBoundingClientRect();
      targetMouseX = e.touches[0].clientX - rect.left;
      targetMouseY = e.touches[0].clientY - rect.top;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    // Smoky floating particles for deep atmospheric illusion
    const particles = Array.from({ length: 42 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 40 + Math.random() * 90,
      opacity: 0.03 + Math.random() * 0.08,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: -0.2 - Math.random() * 0.5,
      pulseSpeed: 0.002 + Math.random() * 0.005,
      pulseOffset: Math.random() * Math.PI * 2,
    }));

    let time = 0;

    const render = () => {
      time += 0.015;

      // Soft easing towards mouse
      mouseX += (targetMouseX - mouseX) * 0.03;
      mouseY += (targetMouseY - mouseY) * 0.03;

      ctx.clearRect(0, 0, width, height);

      // 1. Ambient background gradient
      const bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.45,
        width * 0.1,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.85
      );
      if (isDark) {
        bgGrad.addColorStop(0, '#1c1e24');
        bgGrad.addColorStop(0.5, '#121316');
        bgGrad.addColorStop(1, '#090a0c');
      } else {
        bgGrad.addColorStop(0, '#ffffff');
        bgGrad.addColorStop(0.5, '#f4f6fa');
        bgGrad.addColorStop(1, '#e7ecf4');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Subtle drifting smoky particles
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.y < -p.size) {
          p.y = height + p.size;
          p.x = Math.random() * width;
        }
        if (p.x < -p.size) p.x = width + p.size;
        if (p.x > width + p.size) p.x = -p.size;

        const currentOpacity =
          p.opacity * (0.8 + 0.3 * Math.sin(time * 0.8 + p.pulseOffset));

        const pGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        if (isDark) {
          pGrad.addColorStop(0, `rgba(255, 255, 255, ${currentOpacity * 0.6})`);
          pGrad.addColorStop(0.5, `rgba(18, 19, 23, ${currentOpacity * 0.4})`);
          pGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else {
          pGrad.addColorStop(0, `rgba(100, 116, 139, ${currentOpacity * 0.4})`);
          pGrad.addColorStop(0.5, `rgba(148, 163, 184, ${currentOpacity * 0.2})`);
          pGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        }

        ctx.fillStyle = pGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Human silhouette head & shoulders illusion
      const breath = Math.sin(time * 0.8) * 12;
      const swayX = Math.cos(time * 0.6) * 16 + (mouseX - width / 2) * 0.04;
      const swayY = Math.sin(time * 0.5) * 10 + (mouseY - height / 2) * 0.03;

      const centerX = width * 0.5 + swayX;
      const headCenterY = height * 0.38 + swayY + breath * 0.4;
      const headRadius = Math.min(width, height) * 0.22 + breath * 0.25;

      ctx.save();

      // Outer ethereal smoke aura
      const auraGrad = ctx.createRadialGradient(
        centerX,
        headCenterY,
        headRadius * 0.4,
        centerX,
        headCenterY,
        headRadius * 2.2
      );
      if (isDark) {
        auraGrad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
        auraGrad.addColorStop(0.4, 'rgba(8, 9, 12, 0.85)');
        auraGrad.addColorStop(0.7, 'rgba(15, 17, 22, 0.5)');
        auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        auraGrad.addColorStop(0, 'rgba(30, 41, 59, 0.35)');
        auraGrad.addColorStop(0.4, 'rgba(71, 85, 105, 0.2)');
        auraGrad.addColorStop(0.7, 'rgba(148, 163, 184, 0.08)');
        auraGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      }

      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(centerX, headCenterY, headRadius * 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Shoulders & Chest silhouette
      const shoulderWidth = Math.min(width, height) * 0.9 + Math.sin(time * 0.7) * 20;
      const chestY = height * 0.82 + swayY;

      ctx.beginPath();
      ctx.moveTo(centerX - shoulderWidth * 0.65, height + 40);
      ctx.bezierCurveTo(
        centerX - shoulderWidth * 0.5,
        chestY - 30 + Math.sin(time * 0.9) * 10,
        centerX - headRadius * 0.9,
        headCenterY + headRadius * 0.7,
        centerX - headRadius * 0.38,
        headCenterY + headRadius * 0.8
      );
      // Neck left to right
      ctx.lineTo(centerX + headRadius * 0.38, headCenterY + headRadius * 0.8);
      ctx.bezierCurveTo(
        centerX + headRadius * 0.9,
        headCenterY + headRadius * 0.7,
        centerX + shoulderWidth * 0.5,
        chestY - 30 - Math.sin(time * 0.9) * 10,
        centerX + shoulderWidth * 0.65,
        height + 40
      );
      ctx.closePath();

      const bodyGrad = ctx.createRadialGradient(
        centerX,
        chestY - 50,
        headRadius * 0.3,
        centerX,
        chestY,
        shoulderWidth * 0.7
      );
      if (isDark) {
        bodyGrad.addColorStop(0, '#040507');
        bodyGrad.addColorStop(0.6, '#08090d');
        bodyGrad.addColorStop(1, 'rgba(12, 13, 17, 0.2)');
      } else {
        bodyGrad.addColorStop(0, '#1e293b');
        bodyGrad.addColorStop(0.6, '#334155');
        bodyGrad.addColorStop(1, 'rgba(203, 213, 225, 0.3)');
      }
      ctx.fillStyle = bodyGrad;
      ctx.fill();

      // Head silhouette with organic morphing perimeter
      const points = 24;
      ctx.beginPath();
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const isChin = Math.sin(angle) > 0.3;
        const chinMod = isChin ? 0.88 : 1.0;

        const distortion =
          Math.sin(angle * 3 + time * 1.2) * 8 +
          Math.cos(angle * 5 - time * 0.9) * 5;

        const r = (headRadius + distortion) * chinMod;
        const px = centerX + Math.cos(angle) * r;
        const py = headCenterY + Math.sin(angle) * (r * 1.15);

        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.closePath();

      const headGrad = ctx.createRadialGradient(
        centerX - 10,
        headCenterY - 20,
        headRadius * 0.15,
        centerX,
        headCenterY,
        headRadius * 1.2
      );
      if (isDark) {
        headGrad.addColorStop(0, '#020304');
        headGrad.addColorStop(0.7, '#07080b');
        headGrad.addColorStop(1, 'rgba(10, 12, 16, 0.4)');
      } else {
        headGrad.addColorStop(0, '#0f172a');
        headGrad.addColorStop(0.7, '#1e293b');
        headGrad.addColorStop(1, 'rgba(226, 232, 240, 0.5)');
      }
      ctx.fillStyle = headGrad;
      ctx.fill();

      // Soft rim light
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 14;
      ctx.stroke();

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', handleResize);
    };
  }, [interactive, isDark]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      <canvas ref={canvasRef} className="w-full h-full block" />
      {/* Frosted vignette overlay */}
      <div
        className={`absolute inset-0 pointer-events-none transition-colors duration-500 ${
          isDark
            ? 'bg-gradient-to-b from-black/40 via-transparent to-black/80'
            : 'bg-gradient-to-b from-white/30 via-transparent to-slate-200/50'
        }`}
      />
      <div className="absolute inset-0 backdrop-blur-[2px] pointer-events-none" />
    </div>
  );
};
