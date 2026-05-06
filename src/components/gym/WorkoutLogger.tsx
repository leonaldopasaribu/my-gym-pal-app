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
import { useIsMobile } from '@/hooks/use-mobile';
import {
  useExercises,
  useWorkouts,
  entryTopWeight,
  entryVolume,
} from '@/lib/gym-store';
import type { WorkoutSet } from '@/lib/gym-types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

  // Filter & group exercises
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
    // "Recent" group first (exercises that have been used — i.e. appear in orderedExerciseIds before all)
    // We already rely on orderedExerciseIds ordering, so just group by muscleGroup
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
      <div className="text-sm text-muted-foreground p-3 rounded-md bg-secondary/40 border border-border/60">
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
            'w-full flex items-center justify-between gap-3 px-4 h-12 rounded-xl border transition-all',
            'active:scale-[0.98]',
            selectedEx
              ? 'bg-primary/10 border-primary/40 text-foreground hover:border-primary/60'
              : 'bg-secondary/40 border-border/60 text-muted-foreground hover:border-primary/40'
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Dumbbell
              className={cn(
                'h-4 w-4 shrink-0',
                selectedEx ? 'text-primary' : 'text-muted-foreground'
              )}
            />
            <span className="text-sm font-medium truncate">
              {selectedEx ? selectedEx.name : 'Select exercise…'}
            </span>
            {selectedEx && (
              <Badge variant="outline" className="text-[10px] shrink-0">
                {selectedEx.muscleGroup}
              </Badge>
            )}
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </DrawerTrigger>

      <DrawerContent className="max-h-[82dvh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-lg font-display font-bold">
            Select Exercise
          </DrawerTitle>
        </DrawerHeader>

        {/* List */}
        <div className="overflow-y-auto px-4 pb-4 space-y-4 flex-1">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              No exercises found.
            </div>
          ) : (
            Array.from(grouped.entries()).map(([group, exList]) => (
              <div key={group}>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-1.5 px-1">
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
                          'w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all active:scale-[0.98]',
                          isActive
                            ? 'bg-primary/15 border-primary/50 text-foreground'
                            : 'bg-secondary/40 border-border/60 hover:border-primary/40 hover:bg-primary/5'
                        )}
                      >
                        <span className="text-sm font-medium">{ex.name}</span>
                        {isActive && (
                          <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
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
  const { exercises } = useExercises();
  const { workouts, addWorkout, removeWorkout, updateWorkout } = useWorkouts();

  const [exerciseId, setExerciseId] = useState<string>('');
  const [date, setDate] = useState(todayISO());
  const [sets, setSets] = useState<WorkoutSet[]>([
    { id: uuidv4(), reps: 8, weight: 20 },
  ]);
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);

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
  };

  const recent = workouts.slice(0, 8);

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

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div>
        <h2 className="font-display text-2xl font-bold">Log Workout</h2>
        <p className="text-sm text-muted-foreground">
          {editingWorkoutId
            ? 'Edit the selected recent session.'
            : 'Track sets, reps & weight (kg).'}
        </p>
      </div>
      <Card ref={formRef} className="p-4 sm:p-5 surface border-border/60">
        <div className="space-y-5">
          {/* Exercise Picker — now a bottom sheet */}
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
            <div className="p-4 rounded-xl bg-secondary/40 border border-border/60 animate-fade-up">
              {/* Header: Label & Date */}
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-3.5 w-3.5 text-primary fill-primary/20" />
                <div className="min-w-0">
                  <span className="font-display font-bold text-sm  tracking-tight block leading-none">
                    Last Session
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono leading-none">
                    {formatDateID(lastSession.date)}
                  </span>
                </div>
              </div>

              {/* Sets Display */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {lastSession.sets.map((s, i) => (
                  <span
                    key={s.id}
                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-background/60 border border-border/60"
                  >
                    {i + 1}: {s.reps}×{s.weight}kg
                  </span>
                ))}
              </div>

              {/* Footer: Stats & Action Button */}
              <div className="pt-3 border-t border-border/40 space-y-3">
                <div className="flex gap-4 text-[10px] text-muted-foreground font-mono">
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
                  className="w-full h-9 gap-2 text-xs font-bold  bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border-none transition-all active:scale-[0.98]"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy Last Session
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground text-white">
              Date
            </Label>
            <DatePicker
              value={date}
              onChange={setDate}
              isMobile={isMobile}
              open={dateOpen}
              setOpen={setDateOpen}
              formatDateID={formatDateID}
            />
          </div>

          {/* Sets with steppers */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Sets</Label>
              <Button
                size="sm"
                variant="ghost"
                onClick={addSet}
                className="h-8 gap-1 text-primary hover:text-primary"
              >
                <Plus className="h-4 w-4" /> Add Set
              </Button>
            </div>

            <div className="space-y-2">
              {sets.map((s, idx) => (
                <div
                  key={s.id}
                  className="p-3 rounded-lg bg-secondary/40 border border-border/60"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                      Set {idx + 1}
                    </span>
                    {sets.length > 1 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => removeSet(s.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
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
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={save}
            size="lg"
            className="w-full font-semibold glow-primary text-base"
          >
            {editingWorkoutId ? 'Update Workout' : 'Save Workout'}
          </Button>
          {editingWorkoutId && (
            <Button
              type="button"
              onClick={cancelEdit}
              size="lg"
              variant="outline"
              className="w-full font-semibold text-base"
            >
              Cancel
            </Button>
          )}
        </div>
      </Card>

      <Card className="p-4 sm:p-5 surface border-border/60">
        <div className="flex items-center gap-2 mb-1">
          <CalendarDays className="h-4 w-4 text-primary" />
          <h2 className="font-display text-2xl font-bold">Recent</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Your latest sessions.
        </p>

        {recent.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground">
            No workouts logged yet.
          </div>
        ) : (
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {recent.map((w) => {
              const ex = exMap[w.exerciseId];
              const top = entryTopWeight(w);
              const vol = entryVolume(w);
              return (
                <div
                  key={w.id}
                  className="p-3 rounded-lg bg-secondary/40 border border-border/60 animate-fade-up"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold truncate">
                          {ex?.name ?? '—'}
                        </span>
                        {ex && (
                          <Badge variant="outline" className="text-[10px]">
                            {ex.muscleGroup}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 capitalize">
                        {formatDateID(w.date)}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        onClick={() => startEditWorkout(w.id)}
                        aria-label="Edit workout"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={async () => {
                          await removeWorkout(w.id);
                          if (editingWorkoutId === w.id) cancelEdit();
                        }}
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
                        className="text-xs font-mono px-2 py-0.5 rounded bg-background/60 border border-border/60"
                      >
                        {i + 1}: {s.reps}×{s.weight}kg
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-4 text-[11px] text-muted-foreground font-mono">
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
        )}
      </Card>
    </div>
  );
}

// ─── Stepper ─────────────────────────────────────────────────────────────────

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
    <div className="space-y-1">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground px-1">
        {label}
      </div>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={dec}
          className="h-11 w-11 shrink-0 border-border/60 hover:bg-primary/15 hover:border-primary/50 hover:text-primary"
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
          className="h-11 text-center font-mono text-lg font-semibold px-1"
        />
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={inc}
          className="h-11 w-11 shrink-0 border-border/60 hover:bg-primary/15 hover:border-primary/50 hover:text-primary"
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
      className="w-full h-12 justify-start gap-2 font-normal text-left bg-secondary/40 border-border/60 text-muted-foreground hover:border-primary/40"
    >
      <CalendarIcon className="h-4 w-4 text-primary shrink-0" />
      <span className="capitalize truncate">{formatDateID(value)}</span>
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
      initialFocus
      className={cn('p-3 pointer-events-auto')}
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
            'px-3 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-95',
            value === p.iso
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-secondary/40 border-border/60 hover:border-primary/50'
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
