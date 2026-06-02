import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Zap, Timer } from 'lucide-react';
import { useExercises, useWorkouts, epley1RM } from '@/lib/gym-store';
import { Skeleton } from '../ui/skeleton';
import { WorkoutUtil } from '../../lib/workout-util';

export function PRDashboard() {
  const { exercises, isLoading: isLoadingExercises } = useExercises();
  const { workouts, isLoading: isLoadingWorkouts } = useWorkouts();
  const isLoading = isLoadingExercises || isLoadingWorkouts;

  const exMap = useMemo(
    () => Object.fromEntries(exercises.map((e) => [e.id, e])),
    [exercises]
  );

  const stats = useMemo(() => {
    const totalSessions = workouts.length;
    // Only sum strength volume — cardio volume is in minutes (different unit)
    const totalVolume = workouts
      .filter((w) => {
        const ex = exMap[w.exerciseId];
        return ex && !WorkoutUtil.isCardioGroup(ex.muscleGroup);
      })
      .reduce(
        (m, w) => m + w.sets.reduce((s, x) => s + x.reps * x.weight, 0),
        0
      );
    const totalSets = workouts.reduce((m, w) => m + w.sets.length, 0);
    return { totalSessions, totalVolume, totalSets };
  }, [workouts, exMap]);

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
          bestPaceRaw = Infinity; // lower = better
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
          label="Strength Volume"
          value={`${stats.totalVolume.toLocaleString()} kg`}
          accent
        />
      </div>

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
          {/* ── Strength PRs ── */}
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

          {/* ── Cardio PRs ── */}
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
                    {
                      ex,
                      bestDist,
                      bestDistDate,
                      bestDur,
                      bestDurDate,
                      bestPace,
                      bestPaceDate,
                      sessions,
                    },
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
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <Card
      className={`surface border-border/60 p-4 ${accent ? 'border-primary/40' : ''}`}
    >
      <div className="text-muted-foreground text-[11px] tracking-widest uppercase">
        {label}
      </div>
      <div
        className={`font-display mt-1 text-2xl font-bold ${accent ? 'text-gradient-primary' : ''}`}
      >
        {value}
      </div>
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
