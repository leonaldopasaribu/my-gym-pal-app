import { CalendarDays, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  entryTopWeight,
  entryTotalDistance,
  entryTotalDuration,
  entryVolume,
} from '@/lib/gym-store';
import type { MuscleGroup, WorkoutEntry } from '@/lib/gym-types';
import { WorkoutUtil } from '@/lib/workout-util';
import { Utils } from '@/lib/utils';

type ExerciseLike = { name: string; muscleGroup: string };

export function RecentSessionsList({
  isLoading,
  recent,
  exMap,
  onEdit,
  onDeleteRequest,
}: {
  isLoading: boolean;
  recent: WorkoutEntry[];
  exMap: Record<string, ExerciseLike>;
  onEdit: (workoutId: string) => void;
  onDeleteRequest: (workout: WorkoutEntry) => void;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="border-border/60 bg-secondary/40 space-y-2 rounded-lg border p-3"
          >
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
            <div className="flex gap-1.5">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (recent.length === 0) {
    return (
      <div className="text-muted-foreground py-10 text-center text-sm">
        No workouts logged yet.
      </div>
    );
  }

  const grouped = new Map<string, WorkoutEntry[]>();
  for (const w of recent) {
    if (!grouped.has(w.date)) grouped.set(w.date, []);
    grouped.get(w.date)!.push(w);
  }

  return (
    <div className="max-h-120 space-y-4 overflow-y-auto pr-1 md:max-h-140 lg:max-h-160">
      {Array.from(grouped.entries()).map(([groupDate, workoutsOnDate]) => (
        <div key={groupDate}>
          <div className="bg-card/80 z-10 mt-1 mb-2 flex items-center gap-2 py-1 backdrop-blur-sm">
            <CalendarDays className="text-primary h-3.5 w-3.5 shrink-0" />
            <span className="text-primary font-mono text-[11px] font-semibold tracking-wider uppercase">
              {Utils.formatDateID(groupDate)}
            </span>
            <div className="bg-border/50 h-px flex-1" />
            <span className="text-muted-foreground shrink-0 font-mono text-[10px]">
              {workoutsOnDate.length} exercise
              {workoutsOnDate.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-2">
            {workoutsOnDate.map((w) => {
              const ex = exMap[w.exerciseId];
              const wIsCardio = ex
                ? WorkoutUtil.isCardioGroup(ex.muscleGroup as MuscleGroup)
                : false;
              const dur = entryTotalDuration(w);
              const dist = entryTotalDistance(w);
              const top = entryTopWeight(w);
              const vol = entryVolume(w);
              const speed =
                w.sets.find((s) => (s.speed ?? 0) > 0)?.speed ?? null;

              return (
                <div
                  key={w.id}
                  className="animate-fade-up border-border/60 bg-secondary/40 rounded-lg border p-3 sm:p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="font-display truncate font-bold">
                          {ex?.name ?? '—'}
                        </span>
                        {ex && (
                          <Badge
                            variant="outline"
                            className="shrink-0 text-[10px]"
                          >
                            {ex.muscleGroup}
                          </Badge>
                        )}
                      </div>
                      <div className="text-muted-foreground mt-0.5 text-xs capitalize">
                        {Utils.formatDateID(w.date)}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-muted-foreground h-7 w-7 hover:text-black"
                        onClick={() => onEdit(w.id)}
                        aria-label="Edit workout"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive h-7 w-7"
                        onClick={() => onDeleteRequest(w)}
                        aria-label="Delete workout"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Set / interval badges */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {w.sets.map((s, i) => (
                      <span
                        key={s.id}
                        className="border-border/60 bg-background/60 rounded border px-2 py-0.5 font-mono text-xs"
                      >
                        {i + 1}:{' '}
                        {wIsCardio
                          ? WorkoutUtil.formatCardioSet(s)
                          : `${s.reps}×${s.weight}kg`}
                      </span>
                    ))}
                  </div>

                  {/* Stats row */}
                  {wIsCardio ? (
                    <div className="text-muted-foreground mt-2 flex flex-wrap gap-4 font-mono text-[11px]">
                      <span>
                        DUR{' '}
                        <span className="text-primary font-semibold">
                          {dur}min
                        </span>
                      </span>
                      {dist > 0 && (
                        <span>
                          DIST{' '}
                          <span className="text-primary font-semibold">
                            {dist}km
                          </span>
                        </span>
                      )}
                      {dist > 0 && (
                        <span>
                          PACE{' '}
                          <span className="text-primary font-semibold">
                            {WorkoutUtil.formatPace(dur, dist)}
                          </span>
                        </span>
                      )}
                      {speed !== null && (
                        <span>
                          SPD{' '}
                          <span className="text-primary font-semibold">
                            {speed}
                          </span>
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-muted-foreground mt-2 flex gap-4 font-mono text-[11px]">
                      <span>
                        TOP{' '}
                        <span className="text-primary font-semibold">
                          {top}kg
                        </span>
                      </span>
                      <span>
                        VOL{' '}
                        <span className="text-primary font-semibold">
                          {vol.toLocaleString()}kg
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
