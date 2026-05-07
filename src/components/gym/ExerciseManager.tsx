import { useState } from 'react';
import { Plus, Trash2, Dumbbell, Pencil } from 'lucide-react';
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
import {
  MUSCLE_GROUPS,
  type Exercise,
  type MuscleGroup,
} from '@/lib/gym-types';
import { toast } from 'sonner';
import { Skeleton } from '../ui/skeleton';

export function ExerciseManager() {
  const { exercises, addExercise, removeExercise, updateExercise, isLoading } =
    useExercises();
  const { workouts, removeWorkout } = useWorkouts();
  const [open, setOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [name, setName] = useState('');
  const [group, setGroup] = useState<MuscleGroup>('Chest');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setEditingExercise(null);
    setName('');
    setGroup('Chest');
    setNotes('');
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) resetForm();
  };

  const handleNew = () => {
    resetForm();
    setOpen(true);
  };

  const handleEdit = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setName(exercise.name);
    setGroup(exercise.muscleGroup);
    setNotes(exercise.notes ?? '');
    setOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return toast.error('Exercise name is required');

    const payload = {
      name: name.trim(),
      muscleGroup: group,
      notes: notes.trim() || undefined,
    };

    if (editingExercise) {
      await updateExercise(editingExercise.id, payload);
      toast.success(`"${payload.name}" updated`);
    } else {
      await addExercise(payload);
      toast.success(`"${payload.name}" added`);
    }

    setOpen(false);
    resetForm();
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
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button
              className="gap-2 font-semibold w-full sm:w-auto"
              onClick={handleNew}
            >
              <Plus className="h-4 w-4" /> New Exercise
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg rounded-xl">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingExercise ? 'Edit Exercise' : 'Add Exercise'}
              </DialogTitle>
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
              <Button onClick={handleSave} className="font-semibold">
                {editingExercise ? 'Update' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4 surface border-border/60 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-full" />
              <div className="pt-3 border-t border-border/60">
                <Skeleton className="h-3 w-16" />
              </div>
            </Card>
          ))}
        </div>
      ) : exercises.length === 0 ? (
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
                  <div className="flex shrink-0 items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => handleEdit(ex)}
                      aria-label={`Edit ${ex.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(ex.id, ex.name)}
                      aria-label={`Delete ${ex.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
