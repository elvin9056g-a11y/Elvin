import React, { useEffect, useRef } from 'react';

interface ChatFluidBackgroundProps {
  isDark?: boolean;
}

export const ChatFluidBackground: React.FC<ChatFluidBackgroundProps> = ({ isDark = true }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    const resize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.scale(dpr, dpr);
    };

    resize();
    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas);

    // Exact color palette sampled from the user's video:
    // Warm burnt orange, fiery coral, deep navy, electric azure, peach glow, midnight indigo
    const blobs = [
      {
        // Orb 1: Vibrant Coral / Orange (Top left & Center)
        baseX: 0.35,
        baseY: 0.32,
        rFactor: 0.75,
        speedX: 0.00065,
        speedY: 0.00085,
        ampX: 0.22,
        ampY: 0.18,
        phase: 0.2,
        colorStops: isDark
          ? [
              { offset: 0, color: 'rgba(234, 88, 12, 0.85)' },    // vibrant orange
              { offset: 0.45, color: 'rgba(225, 29, 72, 0.65)' },  // fiery coral
              { offset: 0.85, color: 'rgba(194, 65, 12, 0.2)' },
              { offset: 1, color: 'rgba(234, 88, 12, 0)' },
            ]
          : [
              { offset: 0, color: 'rgba(249, 115, 22, 0.75)' },
              { offset: 0.5, color: 'rgba(244, 63, 94, 0.55)' },
              { offset: 1, color: 'rgba(249, 115, 22, 0)' },
            ],
      },
      {
        // Orb 2: Electric Azure / Vibrant Blue (Right & Bottom right)
        baseX: 0.78,
        baseY: 0.62,
        rFactor: 0.78,
        speedX: 0.00075,
        speedY: 0.0006,
        ampX: 0.2,
        ampY: 0.22,
        phase: 2.1,
        colorStops: isDark
          ? [
              { offset: 0, color: 'rgba(37, 99, 235, 0.85)' },    // electric azure
              { offset: 0.45, color: 'rgba(2, 132, 199, 0.65)' }, // vibrant cerulean
              { offset: 0.85, color: 'rgba(29, 78, 216, 0.25)' },
              { offset: 1, color: 'rgba(37, 99, 235, 0)' },
            ]
          : [
              { offset: 0, color: 'rgba(59, 130, 246, 0.75)' },
              { offset: 0.5, color: 'rgba(14, 165, 233, 0.55)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0)' },
            ],
      },
      {
        // Orb 3: Deep Midnight Indigo / Navy (Bottom left & Center drift)
        baseX: 0.22,
        baseY: 0.78,
        rFactor: 0.82,
        speedX: 0.0005,
        speedY: 0.0007,
        ampX: 0.18,
        ampY: 0.16,
        phase: 3.8,
        colorStops: isDark
          ? [
              { offset: 0, color: 'rgba(15, 23, 42, 0.95)' },    // deep navy slate
              { offset: 0.5, color: 'rgba(30, 27, 75, 0.75)' },   // midnight indigo
              { offset: 0.9, color: 'rgba(15, 23, 42, 0.2)' },
              { offset: 1, color: 'rgba(15, 23, 42, 0)' },
            ]
          : [
              { offset: 0, color: 'rgba(30, 41, 59, 0.65)' },
              { offset: 0.55, color: 'rgba(51, 65, 85, 0.45)' },
              { offset: 1, color: 'rgba(30, 41, 59, 0)' },
            ],
      },
      {
        // Orb 4: Warm Sunlight Peach / Amber Glow (Drifting top right / center)
        baseX: 0.65,
        baseY: 0.25,
        rFactor: 0.62,
        speedX: 0.0009,
        speedY: 0.00055,
        ampX: 0.24,
        ampY: 0.15,
        phase: 4.9,
        colorStops: isDark
          ? [
              { offset: 0, color: 'rgba(251, 146, 60, 0.75)' },   // luminous peach
              { offset: 0.4, color: 'rgba(217, 70, 239, 0.45)' }, // soft magenta touch
              { offset: 0.8, color: 'rgba(234, 88, 12, 0.15)' },
              { offset: 1, color: 'rgba(251, 146, 60, 0)' },
            ]
          : [
              { offset: 0, color: 'rgba(253, 186, 116, 0.8)' },
              { offset: 0.45, color: 'rgba(251, 113, 133, 0.5)' },
              { offset: 1, color: 'rgba(253, 186, 116, 0)' },
            ],
      },
      {
        // Orb 5: Deep Twilight Blue / Cyan highlight (Upper edge & center interaction)
        baseX: 0.82,
        baseY: 0.35,
        rFactor: 0.55,
        speedX: 0.0006,
        speedY: 0.0008,
        ampX: 0.15,
        ampY: 0.2,
        phase: 1.4,
        colorStops: isDark
          ? [
              { offset: 0, color: 'rgba(14, 165, 233, 0.7)' },    // vivid sky cyan
              { offset: 0.5, color: 'rgba(30, 58, 138, 0.5)' },   // rich deep blue
              { offset: 1, color: 'rgba(14, 165, 233, 0)' },
            ]
          : [
              { offset: 0, color: 'rgba(56, 189, 248, 0.65)' },
              { offset: 0.5, color: 'rgba(37, 99, 235, 0.45)' },
              { offset: 1, color: 'rgba(56, 189, 248, 0)' },
            ],
      },
    ];

    let startTime = performance.now();

    const render = (currentTime: number) => {
      const elapsed = currentTime - startTime;

      if (width <= 0 || height <= 0) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // Base background color
      ctx.fillStyle = isDark ? '#080d16' : '#eef2f6';
      ctx.fillRect(0, 0, width, height);

      // Render each morphing radial gradient blob with composite blending
      const maxDim = Math.max(width, height);

      blobs.forEach((blob, idx) => {
        // Organic, natural floating physics via sine & cosine superposition
        const t = elapsed;
        const currentX =
          (blob.baseX +
            Math.sin(t * blob.speedX + blob.phase) * blob.ampX +
            Math.cos(t * blob.speedX * 0.5 + blob.phase * 0.7) * 0.08) *
          width;

        const currentY =
          (blob.baseY +
            Math.cos(t * blob.speedY + blob.phase) * blob.ampY +
            Math.sin(t * blob.speedY * 0.6 + blob.phase * 0.5) * 0.08) *
          height;

        // Subtle breathing radius
        const breath = 1 + 0.15 * Math.sin(t * 0.0009 + idx * 1.2);
        const radius = maxDim * blob.rFactor * breath;

        const grad = ctx.createRadialGradient(
          currentX,
          currentY,
          radius * 0.05,
          currentX,
          currentY,
          radius
        );

        blob.colorStops.forEach((stop) => {
          grad.addColorStop(stop.offset, stop.color);
        });

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      ro.disconnect();
    };
  }, [isDark]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* Real-time 60fps Canvas Animation with hardware-accelerated heavy blur filter for the exact dreamy fluid look */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover filter blur-[48px] sm:blur-[64px] scale-110 transform-gpu"
        style={{
          willChange: 'transform, filter',
          backfaceVisibility: 'hidden',
        }}
      />

      {/* Subtle organic vignette & depth overlay */}
      <div
        className={`absolute inset-0 pointer-events-none ${
          isDark
            ? 'bg-gradient-to-b from-black/25 via-transparent to-black/35'
            : 'bg-gradient-to-b from-white/10 via-transparent to-white/20'
        }`}
      />
    </div>
  );
};
