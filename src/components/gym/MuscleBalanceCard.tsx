import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { useWorkouts, useExercises } from '@/lib/gym-store';
import { Activity } from 'lucide-react';
import type { MuscleGroup } from '@/lib/gym-types';

// ─── Config ──────────────────────────────────────────────────────────────────

const GROUP_META: Record<MuscleGroup, { label: string; color: string }> = {
  Chest: { label: 'Chest', color: '#8B5CF6' },
  Shoulders: { label: 'Shoulders', color: '#A855F7' },
  Triceps: { label: 'Triceps', color: '#C084FC' },

  Back: { label: 'Back', color: '#14B8A6' },
  Biceps: { label: 'Biceps', color: '#06B6D4' },
  Forearms: { label: 'Forearms', color: '#3B82F6' },

  Legs: { label: 'Legs', color: '#F59E0B' },
  Glutes: { label: 'Glutes', color: '#F97316' },

  Core: { label: 'Core', color: '#22C55E' },

  Cardio: { label: 'Cardio', color: '#EF4444' },
  Other: { label: 'Other', color: '#64748B' },
};

// Push = Chest + Shoulders + Triceps
// Pull = Back + Biceps
const PUSH_MUSCLES: MuscleGroup[] = ['Chest', 'Shoulders', 'Triceps'];
const PULL_MUSCLES: MuscleGroup[] = ['Back', 'Biceps', 'Forearms'];
const LEG_MUSCLES: MuscleGroup[] = ['Legs', 'Glutes'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getLast30Days(): Set<string> {
  const s = new Set<string>();
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    s.add(d.toISOString().slice(0, 10));
  }
  return s;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function MuscleBalanceCard() {
  const { workouts, isLoading: isLoadingWorkouts } = useWorkouts();
  const { exercises, isLoading: isLoadingExercises } = useExercises();
  const isLoading = isLoadingWorkouts || isLoadingExercises;

  const { rows, insight } = useMemo(() => {
    const last30 = getLast30Days();
    const recentWorkouts = workouts.filter((w) => last30.has(w.date));

    const exMap = new Map<string, MuscleGroup>();
    exercises.forEach((e) => exMap.set(e.id, e.muscleGroup));

    const sessionCount: Partial<Record<MuscleGroup, number>> = {};
    recentWorkouts.forEach((w) => {
      const mg = exMap.get(w.exerciseId);
      if (!mg) return;
      sessionCount[mg] = (sessionCount[mg] ?? 0) + 1;
    });

    const allGroups = Object.keys(GROUP_META) as MuscleGroup[];

    const rawRows = allGroups
      .map((mg) => ({
        mg,
        label: GROUP_META[mg].label,
        color: GROUP_META[mg].color,
        sessions: sessionCount[mg] ?? 0,
      }))
      .filter((r) => r.sessions > 0)
      .sort((a, b) => b.sessions - a.sessions);

    if (rawRows.length === 0) {
      return {
        rows: [],
        insight: null,
      };
    }

    const totalSessions = rawRows.reduce((s, r) => s + r.sessions, 0);

    const rows = rawRows.map((r) => ({
      ...r,
      pct:
        totalSessions > 0 ? Math.round((r.sessions / totalSessions) * 100) : 0,
    }));

    // Insight: check push/pull/legs balance
    const nonCardio = rows.filter((r) => r.mg !== 'Cardio' && r.mg !== 'Other');
    const nonCardioTotal = nonCardio.reduce((s, r) => s + r.sessions, 0);
    let insight: string | null = null;
    if (nonCardioTotal > 0) {
      const pushSessions = rows
        .filter((r) => PUSH_MUSCLES.includes(r.mg))
        .reduce((s, r) => s + r.sessions, 0);
      const pullSessions = rows
        .filter((r) => PULL_MUSCLES.includes(r.mg))
        .reduce((s, r) => s + r.sessions, 0);
      const legSessions = rows
        .filter((r) => LEG_MUSCLES.includes(r.mg))
        .reduce((s, r) => s + r.sessions, 0);

      const pushPct = Math.round((pushSessions / nonCardioTotal) * 100);
      const pullPct = Math.round((pullSessions / nonCardioTotal) * 100);
      const legPct = Math.round((legSessions / nonCardioTotal) * 100);

      if (legPct < 15) {
        insight = `Legs are only ${legPct}% of your training. Add a squat or RDL session this week.`;
      } else if (pullPct < pushPct - 15) {
        insight = `Pull (${pullPct}%) is lagging behind push (${pushPct}%). Add rows or pull-ups to balance.`;
      } else if (pullPct < 20) {
        insight = `Pull training is low at ${pullPct}%. Balance with rows or pull-ups.`;
      }
    }

    return { rows, insight };
  }, [workouts, exercises]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <Card className="surface border-border/60 p-5 sm:p-6">
        <div className="animate-pulse space-y-3">
          <div className="bg-muted h-3 w-36 rounded" />
          <div className="bg-muted h-8 w-24 rounded" />
          <div className="space-y-2">
            {[80, 65, 45, 30, 20].map((w, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="bg-muted h-3 w-14 rounded" />
                <div
                  className="bg-muted h-2 rounded"
                  style={{ width: `${w}%`, flex: 'none' }}
                />
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (rows.length === 0) {
    return (
      <Card className="surface border-border/60 p-5 sm:p-6">
        <div className="text-primary mb-3 flex items-center gap-2 font-mono text-[11px] tracking-[0.3em] uppercase">
          <Activity className="h-3.5 w-3.5" />
          Muscle Balance
        </div>
        <p className="text-muted-foreground text-sm">
          Log a few workouts to see your muscle group breakdown.
        </p>
      </Card>
    );
  }

  const maxSessions = Math.max(...rows.map((r) => r.sessions));

  return (
    <Card className="surface border-border/60 p-5 sm:p-6">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="text-primary flex items-center gap-2 font-mono text-[11px] tracking-[0.3em] uppercase">
          <Activity className="h-3.5 w-3.5" />
          Muscle Balance
        </div>
        <span className="text-muted-foreground font-mono text-[10px] tracking-wider uppercase">
          30 days
        </span>
      </div>

      {/* Bars */}
      <div className="space-y-3">
        {rows.map((r) => {
          const barW =
            maxSessions > 0 ? Math.round((r.sessions / maxSessions) * 100) : 0;
          const isLow =
            r.pct < 15 &&
            r.mg !== 'Cardio' &&
            r.mg !== 'Other' &&
            rows.filter((x) => x.mg !== 'Cardio' && x.mg !== 'Other').length >
              2;

          return (
            <div key={r.mg} className="flex items-center gap-3">
              <div className="text-muted-foreground w-16 shrink-0 font-mono text-[11px] tracking-wide">
                {r.label}
              </div>
              <div className="border-border/30 relative h-2 flex-1 overflow-hidden rounded-full border">
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                  style={{ width: `${barW}%`, backgroundColor: r.color }}
                />
              </div>
              <div className="flex w-14 shrink-0 items-center justify-end gap-1.5">
                <span className="font-mono text-[11px] font-medium tabular-nums">
                  {r.pct}%
                </span>
                {isLow && (
                  <span className="border-border/40 bg-secondary/60 text-muted-foreground rounded border px-1 py-0 font-mono text-[9px] tracking-wider uppercase">
                    low
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Insight */}
      {insight && (
        <div className="border-border/40 bg-secondary/20 mt-4 rounded-xl border px-3 py-2.5">
          <p className="text-muted-foreground text-xs leading-relaxed">
            <span className="text-foreground font-medium">Tip — </span>
            {insight}
          </p>
        </div>
      )}
    </Card>
  );
}
