import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Zap, Timer } from 'lucide-react';
import { useExercises, useWorkouts, epley1RM } from '@/lib/gym-store';
import { Skeleton } from '../ui/skeleton';
import { WorkoutUtil } from '../../lib/workout-util';

const PERIOD_OPTIONS = [7, 14, 30] as const;
type Period = (typeof PERIOD_OPTIONS)[number];

export function PRDashboard() {
  const { exercises, isLoading: isLoadingExercises } = useExercises();
  const { workouts, isLoading: isLoadingWorkouts } = useWorkouts();
  const isLoading = isLoadingExercises || isLoadingWorkouts;

  const [period, setPeriod] = useState<Period>(30);

  const stats = useMemo(() => {
    const totalSessions = workouts.length;
    const totalSets = workouts.reduce((m, w) => m + w.sets.length, 0);

    // ── Strength progress: avg e1RM across all strength exercises ──
    const now = new Date();
    const cutoffRecent = new Date(now);
    cutoffRecent.setDate(cutoffRecent.getDate() - period);
    const cutoffPrior = new Date(now);
    cutoffPrior.setDate(cutoffPrior.getDate() - period * 2);

    const strengthExIds = new Set(
      exercises
        .filter((ex) => !WorkoutUtil.isCardioGroup(ex.muscleGroup))
        .map((ex) => ex.id)
    );

    // For each strength exercise, find best e1RM in a given workout list
    const avgBestE1RM = (wkts: typeof workouts) => {
      const perExercise = new Map<string, number>();
      wkts.forEach((w) => {
        if (!strengthExIds.has(w.exerciseId)) return;
        w.sets.forEach((s) => {
          const e1 = epley1RM(s.weight, s.reps);
          const prev = perExercise.get(w.exerciseId) ?? 0;
          if (e1 > prev) perExercise.set(w.exerciseId, e1);
        });
      });
      const vals = [...perExercise.values()];
      return vals.length > 0
        ? vals.reduce((a, b) => a + b, 0) / vals.length
        : 0;
    };

    const recent = workouts.filter((w) => new Date(w.date) >= cutoffRecent);
    const prior = workouts.filter((w) => {
      const d = new Date(w.date);
      return d >= cutoffPrior && d < cutoffRecent;
    });

    const recentAvg = avgBestE1RM(recent);
    const priorAvg = avgBestE1RM(prior);

    let progressLabel: string;
    let progressDirection: 'up' | 'down' | 'flat' | 'new' = 'new';

    if (priorAvg === 0) {
      progressLabel = recentAvg > 0 ? 'Belum cukup data' : 'First month! 🎉';
      progressDirection = 'new';
    } else if (recentAvg === 0) {
      progressLabel = '—';
      progressDirection = 'flat';
    } else {
      const delta = ((recentAvg - priorAvg) / priorAvg) * 100;
      const abs = Math.abs(delta);
      if (abs < 0.5) {
        progressLabel = 'Holding steady';
        progressDirection = 'flat';
      } else if (delta > 0) {
        progressLabel = `↑ ${abs.toFixed(1)}% stronger`;
        progressDirection = 'up';
      } else {
        progressLabel = `↓ ${abs.toFixed(1)}% weaker`;
        progressDirection = 'down';
      }
    }

    return { totalSessions, totalSets, progressLabel, progressDirection };
  }, [workouts, exercises, period]);

  // ── Strength PRs ──────────────────────────────────────────────────────────
  const strengthPRs = useMemo(() => {
    return exercises
      .filter((ex) => !WorkoutUtil.isCardioGroup(ex.muscleGroup))
      .map((ex) => {
        const entries = workouts.filter((w) => w.exerciseId === ex.id);
        let maxWeight = 0,
          maxReps = 0,
          max1RM = 0;
        let bestSet: { reps: number; weight: number; date: string } | null =
          null;
        entries.forEach((e) =>
          e.sets.forEach((s) => {
            if (s.weight > maxWeight) {
              maxWeight = s.weight;
              bestSet = { ...s, date: e.date };
            }
            if (s.reps > maxReps) maxReps = s.reps;
            const e1 = epley1RM(s.weight, s.reps);
            if (e1 > max1RM) max1RM = e1;
          })
        );
        return {
          ex,
          maxWeight,
          maxReps,
          max1RM: Math.round(max1RM * 10) / 10,
          sessions: entries.length,
          bestSet,
        };
      })
      .filter((p) => p.sessions > 0)
      .sort((a, b) => b.max1RM - a.max1RM);
  }, [exercises, workouts]);

  // ── Cardio PRs ────────────────────────────────────────────────────────────
  const cardioPRs = useMemo(() => {
    return exercises
      .filter((ex) => WorkoutUtil.isCardioGroup(ex.muscleGroup))
      .map((ex) => {
        const entries = workouts.filter((w) => w.exerciseId === ex.id);
        let bestDist = 0,
          bestDur = 0,
          bestPaceRaw = Infinity;
        let bestDistDate = '',
          bestDurDate = '',
          bestPaceDate = '';

        entries.forEach((e) => {
          e.sets.forEach((s) => {
            if ((s.distanceKm ?? 0) > bestDist) {
              bestDist = s.distanceKm ?? 0;
              bestDistDate = e.date;
            }
            if ((s.durationMinutes ?? 0) > bestDur) {
              bestDur = s.durationMinutes ?? 0;
              bestDurDate = e.date;
            }
            if (s.durationMinutes && s.distanceKm && s.distanceKm > 0) {
              const pace = s.durationMinutes / s.distanceKm;
              if (pace < bestPaceRaw) {
                bestPaceRaw = pace;
                bestPaceDate = e.date;
              }
            }
          });
        });

        const bestPace =
          bestPaceRaw < Infinity
            ? (() => {
                const mins = Math.floor(bestPaceRaw);
                const secs = Math.round((bestPaceRaw - mins) * 60);
                return `${mins}:${secs.toString().padStart(2, '0')}/km`;
              })()
            : null;

        return {
          ex,
          bestDist,
          bestDistDate,
          bestDur,
          bestDurDate,
          bestPace,
          bestPaceDate,
          sessions: entries.length,
        };
      })
      .filter((p) => p.sessions > 0)
      .sort((a, b) => b.bestDist - a.bestDist);
  }, [exercises, workouts]);

  const hasPRs = strengthPRs.length > 0 || cardioPRs.length > 0;

  const formatDateID = (iso: string) => {
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Personal Records</h2>
        <p className="text-muted-foreground text-sm">
          All your best numbers, in one place.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Total Sessions"
          value={stats.totalSessions.toString()}
        />
        <StatCard label="Total Sets" value={stats.totalSets.toString()} />
        <StatCard
          label={`vs Last ${period} Days`}
          value={stats.progressLabel}
          direction={stats.progressDirection}
          accent
          footer={
            <div className="mt-3 flex gap-1">
              {PERIOD_OPTIONS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`flex-1 rounded-md px-2 py-1 font-mono text-[10px] font-semibold tracking-widest uppercase transition-colors ${
                    period === p
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary/40 text-muted-foreground hover:bg-secondary/70'
                  }`}
                >
                  {p} Days
                </button>
              ))}
            </div>
          }
        />
      </div>

      {/* rest unchanged below... */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="surface border-border/60 space-y-3 p-5">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-20" />
              <div className="grid grid-cols-3 gap-3 pt-2">
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
              </div>
              <Skeleton className="h-3 w-3/4" />
            </Card>
          ))}
        </div>
      ) : !hasPRs ? (
        <Card className="surface p-10 text-center">
          <Trophy className="text-muted-foreground mx-auto mb-3 h-10 w-10" />
          <p className="text-muted-foreground">
            Log a workout to start setting records 💥
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {strengthPRs.length > 0 && (
            <div className="space-y-3">
              {cardioPRs.length > 0 && (
                <h3 className="text-muted-foreground font-mono text-[11px] tracking-widest uppercase">
                  Strength
                </h3>
              )}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {strengthPRs.map(
                  ({ ex, maxWeight, maxReps, max1RM, bestSet }, idx) => (
                    <Card
                      key={ex.id}
                      className="surface animate-fade-up border-border/60 relative overflow-hidden p-5"
                    >
                      {idx === 0 && (
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-accent text-accent-foreground gap-1 text-[10px] tracking-widest uppercase">
                            <Trophy className="h-3 w-3" /> Top PR
                          </Badge>
                        </div>
                      )}
                      <div className="mb-1 flex items-center gap-2">
                        <h3 className="font-display text-lg font-bold">
                          {ex.name}
                        </h3>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[10px] tracking-widest uppercase"
                      >
                        {ex.muscleGroup}
                      </Badge>
                      <div className="mt-4 grid grid-cols-3 gap-3">
                        <Mini label="Max Weight" value={`${maxWeight}kg`} />
                        <Mini label="Max Reps" value={`${maxReps}`} />
                        <Mini label="e1RM" value={`${max1RM}kg`} highlight />
                      </div>
                      {bestSet && (
                        <div className="border-border/60 text-muted-foreground mt-3 border-t pt-3 font-mono text-xs">
                          Best: {bestSet.reps}×{bestSet.weight}kg ·{' '}
                          {formatDateID(bestSet.date)}
                        </div>
                      )}
                    </Card>
                  )
                )}
              </div>
            </div>
          )}

          {cardioPRs.length > 0 && (
            <div className="space-y-3">
              {strengthPRs.length > 0 && (
                <h3 className="text-muted-foreground font-mono text-[11px] tracking-widest uppercase">
                  Cardio
                </h3>
              )}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {cardioPRs.map(
                  (
                    { ex, bestDist, bestDistDate, bestDur, bestPace, sessions },
                    idx
                  ) => (
                    <Card
                      key={ex.id}
                      className="surface animate-fade-up border-border/60 relative overflow-hidden p-5"
                    >
                      {idx === 0 && cardioPRs.length > 1 && (
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-accent text-accent-foreground gap-1 text-[10px] tracking-widest uppercase">
                            <Timer className="h-3 w-3" /> Top Cardio
                          </Badge>
                        </div>
                      )}
                      <div className="mb-1 flex items-center gap-2">
                        <h3 className="font-display text-lg font-bold">
                          {ex.name}
                        </h3>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[10px] tracking-widest uppercase"
                      >
                        {ex.muscleGroup}
                      </Badge>
                      <div
                        className={`mt-4 grid gap-3 ${bestPace ? 'grid-cols-3' : 'grid-cols-2'}`}
                      >
                        <Mini
                          label="Best Dist"
                          value={bestDist > 0 ? `${bestDist}km` : '—'}
                        />
                        <Mini
                          label="Best Dur"
                          value={bestDur > 0 ? `${bestDur}min` : '—'}
                        />
                        {bestPace && (
                          <Mini label="Best Pace" value={bestPace} highlight />
                        )}
                      </div>
                      <div className="border-border/60 text-muted-foreground mt-3 border-t pt-3 font-mono text-xs">
                        {sessions} session{sessions !== 1 ? 's' : ''}
                        {bestDistDate &&
                          ` · last PR ${formatDateID(bestDistDate)}`}
                      </div>
                    </Card>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  direction,
  footer,
}: {
  label: string;
  value: string;
  accent?: boolean;
  direction?: 'up' | 'down' | 'flat' | 'new';
  footer?: React.ReactNode;
}) {
  const colorClass =
    direction === 'up'
      ? 'text-emerald-400'
      : direction === 'down'
        ? 'text-red-400'
        : direction === 'new'
          ? 'text-primary'
          : '';

  return (
    <Card
      className={`surface border-border/60 p-4 ${accent ? 'border-primary/40' : ''}`}
    >
      <div className="text-muted-foreground text-[11px] tracking-widest uppercase">
        {label}
      </div>
      <div
        className={`font-display mt-1 text-xl leading-tight font-bold ${accent ? colorClass || 'text-gradient-primary' : ''}`}
      >
        {value}
      </div>
      {footer}
    </Card>
  );
}

function Mini({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="border-border/60 bg-secondary/40 rounded-lg border p-2.5">
      <div className="text-muted-foreground flex items-center gap-1 text-[9px] tracking-widest uppercase">
        {highlight && <Zap className="text-primary h-2.5 w-2.5" />}
        {label}
      </div>
      <div
        className={`font-display mt-0.5 text-base font-bold ${highlight ? 'text-primary' : ''}`}
      >
        {value}
      </div>
    </div>
  );
}
