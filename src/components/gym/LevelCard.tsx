import { useMemo, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useWorkouts } from '@/lib/gym-store';
import { Shield } from 'lucide-react';

const TIERS = [
  {
    id: 'noob',
    label: 'Noob',
    emoji: '🐣',
    min: 0,
    max: 5,
    description: 'Every legend starts with an empty bar. Welcome to the floor.',
  },
  {
    id: 'grinder',
    label: 'Grinder',
    emoji: '🧱',
    min: 6,
    max: 15,
    description: 'Building the foundation. The habit is officially forming.',
  },
  {
    id: 'gymrat',
    label: 'Gymrat',
    emoji: '🐀',
    min: 16,
    max: 30,
    description: "You're showing up consistently. The gym feels like home.",
  },
  {
    id: 'iron',
    label: 'Iron',
    emoji: '💪',
    min: 31,
    max: 50,
    description: 'Molded by the iron. Consistency is your superpower.',
  },
  {
    id: 'veteran',
    label: 'Veteran',
    emoji: '🎖️',
    min: 51,
    max: 85,
    description: 'Crossing into serious territory. Most quit before this.',
  },
  {
    id: 'beast',
    label: 'Beast',
    emoji: '👹',
    min: 86,
    max: 130,

    description: "Pure intensity. Heavy weights don't scare you anymore.",
  },
  {
    id: 'savage',
    label: 'Savage',
    emoji: '⚡',
    min: 131,
    max: 255,
    description: 'Relentless. You make time for the gym.',
  },
  {
    id: 'alpha',
    label: 'Alpha',
    emoji: '🦍',
    min: 256,
    max: 330,
    description: 'Silverback status. Total dominance on the floor.',
  },
  {
    id: 'legend',
    label: 'Legend',
    emoji: '🔱',
    min: 331,
    max: 420,
    description: 'Your dedication inspires the whole floor.',
  },
  {
    id: 'goat',
    label: 'GOAT',
    emoji: '🐐',
    min: 421,
    max: 499,
    description: 'Greatest Of All Time. Master of the discipline.',
  },
  {
    id: 'olympia',
    label: 'Olympian',
    emoji: '🏆',
    min: 500,
    max: Infinity,
    description: 'The ultimate peak. Pantheon of gods.',
  },
] as const;

function getTier(n: number) {
  return TIERS.find((t) => n >= t.min && n <= t.max)!;
}
function getProgress(n: number, tier: (typeof TIERS)[number]) {
  if (tier.max === Infinity) return 100;
  const range = tier.max - tier.min + 1;
  return Math.min(100, Math.round(((n - tier.min) / range) * 100));
}

