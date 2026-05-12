import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Zap } from 'lucide-react';
import { useExercises, useWorkouts, epley1RM } from '@/lib/gym-store';
import { Skeleton } from '../ui/skeleton';

export function PRDashboard() {
  const { exercises, isLoading: isLoadingExercises } = useExercises();
  const { workouts, isLoading: isLoadingWorkouts } = useWorkouts();
  const isLoading = isLoadingExercises || isLoadingWorkouts;

  const stats = useMemo(() => {
    const totalSessions = workouts.length;
    const totalVolume = workouts.reduce(
      (m, w) => m + w.sets.reduce((s, x) => s + x.reps * x.weight, 0),
      0
    );
    const totalSets = workouts.reduce((m, w) => m + w.sets.length, 0);
    return { totalSessions, totalVolume, totalSets };
  }, [workouts]);

  const prs = useMemo(() => {
    return exercises
      .map((ex) => {
        const entries = workouts.filter((w) => w.exerciseId === ex.id);
        let maxWeight = 0,
          maxReps = 0,
          max1RM = 0,
          sessions = entries.length;
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
          sessions,
          bestSet,
        };
      })
      .filter((p) => p.sessions > 0)
      .sort((a, b) => b.max1RM - a.max1RM);
  }, [exercises, workouts]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Personal Records</h2>
        <p className="text-sm text-muted-foreground">
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
          label="Total Volume"
          value={`${stats.totalVolume.toLocaleString()} kg`}
          accent
        />
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="surface space-y-3 border-border/60 p-5">
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
      ) : prs.length === 0 ? (
        <Card className="surface p-10 text-center">
          <Trophy className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">
            Log a workout to start setting records 💥
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {prs.map(({ ex, maxWeight, maxReps, max1RM, bestSet }, idx) => (
            <Card
              key={ex.id}
              className="surface relative animate-fade-up overflow-hidden border-border/60 p-5"
            >
              {idx === 0 && (
                <div className="absolute right-3 top-3">
                  <Badge className="gap-1 bg-accent text-[10px] uppercase tracking-widest text-accent-foreground">
                    <Trophy className="h-3 w-3" /> Top PR
                  </Badge>
                </div>
              )}
              <div className="mb-1 flex items-center gap-2">
                <h3 className="font-display text-lg font-bold">{ex.name}</h3>
              </div>
              <Badge
                variant="outline"
                className="text-[10px] uppercase tracking-widest"
              >
                {ex.muscleGroup}
              </Badge>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <Mini label="Max Weight" value={`${maxWeight}kg`} />
                <Mini label="Max Reps" value={`${maxReps}`} />
                <Mini label="e1RM" value={`${max1RM}kg`} highlight />
              </div>

              {bestSet && (
                <div className="mt-3 border-t border-border/60 pt-3 font-mono text-xs text-muted-foreground">
                  Best: {bestSet.reps}×{bestSet.weight}kg · {bestSet.date}
                </div>
              )}
            </Card>
          ))}
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
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-1 font-display text-2xl font-bold ${accent ? 'text-gradient-primary' : ''}`}
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
    <div className="rounded-lg border border-border/60 bg-secondary/40 p-2.5">
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-widest text-muted-foreground">
        {highlight && <Zap className="h-2.5 w-2.5 text-primary" />}
        {label}
      </div>
      <div
        className={`mt-0.5 font-display text-base font-bold ${highlight ? 'text-primary' : ''}`}
      >
        {value}
      </div>
    </div>
  );
}
