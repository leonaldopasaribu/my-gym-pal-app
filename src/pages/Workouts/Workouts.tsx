// src/pages/AllWorkouts.tsx
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  Search,
  Trash2,
  Pencil,
  Filter,
  X,
  Dumbbell,
  BarChart3,
} from 'lucide-react';
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
} from '@/lib/gym-store';
import type { WorkoutEntry } from '@/lib/gym-types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { AppHeader } from '@/components/gym/AppHeader';
import { ROUTE_URL } from '@/constants/route-url';

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

  // Summary stats
  const stats = useMemo(() => {
    const totalSets = workouts.reduce((a, w) => a + w.sets.length, 0);
    const totalVol = workouts.reduce((a, w) => a + entryVolume(w), 0);
    const thisWeek = workouts.filter((w) => isThisWeek(w.date)).length;
    const uniqueDays = new Set(workouts.map((w) => w.date)).size;
    return { totalSets, totalVol, thisWeek, uniqueDays };
  }, [workouts]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await removeWorkout(deleteTarget.id);
    toast.success('Session deleted');
    setDeleteTarget(null);
  };

  const deleteTargetEx = deleteTarget ? exMap[deleteTarget.exerciseId] : null;

  const isLoading = isLoadingWorkouts || isLoadingExercises;

  return (
    <div className="min-h-screen">
      <AppHeader isShowButtonBack={true} handleBack={() => navigate(ROUTE_URL.HOME)} />
        <div className='container mt-2'>
              <div>
            <h2 className="font-display text-2xl font-bold">All Workouts</h2>
            <p className="text-sm text-muted-foreground">
            {isLoading ? '—' : `${workouts.length} sessions across ${stats.uniqueDays} training days`}
            </p>
        </div>
        </div>

      <div className="container py-5 pb-24 space-y-5">
      
        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
              label: 'Total Volume',
              value: isLoading ? '—' : `${(stats.totalVol / 1000).toFixed(1)}t`,
            },
          ].map((s) => (
            <div
              key={s.label}
              className="p-4 rounded-xl border border-border/60 bg-secondary/30 space-y-1"
            >
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
                {s.label}
              </div>
              <div className="font-display text-2xl font-bold">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search exercises…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 bg-secondary/40 border-border/60 text-sm"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Muscle group filter chips */}
          <div className="mt-2 sm:mt-0 flex gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setMuscleFilter('')}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                !muscleFilter
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-secondary/40 border-border/60 hover:border-primary/50 text-muted-foreground'
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
                  'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                  muscleFilter === mg
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-secondary/40 border-border/60 hover:border-primary/50 text-muted-foreground'
                )}
              >
                {mg}
              </button>
            ))}
          </div>
        </div>

        {/* Results count when filtering */}
        {(search || muscleFilter) && !isLoading && (
          <p className="text-sm text-muted-foreground font-mono">
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
          <div className="py-20 text-center space-y-3">
            <Dumbbell className="h-10 w-10 text-muted-foreground/40 mx-auto" />
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
                  <div className="flex items-center gap-2 mb-3 sticky top-14 z-20 bg-background/90 backdrop-blur-sm py-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-primary">
                      {formatDateLabel(groupDate)}
                    </span>
                    <div className="flex-1 h-px bg-border/50" />
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                      {workoutsOnDate.length} exercise
                      {workoutsOnDate.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Workouts for this date */}
                  <div className="space-y-2">
                    {workoutsOnDate.map((w) => {
                      const ex = exMap[w.exerciseId];
                      const top = entryTopWeight(w);
                      const vol = entryVolume(w);

                      return (
                        <div
                          key={w.id}
                          className="p-4 rounded-xl bg-secondary/30 border border-border/60 hover:border-border/80 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                                <span className="font-display font-bold truncate">
                                  {ex?.name ?? '—'}
                                </span>
                                {ex && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] shrink-0"
                                  >
                                    {ex.muscleGroup}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {w.sets.length} set
                                {w.sets.length !== 1 ? 's' : ''}
                              </div>
                            </div>

                            <div className="flex shrink-0 gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => setDeleteTarget(w)}
                                aria-label="Delete workout"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>

                          {/* Set chips */}
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {w.sets.map((s, i) => (
                              <span
                                key={s.id}
                                className="text-xs font-mono px-2 py-0.5 rounded-md bg-background/60 border border-border/60"
                              >
                                {i + 1}: {s.reps}×{s.weight}kg
                              </span>
                            ))}
                          </div>

                          {/* Stats row */}
                          <div className="mt-3 flex gap-4 text-[11px] text-muted-foreground font-mono border-t border-border/40 pt-2.5">
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
        <AlertDialogContent className="w-[calc(100%-2rem)] sm:w-full sm:max-w-md rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this session?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-1">
                <p>
                  <span className="font-semibold text-foreground">
                    {deleteTargetEx?.name ?? 'This session'}
                  </span>{' '}
                  on{' '}
                  <span className="font-semibold text-foreground">
                    {deleteTarget ? formatDateLabel(deleteTarget.date) : ''}
                  </span>{' '}
                  will be permanently deleted.
                </p>
                {deleteTarget && deleteTarget.sets.length > 0 && (
                  <p className="text-xs font-mono text-muted-foreground">
                    {deleteTarget.sets.length} set
                    {deleteTarget.sets.length !== 1 ? 's' : ''} ·{' '}
                    {entryTopWeight(deleteTarget)}kg top ·{' '}
                    {entryVolume(deleteTarget).toLocaleString()}kg vol
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