export function LevelCard() {
  const { workouts, isLoading } = useWorkouts();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  const { tier, nextTier, totalSessions, progress, sessionsToNext, activeIdx } =
    useMemo(() => {
      const totalSessions = workouts.length;
      const tier = getTier(totalSessions);
      const activeIdx = TIERS.findIndex((t) => t.id === tier.id);
      const nextTier =
        activeIdx < TIERS.length - 1 ? TIERS[activeIdx + 1] : null;
      const progress = getProgress(totalSessions, tier);
      const sessionsToNext = nextTier ? nextTier.min - totalSessions : 0;
      return {
        tier,
        nextTier,
        totalSessions,
        progress,
        sessionsToNext,
        activeIdx,
      };
    }, [workouts]);

  // Auto-scroll active tier ke tengah
  useEffect(() => {
    if (!scrollRef.current || !activeRef.current) return;
    const container = scrollRef.current;
    const active = activeRef.current;
    const offset =
      active.offsetLeft - container.clientWidth / 2 + active.clientWidth / 2;
    container.scrollTo({ left: offset, behavior: 'smooth' });
  }, [tier.id]);

  if (isLoading) {
    return (
      <Card className="surface border-border/60 overflow-hidden p-0">
        <div className="space-y-4 p-5">
          <Skeleton className="h-3 w-24" />
          <div className="flex items-start gap-5">
            <Skeleton className="h-16 w-16 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="surface border-border/60 overflow-hidden p-0">
      {/* Header */}
      <div className="border-border/40 flex items-center justify-between px-5 pt-5 pb-3">
        <div className="text-primary flex items-center gap-2">
          <Shield className="h-3.5 w-3.5" />
          <span className="font-mono text-[11px] font-bold tracking-[0.2em] uppercase">
            Ranking
          </span>
        </div>
      </div>

      {/* Main row */}
      <div className="p-5">
        <div className="flex items-start gap-5">
          {/* Badge */}
          <div className="relative shrink-0">
            <div className="from-primary/20 to-secondary border-primary/30 flex h-16 w-16 items-center justify-center rounded-2xl border bg-linear-to-br">
              <span className="text-3xl leading-none select-none">
                {tier.emoji}
              </span>
            </div>
            <div className="border-border bg-background text-foreground absolute -right-1 -bottom-2 rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold">
              {nextTier ? `${progress}%` : 'MAX'}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 pt-1">
            <h3 className="font-display text-2xl leading-none font-bold">
              {tier.label}
            </h3>
            <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
              {tier.description}
            </p>
          </div>

          <div className="flex flex-col items-end gap-0 px-2 py-1">
            <span className="text-primary font-mono text-[30px] font-bold">
              {totalSessions}
            </span>
            <span className="text-muted-foreground text-[9px] font-medium tracking-tight uppercase">
              {totalSessions === 1 ? 'session' : 'sessions'}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-5">
          <div className="mb-2 flex items-end justify-between">
            <span className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
              {nextTier
                ? `Next: ${nextTier.emoji} ${nextTier.label}`
                : 'Max Rank Achieved'}
            </span>
            {nextTier && (
              <span className="text-foreground/80 font-mono text-[10px] font-medium">
                {sessionsToNext} session to go
              </span>
            )}
          </div>
          <div className="bg-secondary h-2 w-full overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full shadow-[0_0_10px_hsl(var(--primary)/0.4)] transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Rank ladder */}
      <div className="border-border/40 bg-secondary/20 px-5 py-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-muted-foreground/70 text-[9px] font-bold tracking-widest uppercase">
            Rank Ladder
          </span>
          <span className="text-muted-foreground/70 font-mono text-[9px] font-bold">
            {activeIdx + 1} / {TIERS.length}
          </span>
        </div>

        {/* Scroll container dengan fade edges */}
        <div className="relative">
          <div className="from-secondary/20 pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-linear-to-r to-transparent" />
          <div className="from-secondary/20 pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-linear-to-l to-transparent" />

          <div
            ref={scrollRef}
            className="no-scrollbar flex gap-2 overflow-x-auto pb-1"
            style={{ scrollbarWidth: 'none' }}
          >
            {TIERS.map((t, i) => {
              const isActive = i === activeIdx;
              const isPast = i < activeIdx;
              return (
                <div
                  key={t.id}
                  ref={isActive ? activeRef : null}
                  className="flex shrink-0 flex-col items-center gap-1"
                  style={{ marginLeft: '5px', width: 72 }}
                >
                  {/* Tier box */}
                  <div
                    title={`${t.label} · ${t.max === Infinity ? `${t.min}+` : `${t.min}–${t.max}`} sessions`}
                    className={[
                      'mt-1 flex h-14 w-full items-center justify-center rounded-xl border transition-all duration-300',
                      isActive
                        ? 'border-primary/50 bg-primary/10 scale-105 shadow-[0_0_12px_-4px_hsl(var(--primary)/0.4)]'
                        : isPast
                          ? 'border-border/50 bg-secondary/50 opacity-60'
                          : 'border-border/25 bg-secondary/20 opacity-30',
                    ].join(' ')}
                  >
                    <span className={isActive ? 'text-xl' : 'text-lg'}>
                      {t.emoji}
                    </span>
                  </div>

                  {/* Nama rank */}
                  <span
                    className={[
                      'font-mono text-[9px] tracking-wider uppercase transition-colors',
                      isActive
                        ? 'text-primary font-semibold'
                        : 'text-muted-foreground/40',
                    ].join(' ')}
                  >
                    {t.label}
                  </span>

                  {/* Session range */}
                  <span className="text-muted-foreground/30 font-mono text-[8px]">
                    {t.max === Infinity ? `${t.min}+` : `${t.min}–${t.max}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
