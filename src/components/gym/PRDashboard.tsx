import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Zap } from 'lucide-react';
import { useExercises, useWorkouts, epley1RM } from '@/lib/gym-store';

export function PRDashboard() {
  const { exercises } = useExercises();
  const { workouts } = useWorkouts();

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
          Semua angka terbaik kamu, di satu tempat.
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

      {prs.length === 0 ? (
        <Card className="p-10 text-center surface">
          <Trophy className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            Catat workout untuk mulai bikin rekor 💥
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {prs.map(({ ex, maxWeight, maxReps, max1RM, bestSet }, idx) => (
            <Card
              key={ex.id}
              className="p-5 surface border-border/60 relative overflow-hidden animate-fade-up"
            >
              {idx === 0 && (
                <div className="absolute top-3 right-3">
                  <Badge className="bg-accent text-accent-foreground gap-1 text-[10px] uppercase tracking-widest">
                    <Trophy className="h-3 w-3" /> Top PR
                  </Badge>
                </div>
              )}
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-display font-bold text-lg">{ex.name}</h3>
              </div>
              <Badge
                variant="outline"
                className="text-[10px] uppercase tracking-widest"
              >
                {ex.muscleGroup}
              </Badge>

              <div className="grid grid-cols-3 gap-3 mt-4">
                <Mini label="Max Weight" value={`${maxWeight}kg`} />
                <Mini label="Max Reps" value={`${maxReps}`} />
                <Mini label="e1RM" value={`${max1RM}kg`} highlight />
              </div>

              {bestSet && (
                <div className="mt-3 pt-3 border-t border-border/60 text-xs text-muted-foreground font-mono">
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
      className={`p-4 surface border-border/60 ${accent ? 'border-primary/40' : ''}`}
    >
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div
        className={`font-display text-2xl font-bold mt-1 ${accent ? 'text-gradient-primary' : ''}`}
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
    <div className="rounded-lg bg-secondary/40 border border-border/60 p-2.5">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
        {highlight && <Zap className="h-2.5 w-2.5 text-primary" />}
        {label}
      </div>
      <div
        className={`font-display font-bold text-base mt-0.5 ${highlight ? 'text-primary' : ''}`}
      >
        {value}
      </div>
    </div>
  );
}
