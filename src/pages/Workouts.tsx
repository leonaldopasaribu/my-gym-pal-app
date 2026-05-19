import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Search, Trash2, X, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useExercises,
  useWorkouts,
  entryTopWeight,
  entryVolume,
  entryTotalDistance,
  entryTotalDuration,
} from '@/lib/gym-store';
import type { WorkoutEntry } from '@/lib/gym-types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { AppHeader } from '@/components/gym/AppHeader';
import { ROUTE_URL } from '@/constants/route-url';
import { WorkoutUtil } from '@/lib/workout-util';

function formatDateLabel(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

function isThisWeek(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return d >= startOfWeek;
}

export default function Workouts() {
  const navigate = useNavigate();
  const { exercises, isLoading: isLoadingExercises } = useExercises();
  const {
    workouts,
    removeWorkout,
    isLoading: isLoadingWorkouts,
  } = useWorkouts();

  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<string>('');
  const [deleteTarget, setDeleteTarget] = useState<WorkoutEntry | null>(null);

  const exMap = useMemo(
    () => Object.fromEntries(exercises.map((e) => [e.id, e])),
    [exercises]
  );

  const muscleGroups = useMemo(() => {
    const groups = new Set<string>();
    exercises.forEach((e) => groups.add(e.muscleGroup));
    return Array.from(groups).sort();
  }, [exercises]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return workouts.filter((w) => {
      const ex = exMap[w.exerciseId];
      if (!ex) return false;
      if (muscleFilter && ex.muscleGroup !== muscleFilter) return false;
      if (
        q &&
        !ex.name.toLowerCase().includes(q) &&
        !ex.muscleGroup.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [workouts, exMap, search, muscleFilter]);

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, WorkoutEntry[]>();
    for (const w of filtered) {
      if (!map.has(w.date)) map.set(w.date, []);
      map.get(w.date)!.push(w);
    }
    return map;
  }, [filtered]);

  // Summary stats — only count strength volume (cardio volume = duration, different unit)
  const stats = useMemo(() => {
    const totalSets = workouts.reduce((a, w) => a + w.sets.length, 0);
    const totalVol = workouts
      .filter((w) => {
        const ex = exMap[w.exerciseId];
        return ex && !WorkoutUtil.isCardioGroup(ex.muscleGroup);
      })
      .reduce((a, w) => a + entryVolume(w), 0);
    const thisWeek = workouts.filter((w) => isThisWeek(w.date)).length;
    const uniqueDays = new Set(workouts.map((w) => w.date)).size;
    return { totalSets, totalVol, thisWeek, uniqueDays };
  }, [workouts, exMap]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await removeWorkout(deleteTarget.id);
    toast.success('Session deleted');
    setDeleteTarget(null);
  };

  const deleteTargetEx = deleteTarget ? exMap[deleteTarget.exerciseId] : null;
  const deleteTargetIsCardio = deleteTargetEx
    ? WorkoutUtil.isCardioGroup(deleteTargetEx.muscleGroup)
    : false;

  const isLoading = isLoadingWorkouts || isLoadingExercises;

  return (
    <div className="min-h-screen">
      <AppHeader
        isShowButtonBack={true}
        handleBack={() => navigate(ROUTE_URL.WORKOUT_LOGGER)}
      />
      <div className="container mt-2">
        <div>
          <h2 className="font-display text-2xl font-bold">All Workouts</h2>
          <p className="text-muted-foreground text-sm">
            {isLoading
              ? '—'
              : `${workouts.length} sessions across ${stats.uniqueDays} training days`}
          </p>
        </div>
      </div>

      <div className="container space-y-5 py-5 pb-24">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: 'Total Sessions',
              value: isLoading ? '—' : workouts.length,
            },
            { label: 'This Week', value: isLoading ? '—' : stats.thisWeek },
            {
              label: 'Total Sets',
              value: isLoading ? '—' : stats.totalSets.toLocaleString(),
            },
            {
              label: 'Strength Vol',
              value: isLoading ? '—' : `${(stats.totalVol / 1000).toFixed(1)}t`,
            },
          ].map((s) => (
            <div
              key={s.label}
              className="border-border/60 bg-secondary/30 space-y-1 rounded-xl border p-4"
            >
              <div className="text-muted-foreground font-mono text-[10px] tracking-widest uppercase">
                {s.label}
              </div>
              <div className="font-display text-2xl font-bold">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search exercises…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-border/60 bg-secondary/40 h-10 pl-9 text-sm"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Muscle group filter chips */}
          <div className="mt-2 flex flex-wrap gap-1.5 sm:mt-0">
            <button
              type="button"
              onClick={() => setMuscleFilter('')}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                !muscleFilter
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border/60 bg-secondary/40 text-muted-foreground hover:border-primary/50'
              )}
            >
              All
            </button>
            {muscleGroups.map((mg) => (
              <button
                key={mg}
                type="button"
                onClick={() => setMuscleFilter(mg === muscleFilter ? '' : mg)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                  muscleFilter === mg
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border/60 bg-secondary/40 text-muted-foreground hover:border-primary/50'
                )}
              >
                {mg}
              </button>
            ))}
          </div>
        </div>

        {/* Results count when filtering */}
        {(search || muscleFilter) && !isLoading && (
          <p className="text-muted-foreground font-mono text-sm">
            {filtered.length} session{filtered.length !== 1 ? 's' : ''} found
          </p>
        )}

        {/* Workout list */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <div className="space-y-2 pl-1">
                  <Skeleton className="h-20 w-full rounded-xl" />
                  <Skeleton className="h-20 w-full rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : grouped.size === 0 ? (
          <div className="space-y-3 py-20 text-center">
            <Dumbbell className="text-muted-foreground/40 mx-auto h-10 w-10" />
            <p className="text-muted-foreground text-sm">
              {search || muscleFilter
                ? 'No sessions match your filter.'
                : 'No workouts logged yet.'}
            </p>
            {(search || muscleFilter) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setMuscleFilter('');
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {Array.from(grouped.entries()).map(
              ([groupDate, workoutsOnDate]) => (
                <div key={groupDate}>
                  {/* Date header */}
                  <div className="bg-background/90 sticky top-14 z-20 mb-3 flex items-center gap-2 py-1.5 backdrop-blur-sm">
                    <CalendarDays className="text-primary h-3.5 w-3.5 shrink-0" />
                    <span className="text-primary font-mono text-[11px] font-semibold tracking-wider uppercase">
                      {formatDateLabel(groupDate)}
                    </span>
                    <div className="bg-border/50 h-px flex-1" />
                    <span className="text-muted-foreground shrink-0 font-mono text-[10px]">
                      {workoutsOnDate.length} exercise
                      {workoutsOnDate.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Workouts for this date */}
                  <div className="space-y-2">
                    {workoutsOnDate.map((w) => {
                      const ex = exMap[w.exerciseId];
                      const wIsCardio = ex
                        ? WorkoutUtil.isCardioGroup(ex.muscleGroup)
                        : false;
                      const top = entryTopWeight(w);
                      const vol = entryVolume(w);
                      const dur = entryTotalDuration(w);
                      const dist = entryTotalDistance(w);

                      return (
                        <div
                          key={w.id}
                          className="border-border/60 bg-secondary/30 hover:border-border/80 rounded-xl border p-4 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex min-w-0 flex-wrap items-center gap-2">
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
                              <div className="text-muted-foreground mt-0.5 text-xs">
                                {w.sets.length} {wIsCardio ? 'interval' : 'set'}
                                {w.sets.length !== 1 ? 's' : ''}
                              </div>
                            </div>

                            <div className="flex shrink-0 gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-muted-foreground hover:text-destructive h-8 w-8"
                                onClick={() => setDeleteTarget(w)}
                                aria-label="Delete workout"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>

                          {/* Set / interval chips */}
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {w.sets.map((s, i) => (
                              <span
                                key={s.id}
                                className="border-border/60 bg-background/60 rounded-md border px-2 py-0.5 font-mono text-xs"
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
                            <div className="border-border/40 text-muted-foreground mt-3 flex gap-4 border-t pt-2.5 font-mono text-[11px]">
                              <span>
                                DUR{' '}
                                <span className="text-foreground font-semibold">
                                  {dur}min
                                </span>
                              </span>
                              {dist > 0 && (
                                <span>
                                  DIST{' '}
                                  <span className="text-foreground font-semibold">
                                    {dist}km
                                  </span>
                                </span>
                              )}
                              {dist > 0 && (
                                <span>
                                  PACE{' '}
                                  <span className="text-foreground font-semibold">
                                    {WorkoutUtil.formatPace(dur, dist)}
                                  </span>
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="border-border/40 text-muted-foreground mt-3 flex gap-4 border-t pt-2.5 font-mono text-[11px]">
                              <span>
                                TOP{' '}
                                <span className="text-foreground font-semibold">
                                  {top}kg
                                </span>
                              </span>
                              <span>
                                VOL{' '}
                                <span className="text-foreground font-semibold">
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
              )
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="w-[calc(100%-2rem)] rounded-lg sm:w-full sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this session?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-1">
                <p>
                  <span className="text-foreground font-semibold">
                    {deleteTargetEx?.name ?? 'This session'}
                  </span>{' '}
                  on{' '}
                  <span className="text-foreground font-semibold">
                    {deleteTarget ? formatDateLabel(deleteTarget.date) : ''}
                  </span>{' '}
                  will be permanently deleted.
                </p>
                {deleteTarget && deleteTarget.sets.length > 0 && (
                  <p className="text-muted-foreground font-mono text-xs">
                    {deleteTarget.sets.length}{' '}
                    {deleteTargetIsCardio ? 'interval' : 'set'}
                    {deleteTarget.sets.length !== 1 ? 's' : ''} ·{' '}
                    {deleteTargetIsCardio
                      ? `${entryTotalDuration(deleteTarget)}min · ${entryTotalDistance(deleteTarget)}km`
                      : `${entryTopWeight(deleteTarget)}kg top · ${entryVolume(deleteTarget).toLocaleString()}kg vol`}
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
