import { useMemo, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useWorkouts } from '@/lib/gym-store';
import { Shield } from 'lucide-react';

const TIERS = [
  {
    id: 'noob',
    label: 'Noob',
    emoji: '🐣', // Lebih melambangkan awal mula (baru menetas) dibanding telur pasif
    min: 0,
    max: 5,
    description: 'Every legend starts with an empty bar. Welcome to the floor.',
  },
  {
    id: 'grinder', // Ditukar ke atas karena deskripsinya cocok untuk pembentukan habit awal
    label: 'Grinder',
    emoji: '🧱', // Melambangkan sedang menyusun batu bata fondasi
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
    description:
      "You're showing up consistently. The gym is starting to feel like home.",
  },
  {
    id: 'iron',
    label: 'Iron',
    emoji: '💪', // Lebih aktif melambangkan otot/kekuatan dibanding sekadar gear mekanik
    min: 31,
    max: 60,
    description:
      'Molded by the iron. Consistency has officially become your superpower.',
  },
  {
    id: 'veteran',
    label: 'Veteran',
    emoji: '🎖️',
    min: 61,
    max: 100,
    description:
      'Crossing into the three-figure club. Most people quit long before this.',
  },
  {
    id: 'beast',
    label: 'Beast',
    emoji: '👹', // Aura "Beast Mode" lebih dapet dibanding fire biasa
    min: 101,
    max: 175,
    description: 'Pure intensity. Heavy weights don’t scare you anymore.',
  },
  {
    id: 'savage',
    label: 'Savage',
    emoji: '⚡', // Menggambarkan energi yang meledak-ledak di setiap session
    min: 176,
    max: 275,
    description: 'Relentless. You don’t find time for the gym, you make it.',
  },
  {
    id: 'alpha',
    label: 'Alpha',
    emoji: '🦍',
    min: 276,
    max: 400,
    description: 'Silverback status. Head down, heavy weight, total dominance.',
  },
  {
    id: 'legend',
    label: 'Legend',
    emoji: '🔱', // Trident/Trisula, memberikan kesan mitologi yang sakral dibanding mahkota biasa
    min: 401,
    max: 600,
    description:
      'Your dedication isn’t just personal anymore—it inspires the whole floor.',
  },
  {
    id: 'goat',
    label: 'GOAT',
    emoji: '🐐',
    min: 601,
    max: 999,
    description: 'Greatest Of All Time. You have mastered the discipline.',
  },
  {
    id: 'olympia',
    label: 'Mr. Olympia',
    emoji: '🏆', // Trofi emas murni untuk kasta tertinggi binaraga
    min: 1000,
    max: Infinity,
    description: 'The ultimate peak. Welcome to the pantheon of gods.',
  },
] as const;

function getTier(totalSessions: number) {
  return TIERS.find((t) => totalSessions >= t.min && totalSessions <= t.max)!;
}

function getProgress(totalSessions: number, tier: (typeof TIERS)[number]) {
  if (tier.max === Infinity) return 100;
  const range = tier.max - tier.min + 1;
  const progress = totalSessions - tier.min;
  return Math.min(100, Math.round((progress / range) * 100));
}

function getNextTier(tier: (typeof TIERS)[number]) {
  const idx = TIERS.findIndex((t) => t.id === tier.id);
  return idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
}

export function LevelCard() {
  const { workouts, isLoading } = useWorkouts();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  const { tier, nextTier, totalSessions, progress, sessionsToNext } =
    useMemo(() => {
      const totalSessions = workouts.length;
      const tier = getTier(totalSessions);
      const nextTier = getNextTier(tier);
      const progress = getProgress(totalSessions, tier);
      const sessionsToNext = nextTier ? nextTier.min - totalSessions : 0;
      return { tier, nextTier, totalSessions, progress, sessionsToNext };
    }, [workouts]);

  // Auto-scroll so the active tier is centered in the scroll container
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
      <Card className="surface border-border/60 p-5 sm:p-6">
        <Skeleton className="mb-4 h-3 w-28" />
        <Skeleton className="mb-2 h-10 w-40" />
        <Skeleton className="h-2 w-full rounded-full" />
      </Card>
    );
  }

  const isMaxTier = !nextTier;
  const activeTierIdx = TIERS.findIndex((t) => t.id === tier.id);

  return (
    <Card className="surface border-border/60 p-5 sm:p-6">
      {/* Header label */}
      <div className="text-primary mb-4 flex items-center gap-2 font-mono text-[11px] tracking-[0.3em] uppercase">
        <Shield className="h-3.5 w-3.5" />
        Rank
      </div>

      {/* Current level */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="border-border/60 bg-secondary/40 flex h-12 w-12 items-center justify-center rounded-xl border text-2xl"
            aria-hidden="true"
          >
            {tier.emoji}
          </span>
          <div>
            <div className="font-display text-2xl leading-none font-bold sm:text-3xl">
              {tier.label}
            </div>
            <div className="text-muted-foreground mt-1 text-xs">
              {tier.description}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="font-display text-3xl leading-none font-bold sm:text-4xl">
            {totalSessions}
          </div>
          <div className="text-muted-foreground mt-1 font-mono text-[10px] tracking-wider uppercase">
            {totalSessions === 1 ? 'session' : 'sessions'}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {!isMaxTier && (
        <div className="space-y-2">
          <div className="bg-secondary/60 h-1.5 w-full overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-muted-foreground flex items-center justify-between font-mono text-[10px] tracking-wider uppercase">
            <span>
              {progress}% to {nextTier!.label}
            </span>
            <span>
              {sessionsToNext} {sessionsToNext === 1 ? 'session' : 'sessions'}{' '}
              to go
            </span>
          </div>
        </div>
      )}

      {/* Max tier unlocked */}
      {isMaxTier && (
        <div className="border-border/60 bg-primary/5 flex items-center gap-2 rounded-lg border px-3 py-2">
          <span className="text-sm">🐐</span>
          <span className="text-muted-foreground font-mono text-[10px] tracking-wider uppercase">
            Max rank unlocked · You are the GOAT
          </span>
        </div>
      )}

      {/* Scrollable tier ladder */}
      <div className="relative mt-5">
        {/* Fade edges hint at scrollability */}
        <div className="from-card pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-linear-to-r to-transparent" />
        <div className="from-card pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-linear-to-l to-transparent" />

        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto px-2 pb-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {TIERS.map((t, i) => {
            const isActive = t.id === tier.id;
            const isPast = activeTierIdx > i;

            return (
              <div
                key={t.id}
                ref={isActive ? activeRef : null}
                className="flex shrink-0 flex-col items-center gap-1.5"
                style={{ width: 72 }}
              >
                {/* Tier box */}
                <div
                  title={`${t.label} · ${t.max === Infinity ? `${t.min}+` : `${t.min}–${t.max}`} sessions`}
                  className={[
                    'mt-2 flex h-14 w-full flex-col items-center justify-center rounded-xl border transition-all duration-300',
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

                {/* Label */}
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
    </Card>
  );
}
