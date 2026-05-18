import { v4 as uuidv4 } from 'uuid';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus,
  Trash2,
  X,
  CalendarDays,
  Pencil,
  Minus,
  Copy,
  Zap,
  Calendar as CalendarIcon,
  ChevronRight,
  Search,
  Dumbbell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
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
import { useIsMobile } from '@/hooks/use-mobile';
import {
  useExercises,
  useWorkouts,
  entryTopWeight,
  entryVolume,
} from '@/lib/gym-store';
import type { WorkoutEntry, WorkoutSet } from '@/lib/gym-types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { ROUTE_URL } from '@/constants/route-url';
import { Loading } from '@/components/ui/loading';

function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function isoToDate(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return isNaN(d.getTime()) ? new Date() : d;
}
function dateToISO(d: Date) {
  const x = new Date(d);
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
  return x.toISOString().slice(0, 10);
}
function shiftDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return dateToISO(d);
}

// ─── Exercise Picker Bottom Sheet ────────────────────────────────────────────

function ExercisePicker({
  exerciseId,
  setExerciseId,
  exercises,
  orderedExerciseIds,
  exMap,
}: {
  exerciseId: string;
  setExerciseId: (id: string) => void;
  exercises: ReturnType<typeof useExercises>['exercises'];
  orderedExerciseIds: string[];
  exMap: Record<string, (typeof exercises)[number]>;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedEx = exerciseId ? exMap[exerciseId] : null;

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return orderedExerciseIds
      .map((id) => exMap[id])
      .filter(Boolean)
      .filter(
        (ex) =>
          !q ||
          ex.name.toLowerCase().includes(q) ||
          ex.muscleGroup.toLowerCase().includes(q)
      );
  }, [search, orderedExerciseIds, exMap]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const ex of filtered) {
      if (!map.has(ex.muscleGroup)) map.set(ex.muscleGroup, []);
      map.get(ex.muscleGroup)!.push(ex);
    }
    return map;
  }, [filtered]);

  const handleSelect = (id: string) => {
    setExerciseId(id);
    setOpen(false);
    setSearch('');
  };

  if (exercises.length === 0) {
    return (
      <div className="border-border/60 bg-secondary/40 text-muted-foreground rounded-md border p-3 text-sm">
        Create an exercise first in the Library tab.
      </div>
    );
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setSearch('');
      }}
    >
      <DrawerTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-12 w-full items-center justify-between gap-3 overflow-hidden rounded-xl border px-4 transition-all',
            'active:scale-[0.98]',
            selectedEx
              ? 'border-primary/40 bg-primary/10 text-foreground hover:border-primary/60'
              : 'border-border/60 bg-secondary/40 text-muted-foreground hover:border-primary/40'
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Dumbbell
              className={cn(
                'h-4 w-4 shrink-0',
                selectedEx ? 'text-primary' : 'text-muted-foreground'
              )}
            />
            <span className="truncate text-sm font-medium">
              {selectedEx ? selectedEx.name : 'Select exercise…'}
            </span>
            {selectedEx && (
              <Badge variant="outline" className="shrink-0 text-[10px]">
                {selectedEx.muscleGroup}
              </Badge>
            )}
          </div>
          <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
        </button>
      </DrawerTrigger>

      <DrawerContent className="max-h-[82dvh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="font-display text-lg font-bold">
            Select Exercise
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search exercises…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-border/60 bg-secondary/40 h-10 pl-9"
              autoFocus={false}
            />
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
          {filtered.length === 0 ? (
            <div className="text-muted-foreground py-10 text-center text-sm">
              No exercises found.
            </div>
          ) : (
            Array.from(grouped.entries()).map(([group, exList]) => (
              <div key={group}>
                <div className="text-muted-foreground mb-1.5 px-1 font-mono text-[10px] tracking-widest uppercase">
                  {group}
                </div>
                <div className="space-y-1.5">
                  {exList.map((ex) => {
                    const isActive = exerciseId === ex.id;
                    return (
                      <button
                        key={ex.id}
                        type="button"
                        onClick={() => handleSelect(ex.id)}
                        className={cn(
                          'flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-all active:scale-[0.98]',
                          isActive
                            ? 'border-primary/50 bg-primary/15 text-foreground'
                            : 'border-border/60 bg-secondary/40 hover:border-primary/40 hover:bg-primary/5'
                        )}
                      >
                        <span className="text-sm font-medium">{ex.name}</span>
                        {isActive && (
                          <div className="bg-primary h-2 w-2 shrink-0 rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

// ─── Main WorkoutLogger ───────────────────────────────────────────────────────

export function WorkoutLogger() {
  const isMobile = useIsMobile();
  const formRef = useRef<HTMLDivElement>(null);
  const [dateOpen, setDateOpen] = useState(false);
  const { exercises, isLoading: isLoadingExercises } = useExercises();
  const {
    workouts,
    addWorkout,
    removeWorkout,
    updateWorkout,
    isLoading: isLoadingWorkouts,
  } = useWorkouts();

  const [exerciseId, setExerciseId] = useState<string>('');
  const [date, setDate] = useState(todayISO());
  const [sets, setSets] = useState<WorkoutSet[]>([
    { id: uuidv4(), reps: 8, weight: 20 },
  ]);
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WorkoutEntry | null>(null);
  const [isSavingWorkout, setIsSavingWorkout] = useState(false);
  const [isDeletingWorkout, setIsDeletingWorkout] = useState(false);

  const navigate = useNavigate();

  const exMap = useMemo(
    () => Object.fromEntries(exercises.map((e) => [e.id, e])),
    [exercises]
  );

  const lastSession = useMemo(() => {
    if (!exerciseId) return null;
    return workouts.find((w) => w.exerciseId === exerciseId) ?? null;
  }, [exerciseId, workouts]);

  const updateSet = (id: string, patch: Partial<WorkoutSet>) =>
    setSets((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const addSet = () => {
    const last = sets[sets.length - 1];
    setSets([
      ...sets,
      { id: uuidv4(), reps: last?.reps ?? 8, weight: last?.weight ?? 20 },
    ]);
  };

  const removeSet = (id: string) =>
    setSets((prev) =>
      prev.length > 1 ? prev.filter((s) => s.id !== id) : prev
    );

  const prefillFromLast = () => {
    if (!lastSession) return;
    setSets(lastSession.sets.map((s) => ({ ...s, id: uuidv4() })));
    toast.success('Sets copied from last session');
  };

  const resetForm = () => {
    setSets([{ id: uuidv4(), reps: 8, weight: 20 }]);
    setEditingWorkoutId(null);
  };

  const startEditWorkout = (workoutId: string) => {
    const workout = workouts.find((w) => w.id === workoutId);
    if (!workout) return;
    setEditingWorkoutId(workout.id);
    setExerciseId(workout.exerciseId);
    setDate(workout.date);
    setSets(workout.sets.map((s) => ({ ...s })));
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const cancelEdit = () => {
    resetForm();
    setDate(todayISO());
  };

  const save = async () => {
    if (isSavingWorkout) return;
    if (!exerciseId) return toast.error('Pick an exercise first');
    if (sets.some((s) => s.reps <= 0)) return toast.error('Reps must be > 0');
    const duplicate = workouts.some(
      (w) =>
        w.exerciseId === exerciseId &&
        w.date === date &&
        w.id !== editingWorkoutId
    );
    if (duplicate) {
      const exName = exMap[exerciseId]?.name ?? 'This exercise';
      return toast.error(`${exName} already logged on ${date}`, {
        description: 'Edit the existing entry or pick a different date.',
      });
    }
    setIsSavingWorkout(true);
    try {
      if (editingWorkoutId) {
        await updateWorkout(editingWorkoutId, {
          exerciseId,
          date,
          sets,
          note: undefined,
        });
        toast.success('Workout updated ✅');
      } else {
        await addWorkout({ exerciseId, date, sets, note: undefined });
        toast.success('Workout saved 💪');
      }
      resetForm();
    } finally {
      setIsSavingWorkout(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || isDeletingWorkout) return;
    setIsDeletingWorkout(true);
    try {
      await removeWorkout(deleteTarget.id);
      if (editingWorkoutId === deleteTarget.id) cancelEdit();
      toast.success('Session deleted');
      setDeleteTarget(null);
    } finally {
      setIsDeletingWorkout(false);
    }
  };

  const recent = workouts.slice(0, 10);

  const orderedExerciseIds = useMemo(() => {
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const w of workouts) {
      if (!seen.has(w.exerciseId) && exMap[w.exerciseId]) {
        seen.add(w.exerciseId);
        ordered.push(w.exerciseId);
      }
    }
    for (const e of exercises) {
      if (!seen.has(e.id)) {
        seen.add(e.id);
        ordered.push(e.id);
      }
    }
    return ordered;
  }, [workouts, exMap, exercises]);

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

  const deleteTargetEx = deleteTarget ? exMap[deleteTarget.exerciseId] : null;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold">Log Workout</h2>
        <p className="text-muted-foreground text-sm">
          {editingWorkoutId
            ? 'Edit the selected recent session.'
            : 'Track sets, reps & weight (kg).'}
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* ── Log Form ── */}
        <Card
          ref={formRef}
          className="surface border-border/60 overflow-hidden p-4 sm:p-6"
        >
          <div className="space-y-5">
            {/* Exercise Picker */}
            <div className="space-y-2">
              <Label>Exercise</Label>
              <ExercisePicker
                exerciseId={exerciseId}
                setExerciseId={setExerciseId}
                exercises={exercises}
                orderedExerciseIds={orderedExerciseIds}
                exMap={exMap}
              />
            </div>

            {/* Last session hint */}
            {lastSession && (
              <div className="animate-fade-up border-border/60 bg-secondary/40 rounded-xl border p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Zap className="fill-primary/20 text-primary h-3.5 w-3.5" />
                  <div className="min-w-0">
                    <span className="font-display block text-sm leading-none font-bold tracking-tight">
                      Last Session
                    </span>
                    <span className="text-muted-foreground font-mono text-[10px] leading-none">
                      {formatDateID(lastSession.date)}
                    </span>
                  </div>
                </div>

                <div className="mb-3 flex flex-wrap gap-1.5">
                  {lastSession.sets.map((s, i) => (
                    <span
                      key={s.id}
                      className="border-border/60 bg-background/60 rounded border px-2 py-0.5 font-mono text-[11px]"
                    >
                      {i + 1}: {s.reps}×{s.weight}kg
                    </span>
                  ))}
                </div>

                <div className="border-border/40 space-y-3 border-t pt-3">
                  <div className="text-muted-foreground flex gap-4 font-mono text-[10px]">
                    <span>
                      TOP{' '}
                      <span className="text-primary font-bold">
                        {entryTopWeight(lastSession)}kg
                      </span>
                    </span>
                    <span>
                      VOL{' '}
                      <span className="text-primary font-bold">
                        {entryVolume(lastSession).toLocaleString()}kg
                      </span>
                    </span>
                  </div>

                  <Button
                    size="sm"
                    onClick={prefillFromLast}
                    className="bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground h-9 w-full gap-2 border-none text-xs font-bold transition-all active:scale-[0.98]"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy Last Session
                  </Button>
                </div>
              </div>
            )}

            {/* Date picker */}
            <div className="space-y-2">
              <Label className="text-sm text-white">Date</Label>
              <DatePicker
                value={date}
                onChange={setDate}
                isMobile={isMobile}
                open={dateOpen}
                setOpen={setDateOpen}
                formatDateID={formatDateID}
              />
            </div>

            {/* Sets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Sets</Label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={addSet}
                  className="text-primary hover:text-primary h-8 gap-1"
                >
                  <Plus className="h-4 w-4" /> Add Set
                </Button>
              </div>

              <div className="space-y-2">
                {sets.map((s, idx) => (
                  <div
                    key={s.id}
                    className="border-border/60 bg-secondary/40 rounded-lg border p-3 sm:p-4"
                  >
                    {/* Set header */}
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-muted-foreground font-mono text-xs tracking-wider uppercase">
                        Set {idx + 1}
                      </span>
                      {sets.length > 1 && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-muted-foreground hover:text-destructive h-7 w-7"
                          onClick={() => removeSet(s.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* ── Steppers: row layout on mobile, grid on tablet/desktop ── */}
                    {isMobile ? (
                      <div className="divide-border/40 divide-y">
                        <RowStepper
                          label="Reps"
                          value={s.reps}
                          step={1}
                          min={0}
                          onChange={(v) => updateSet(s.id, { reps: v })}
                        />
                        <RowStepper
                          label="Weight (kg)"
                          value={s.weight}
                          step={1}
                          min={0}
                          decimal
                          onChange={(v) => updateSet(s.id, { weight: v })}
                        />
                      </div>
                    ) : (
                      <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-5">
                        <Stepper
                          label="Reps"
                          value={s.reps}
                          step={1}
                          min={0}
                          onChange={(v) => updateSet(s.id, { reps: v })}
                        />
                        <Stepper
                          label="Kg"
                          value={s.weight}
                          step={1}
                          min={0}
                          decimal
                          onChange={(v) => updateSet(s.id, { weight: v })}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={save}
              size="lg"
              className="glow-primary w-full text-base font-semibold"
              disabled={isSavingWorkout}
            >
              {isSavingWorkout ? (
                <Loading
                  size="sm"
                  label={editingWorkoutId ? 'Updating...' : 'Saving...'}
                  className="flex-row gap-2"
                />
              ) : editingWorkoutId ? (
                'Update Workout'
              ) : (
                'Save Workout'
              )}
            </Button>
            {editingWorkoutId && (
              <Button
                type="button"
                onClick={cancelEdit}
                size="lg"
                variant="outline"
                className="w-full text-base font-semibold"
                disabled={isSavingWorkout}
              >
                Cancel
              </Button>
            )}
          </div>
        </Card>

        {/* ── Recent Sessions ── */}
        <Card className="surface border-border/60 overflow-hidden p-4 sm:p-6">
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="text-primary h-4 w-4" />
              <h2 className="font-display text-2xl font-bold">Recent</h2>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground hover:text-primary gap-1 pr-0 text-xs"
              onClick={() => navigate(ROUTE_URL.WORKOUTS)}
            >
              View all
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="text-muted-foreground mb-4 text-sm">
            Your latest 10 sessions.
          </p>

          {isLoadingWorkouts ? (
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
          ) : recent.length === 0 ? (
            <div className="text-muted-foreground py-10 text-center text-sm">
              No workouts logged yet.
            </div>
          ) : (
            <div className="max-h-120 space-y-4 overflow-y-auto pr-1 md:max-h-140 lg:max-h-160">
              {(() => {
                const grouped = new Map<string, typeof recent>();
                for (const w of recent) {
                  if (!grouped.has(w.date)) grouped.set(w.date, []);
                  grouped.get(w.date)!.push(w);
                }
                return Array.from(grouped.entries()).map(
                  ([groupDate, workoutsOnDate]) => (
                    <div key={groupDate}>
                      <div className="bg-card/80 z-10 mt-1 mb-2 flex items-center gap-2 py-1 backdrop-blur-sm">
                        <CalendarDays className="text-primary h-3.5 w-3.5 shrink-0" />
                        <span className="text-primary font-mono text-[11px] font-semibold tracking-wider uppercase">
                          {formatDateID(groupDate)}
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
                          const top = entryTopWeight(w);
                          const vol = entryVolume(w);
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
                                    {formatDateID(w.date)}
                                  </div>
                                </div>
                                <div className="flex shrink-0 gap-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="text-muted-foreground hover:text-primary h-7 w-7"
                                    onClick={() => startEditWorkout(w.id)}
                                    aria-label="Edit workout"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="text-muted-foreground hover:text-destructive h-7 w-7"
                                    onClick={() => setDeleteTarget(w)}
                                    aria-label="Delete workout"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {w.sets.map((s, i) => (
                                  <span
                                    key={s.id}
                                    className="border-border/60 bg-background/60 rounded border px-2 py-0.5 font-mono text-xs"
                                  >
                                    {i + 1}: {s.reps}×{s.weight}kg
                                  </span>
                                ))}
                              </div>
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
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )
                );
              })()}
            </div>
          )}
        </Card>
      </div>

      {/* ── Delete confirmation ── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !isDeletingWorkout) setDeleteTarget(null);
        }}
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
                    {deleteTarget ? formatDateID(deleteTarget.date) : ''}
                  </span>{' '}
                  will be permanently deleted.
                </p>
                {deleteTarget && deleteTarget.sets.length > 0 && (
                  <p className="text-muted-foreground font-mono text-xs">
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
            <AlertDialogCancel disabled={isDeletingWorkout}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeletingWorkout}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingWorkout ? (
                <Loading
                  size="sm"
                  label="Deleting..."
                  className="flex-row gap-2"
                />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Stepper (tablet / desktop) ──────────────────────────────────────────────

function Stepper({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  decimal = false,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  decimal?: boolean;
}) {
  const dec = () => onChange(Math.max(min, +(value - step).toFixed(2)));
  const inc = () => onChange(+(value + step).toFixed(2));

  const [text, setText] = useState<string>(String(value));
  useEffect(() => {
    if (Number(text) !== value) setText(String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="min-w-0 space-y-1">
      <div className="text-muted-foreground px-1 text-[10px] tracking-widest uppercase">
        {label}
      </div>
      <div className="flex min-w-0 items-center gap-1">
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={dec}
          className="border-border/60 hover:border-primary/50 hover:bg-primary/15 hover:text-primary h-11 w-11 shrink-0"
          aria-label={`Decrease ${label}`}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Input
          type="number"
          inputMode={decimal ? 'decimal' : 'numeric'}
          min={min}
          step={step}
          value={text}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const raw = e.target.value;
            setText(raw);
            if (raw === '' || raw === '-') {
              onChange(min);
              return;
            }
            const n = Number(raw);
            if (!Number.isNaN(n)) onChange(n);
          }}
          onBlur={() => setText(String(value))}
          className={cn(
            'h-11 px-1 text-center font-mono text-sm font-semibold',
            'w-full min-w-0',
            '[appearance:textfield]',
            '[&::-webkit-inner-spin-button]:appearance-none',
            '[&::-webkit-outer-spin-button]:appearance-none'
          )}
        />
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={inc}
          className="border-border/60 hover:border-primary/50 hover:bg-primary/15 hover:text-primary h-11 w-11 shrink-0"
          aria-label={`Increase ${label}`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── RowStepper (mobile only) ─────────────────────────────────────────────────

function RowStepper({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  decimal = false,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  decimal?: boolean;
}) {
  const [text, setText] = useState(String(value));

  useEffect(() => {
    if (Number(text) !== value) setText(String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const dec = () => onChange(Math.max(min, +(value - step).toFixed(2)));
  const inc = () => onChange(+(value + step).toFixed(2));

  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      {/* Label */}
      <span className="text-sm font-medium">{label}</span>

      {/* Controls */}
      <div className="border-border/60 flex shrink-0 items-center overflow-hidden rounded-xl border">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={dec}
          className="border-border/60 bg-secondary/40 hover:bg-primary/10 hover:text-primary h-11 w-11 rounded-none border-r transition-all active:scale-95"
          aria-label={`Decrease ${label}`}
        >
          <Minus className="h-4 w-4" />
        </Button>

        <Input
          type="number"
          inputMode={decimal ? 'decimal' : 'numeric'}
          min={min}
          step={step}
          value={text}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const raw = e.target.value;
            setText(raw);
            if (raw === '' || raw === '-') {
              onChange(min);
              return;
            }
            const n = Number(raw);
            if (!Number.isNaN(n)) onChange(n);
          }}
          onBlur={() => setText(String(value))}
          className={cn(
            'border-border/60 h-11 w-20 rounded-none border-0 border-r text-center font-mono text-sm font-semibold focus-visible:ring-0 focus-visible:ring-offset-0',
            '[appearance:textfield]',
            '[&::-webkit-inner-spin-button]:appearance-none',
            '[&::-webkit-outer-spin-button]:appearance-none'
          )}
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={inc}
          className="bg-secondary/40 hover:bg-primary/10 hover:text-primary h-11 w-11 rounded-none transition-all active:scale-95"
          aria-label={`Increase ${label}`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── DatePicker ───────────────────────────────────────────────────────────────

function DatePicker({
  value,
  onChange,
  isMobile,
  open,
  setOpen,
  formatDateID,
}: {
  value: string;
  onChange: (iso: string) => void;
  isMobile: boolean;
  open: boolean;
  setOpen: (o: boolean) => void;
  formatDateID: (iso: string) => string;
}) {
  const presets = [
    { label: 'Today', iso: shiftDays(0) },
    { label: 'Yesterday', iso: shiftDays(-1) },
    { label: '2 days ago', iso: shiftDays(-2) },
    { label: '3 days ago', iso: shiftDays(-3) },
  ];

  const trigger = (
    <Button
      type="button"
      variant="outline"
      className="border-border/60 bg-secondary/40 text-muted-foreground hover:border-primary/40 h-12 w-full justify-start gap-2 text-left font-normal"
    >
      <CalendarIcon className="text-primary h-4 w-4 shrink-0" />
      <span className="truncate capitalize">{formatDateID(value)}</span>
    </Button>
  );

  const calendar = (
    <Calendar
      mode="single"
      selected={isoToDate(value)}
      onSelect={(d) => {
        if (d) {
          onChange(dateToISO(d));
          setOpen(false);
        }
      }}
      disabled={(d) => d > new Date()}
      className={cn('pointer-events-auto p-3')}
    />
  );

  const presetChips = (
    <div className="flex flex-wrap gap-2 px-3 pb-3">
      {presets.map((p) => (
        <button
          key={p.label}
          type="button"
          onClick={() => {
            onChange(p.iso);
            setOpen(false);
          }}
          className={cn(
            'rounded-full border px-3 py-1.5 text-xs font-medium transition-all active:scale-95',
            value === p.iso
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border/60 bg-secondary/40 hover:border-primary/50'
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>Pick a date</DrawerTitle>
          </DrawerHeader>
          {presetChips}
          <div className="flex justify-center">{calendar}</div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        {presetChips}
        {calendar}
      </PopoverContent>
    </Popover>
  );
}
