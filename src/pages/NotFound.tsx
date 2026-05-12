import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { Dumbbell, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTE_URL } from '@/constants/route-url';

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    console.error(
      '404 Error: User attempted to access non-existent route:',
      location.pathname
    );
  }, [location.pathname]);

  // Subtle animated grid background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf: number;
    let tick = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const size = 48;
      const cols = Math.ceil(canvas.width / size) + 1;
      const rows = Math.ceil(canvas.height / size) + 1;

      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;

      for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
          const pulse =
            Math.sin(tick * 0.01 + x * 0.3) * Math.cos(tick * 0.008 + y * 0.3);
          if (pulse > 0.7) {
            ctx.globalAlpha = (pulse - 0.7) * 0.5;
            ctx.fillStyle = 'rgba(255,255,255,1)';
            ctx.fillRect(x * size - 1, y * size - 1, 2, 2);
          }
        }
      }

      ctx.globalAlpha = 1;
      ctx.beginPath();
      for (let x = 0; x <= cols; x++) {
        ctx.moveTo(x * size, 0);
        ctx.lineTo(x * size, canvas.height);
      }
      for (let y = 0; y <= rows; y++) {
        ctx.moveTo(0, y * size);
        ctx.lineTo(canvas.width, y * size);
      }
      ctx.stroke();

      tick++;
      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background">
      {/* Animated grid */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0"
        aria-hidden
      />

      {/* Radial vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 60% at 50% 50%, transparent 30%, hsl(0 0% 6% / 0.85) 100%)',
        }}
        aria-hidden
      />

      {/* Content */}
      <div className="relative z-10 flex max-w-md flex-col items-center gap-8 px-6 text-center">
        {/* Big 404 */}
        <div className="relative select-none">
          <span
            className="font-display font-bold leading-none tracking-tighter"
            style={{
              fontSize: 'clamp(7rem, 22vw, 13rem)',
              letterSpacing: '-0.05em',
              background:
                'linear-gradient(to bottom, hsl(0 0% 98%) 0%, hsl(0 0% 98%) 45%, hsl(0 0% 35%) 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            404
          </span>
        </div>

        {/* Icon + label */}
        <div className="-mt-4 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-border/60 bg-secondary/40 px-3 py-1.5">
            <Dumbbell className="h-3.5 w-3.5 text-primary" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Page not found
            </span>
          </div>

          <h1 className="font-display text-xl font-bold text-foreground">
            You wandered off the track.
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            The route{' '}
            <code className="rounded border border-border/60 bg-secondary/60 px-1.5 py-0.5 font-mono text-xs text-foreground/70">
              {location.pathname}
            </code>{' '}
            doesn't exist. Let's get you back to your gains.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            className="glow-primary flex-1 gap-2"
            onClick={() => navigate(ROUTE_URL.HOME)}
          >
            <Home className="h-4 w-4" />
            Home
          </Button>
        </div>

        {/* Footer mono tag */}
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/40">
          MY GYM PAL · ERR_ROUTE_NOT_FOUND
        </p>
      </div>
    </div>
  );
};

export default NotFound;
