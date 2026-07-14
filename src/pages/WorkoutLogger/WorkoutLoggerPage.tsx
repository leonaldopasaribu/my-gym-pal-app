import { v4 as uuidv4 } from 'uuid';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, X, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
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
  useLastSession,
  entryTopWeight,
  entryVolume,
} from '@/lib/gym-store';
import type { WorkoutEntry, WorkoutSet } from '@/lib/gym-types';
import { toast } from 'sonner';
import { cn, Utils } from '@/lib/utils';
import { Loading } from '@/components/ui/loading';
import { WorkoutUtil } from '../../lib/workout-util';
import { DatePicker } from '@/components/Datepicker';
import { LastSessionCard } from './components/LastSessionCard';
import { ExercisePicker } from './components/ExercisePicker';
import RecentSessionCard from './components/RecentSessionCard';

// ─── Main WorkoutLogger ───────────────────────────────────────────────────────

export function WorkoutLoggerPage() {
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
  } = useWorkouts({ limit: 10 });

  const [exerciseId, setExerciseId] = useState<string>('');
  const [date, setDate] = useState(Utils.shiftDays(0));
  const [sets, setSets] = useState<WorkoutSet[]>([Utils.defaultStrengthSet()]);
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WorkoutEntry | null>(null);
  const [isSavingWorkout, setIsSavingWorkout] = useState(false);
  const [isDeletingWorkout, setIsDeletingWorkout] = useState(false);

  const exMap = useMemo(
    () => Object.fromEntries(exercises.map((e) => [e.id, e])),
    [exercises]
  );

  const selectedEx = exerciseId ? exMap[exerciseId] : null;
  const isCardio = selectedEx
    ? WorkoutUtil.isCardioGroup(selectedEx.muscleGroup)
    : false;

  // Reset sets when exercise type changes (strength ↔ cardio)
  const prevIsCardioRef = useRef(isCardio);
  useEffect(() => {
    if (prevIsCardioRef.current !== isCardio && !editingWorkoutId) {
      setSets([
        isCardio ? Utils.defaultCardioSet() : Utils.defaultStrengthSet(),
      ]);
      prevIsCardioRef.current = isCardio;
    }
  }, [isCardio, editingWorkoutId]);

  const { lastSession } = useLastSession(exerciseId || null);

  const updateSet = (id: string, patch: Partial<WorkoutSet>) =>
    setSets((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const addSet = () => {
    const last = sets[sets.length - 1];
    if (isCardio) {
      setSets([...sets, Utils.defaultCardioSet(last)]);
    } else {
      setSets([
        ...sets,
        { id: uuidv4(), reps: last?.reps ?? 8, weight: last?.weight ?? 20 },
      ]);
    }
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
    setSets([isCardio ? Utils.defaultCardioSet() : Utils.defaultStrengthSet()]);
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
    setDate(Utils.shiftDays(0));
  };

  const save = async () => {
    if (isSavingWorkout) return;
    if (!exerciseId) return toast.error('Pick an exercise first');
    if (isCardio) {
      if (sets.some((s) => !s.durationMinutes || s.durationMinutes <= 0))
        return toast.error('Duration must be > 0');
    } else {
      if (sets.some((s) => s.reps <= 0)) return toast.error('Reps must be > 0');
    }

    const duplicate = workouts.some(
      (w) =>
        w.exerciseId === exerciseId &&
        w.date === date &&
        w.id !== editingWorkoutId
    );
    if (duplicate) {
      const exName = exMap[exerciseId]?.name ?? 'This exercise';
      return toast.error(
        <>
          {exName} already logged on
          <br />
          {formatDateID(date)}
        </>,
        { description: 'Edit the existing entry or pick a different date.' }
      );
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

  const recent = workouts;

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
            : isCardio
              ? 'Track duration, distance & speed.'
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
              <LastSessionCard
                lastSession={lastSession}
                isCardio={isCardio}
                onCopy={prefillFromLast}
              />
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
              />
            </div>

            {/* Sets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{isCardio ? 'Intervals' : 'Sets'}</Label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={addSet}
                  className="text-primary active:bg-primary/20 h-8 cursor-pointer gap-1 transition-all duration-150 hover:text-black active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                  {isCardio ? 'Add Interval' : 'Add Set'}
                </Button>
              </div>

              <div className="space-y-2">
                {sets.map((s, idx) => (
                  <CardioOrStrengthSet
                    key={s.id}
                    set={s}
                    idx={idx}
                    isCardio={isCardio}
                    isMobile={isMobile}
                    canRemove={sets.length > 1}
                    onRemove={() => removeSet(s.id)}
                    onUpdate={(patch) => updateSet(s.id, patch)}
                  />
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
                  label={'Saving...'}
                  className="flex-row gap-2"
                />
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {editingWorkoutId ? 'Save Changes' : 'Save Workout'}
                </span>
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
        <RecentSessionCard
          isLoading={isLoadingWorkouts}
          recent={recent}
          exMap={exMap}
          onEdit={startEditWorkout}
          onDeleteRequest={setDeleteTarget}
        />
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
                    {entryTopWeight(deleteTarget)}
                    {deleteTargetEx &&
                    WorkoutUtil.isCardioGroup(deleteTargetEx.muscleGroup)
                      ? 'km top'
                      : 'kg top'}{' '}
                    · {entryVolume(deleteTarget).toLocaleString()}
                    {deleteTargetEx &&
                    WorkoutUtil.isCardioGroup(deleteTargetEx.muscleGroup)
                      ? 'min total'
                      : 'kg vol'}
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

// ─── CardioOrStrengthSet ──────────────────────────────────────────────────────

function CardioOrStrengthSet({
  set: s,
  idx,
  isCardio,
  isMobile,
  canRemove,
  onRemove,
  onUpdate,
}: {
  set: WorkoutSet;
  idx: number;
  isCardio: boolean;
  isMobile: boolean;
  canRemove: boolean;
  onRemove: () => void;
  onUpdate: (patch: Partial<WorkoutSet>) => void;
}) {
  return (
    <div className="border-border/60 bg-secondary/40 rounded-lg border p-3 sm:p-4">
      {/* Set header */}
      <div className="mb-1 flex items-center justify-between">
        <span className="text-muted-foreground font-mono text-xs tracking-wider uppercase">
          {isCardio ? `Interval ${idx + 1}` : `Set ${idx + 1}`}
        </span>
        {canRemove && (
          <Button
            size="icon"
            variant="ghost"
            className="text-muted-foreground hover:text-destructive h-7 w-7 cursor-pointer transition-all duration-150 active:scale-95"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Strength fields */}
      {!isCardio &&
        (isMobile ? (
          <div className="divide-border/40 divide-y">
            <RowStepper
              label="Reps"
              value={s.reps}
              step={1}
              min={0}
              onChange={(v) => onUpdate({ reps: v })}
            />
            <RowStepper
              label="Weight (kg)"
              value={s.weight}
              step={1}
              min={0}
              decimal
              onChange={(v) => onUpdate({ weight: v })}
            />
          </div>
        ) : (
          <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-5">
            <Stepper
              label="Reps"
              value={s.reps}
              step={1}
              min={0}
              onChange={(v) => onUpdate({ reps: v })}
            />
            <Stepper
              label="Kg"
              value={s.weight}
              step={1}
              min={0}
              decimal
              onChange={(v) => onUpdate({ weight: v })}
            />
          </div>
        ))}

      {/* Cardio fields */}
      {isCardio && (
        <>
          <div className="divide-border/40 divide-y">
            <RowStepper
              label="Duration (min)"
              value={s.durationMinutes ?? 30}
              step={1}
              min={1}
              onChange={(v) => onUpdate({ durationMinutes: v })}
            />
            <RowStepper
              label="Distance (km)"
              value={s.distanceKm ?? 0}
              step={1}
              min={0}
              decimal
              onChange={(v) => onUpdate({ distanceKm: v })}
            />
            <RowStepper
              label="Speed"
              value={s.speed ?? 0}
              step={1}
              min={0}
              decimal
              onChange={(v) => onUpdate({ speed: v || undefined })}
            />
          </div>

          {/* Pace preview — only when dist & dur are filled */}
          {s.durationMinutes && s.distanceKm && s.distanceKm > 0 && (
            <div className="text-muted-foreground mt-2 font-mono text-[10px]">
              PACE{' '}
              <span className="text-primary font-bold">
                {WorkoutUtil.formatPace(s.durationMinutes, s.distanceKm)}
              </span>
            </div>
          )}
        </>
      )}
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
      <span className="text-sm font-medium">{label}</span>

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
