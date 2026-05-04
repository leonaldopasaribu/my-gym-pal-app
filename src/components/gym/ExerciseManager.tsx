import { useState } from 'react';
import { Plus, Trash2, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useExercises, useWorkouts } from '@/lib/gym-store';
import { MUSCLE_GROUPS, type MuscleGroup } from '@/lib/gym-types';
import { toast } from 'sonner';

export function ExerciseManager() {
  const { exercises, addExercise, removeExercise } = useExercises();
  const { workouts, removeWorkout } = useWorkouts();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [group, setGroup] = useState<MuscleGroup>('Chest');
  const [notes, setNotes] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return toast.error('Exercise name is required');
    addExercise({
      name: name.trim(),
      muscleGroup: group,
      notes: notes.trim() || undefined,
    });
    toast.success(`"${name}" added`);
    setName('');
    setNotes('');
    setOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    // also drop workouts of this exercise
    workouts
      .filter((w) => w.exerciseId === id)
      .forEach((w) => removeWorkout(w.id));
    removeExercise(id);
    toast.success(`"${name}" deleted`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">Exercise Library</h2>
          <p className="text-sm text-muted-foreground">
            Build your own custom list of movements.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 font-semibold w-full sm:w-auto">
              <Plus className="h-4 w-4" /> New Exercise
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg rounded-xl">
            <DialogHeader>
              <DialogTitle className="font-display">Add Exercise</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="ex-name">Exercise name</Label>
                <Input
                  id="ex-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Incline Dumbbell Press"
                />
              </div>
              <div className="space-y-2">
                <Label>Primary muscle</Label>
                <Select
                  value={group}
                  onValueChange={(v) => setGroup(v as MuscleGroup)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MUSCLE_GROUPS.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ex-notes">Notes (optional)</Label>
                <Input
                  id="ex-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Form cues, grip, etc."
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAdd} className="font-semibold">
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {exercises.length === 0 ? (
        <Card className="p-10 text-center surface">
          <Dumbbell className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            No exercises yet. Add your first one!
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
          {exercises.map((ex) => {
            const count = workouts.filter((w) => w.exerciseId === ex.id).length;
            return (
              <Card
                key={ex.id}
                className="p-4 surface border-border/60 hover:border-primary/40 transition-colors group animate-fade-up"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-lg leading-tight truncate">
                      {ex.name}
                    </h3>
                    <Badge
                      variant="secondary"
                      className="mt-1.5 text-[10px] uppercase tracking-widest"
                    >
                      {ex.muscleGroup}
                    </Badge>
                    {ex.notes && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {ex.notes}
                      </p>
                    )}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(ex.id, ex.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-mono">
                    {count} session{count !== 1 ? 's' : ''}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
