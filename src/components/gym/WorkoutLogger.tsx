import { useMemo, useState } from 'react';
import { Plus, Trash2, X, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useExercises,
  useWorkouts,
  entryTopWeight,
  entryVolume,
} from '@/lib/gym-store';
import type { WorkoutSet } from '@/lib/gym-types';
import { toast } from 'sonner';

function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export function WorkoutLogger() {
  const { exercises } = useExercises();
  const { workouts, addWorkout, removeWorkout } = useWorkouts();

  const [exerciseId, setExerciseId] = useState<string>('');
  const [date, setDate] = useState(todayISO());
  const [sets, setSets] = useState<WorkoutSet[]>([
    { id: crypto.randomUUID(), reps: 8, weight: 20 },
  ]);

  const exMap = useMemo(
    () => Object.fromEntries(exercises.map((e) => [e.id, e])),
    [exercises]
  );

  const updateSet = (id: string, patch: Partial<WorkoutSet>) =>
    setSets((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const addSet = () => {
    const last = sets[sets.length - 1];
    setSets([
      ...sets,
      {
        id: crypto.randomUUID(),
        reps: last?.reps ?? 8,
        weight: last?.weight ?? 20,
      },
    ]);
  };

  const removeSet = (id: string) =>
    setSets((prev) =>
      prev.length > 1 ? prev.filter((s) => s.id !== id) : prev
    );

  const save = () => {
    if (!exerciseId) return toast.error('Pilih latihan dulu');
    if (sets.some((s) => s.reps <= 0)) return toast.error('Reps harus > 0');
    addWorkout({ exerciseId, date, sets, note: undefined });
    toast.success('Workout tercatat 💪');
    setSets([{ id: crypto.randomUUID(), reps: 8, weight: 20 }]);
  };

  const recent = workouts.slice(0, 8);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr,1fr]">
      <Card className="p-4 sm:p-5 surface border-border/60">
        <h2 className="font-display text-2xl font-bold">Log Workout</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Catat sets, reps & beban (kg).
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-[2fr,1fr] gap-3">
            <div className="space-y-2">
              <Label>Latihan</Label>
              <Select value={exerciseId} onValueChange={setExerciseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih latihan..." />
                </SelectTrigger>
                <SelectContent>
                  {exercises.length === 0 && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      Buat latihan dulu di tab Library
                    </div>
                  )}
                  {exercises.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name} ·{' '}
                      <span className="text-muted-foreground">
                        {e.muscleGroup}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tanggal</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Sets</Label>
              <Button
                size="sm"
                variant="ghost"
                onClick={addSet}
                className="h-7 gap-1 text-primary hover:text-primary"
              >
                <Plus className="h-3.5 w-3.5" /> Set
              </Button>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-[2rem,1fr,1fr,2rem] gap-2 items-center text-[10px] uppercase tracking-widest text-muted-foreground px-1">
                <span>#</span>
                <span>Reps</span>
                <span>Kg</span>
                <span></span>
              </div>
              {sets.map((s, idx) => (
                <div
                  key={s.id}
                  className="grid grid-cols-[2rem,1fr,1fr,2rem] gap-2 items-center"
                >
                  <span className="text-sm font-mono text-muted-foreground">
                    {idx + 1}
                  </span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={s.reps}
                    onChange={(e) =>
                      updateSet(s.id, { reps: Number(e.target.value) || 0 })
                    }
                  />
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.5"
                    value={s.weight}
                    onChange={(e) =>
                      updateSet(s.id, { weight: Number(e.target.value) || 0 })
                    }
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeSet(s.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={save} className="w-full font-semibold glow-primary">
            Simpan Workout
          </Button>
        </div>
      </Card>

      <Card className="p-4 sm:p-5 surface border-border/60">
        <div className="flex items-center gap-2 mb-1">
          <CalendarDays className="h-4 w-4 text-primary" />
          <h2 className="font-display text-2xl font-bold">Recent</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Sesi terakhir kamu.
        </p>

        {recent.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground">
            Belum ada catatan workout.
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
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">
                        {w.date}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => removeWorkout(w.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
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
