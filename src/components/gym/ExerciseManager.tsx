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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { WorkoutUtil } from '@/lib/workout-util';
import { toast } from 'sonner';
import { Skeleton } from '../ui/skeleton';
import { Loading } from '@/components/ui/loading';

const NOTES_PLACEHOLDER: Record<string, string> = {
  Cardio: 'Target pace, indoor/outdoor, machine type, etc.',
  Chest: 'Form cues, grip width, incline angle, etc.',
  Back: 'Form cues, grip type, cable vs barbell, etc.',
  Shoulders: 'Form cues, unilateral or bilateral, etc.',
  Arms: 'Form cues, curl style, grip, etc.',
  Legs: 'Form cues, stance width, belt, etc.',
  Core: 'Tempo, breathing cues, progression, etc.',
  Other: 'Notes, tips, progressions, etc.',
};

export function ExerciseManager() {
  const { exercises, addExercise, removeExercise, updateExercise, isLoading } =
    useExercises();
  const { workouts } = useWorkouts();
  const [isOpen, setIsOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Exercise | null>(null);
  const [name, setName] = useState('');
  const [group, setGroup] = useState<MuscleGroup>('Chest');
  const [notes, setNotes] = useState('');
  const [isSavingExercise, setIsSavingExercise] = useState(false);
  const [isDeletingExercise, setIsDeletingExercise] = useState(false);

  const resetForm = () => {
    setEditingExercise(null);
    setName('');
    setGroup('Chest');
    setNotes('');
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSavingExercise) return;
    setIsOpen(nextOpen);
    if (!nextOpen) resetForm();
  };

  const handleNew = () => {
    resetForm();
    setIsOpen(true);
  };

  const handleEdit = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setName(exercise.name);
    setGroup(exercise.muscleGroup);
    setNotes(exercise.notes ?? '');
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (isSavingExercise) return;
    if (!name.trim()) return toast.error('Exercise name is required');

    const payload = {
      name: name.trim(),
      muscleGroup: group,
      notes: notes.trim() || undefined,
    };

    setIsSavingExercise(true);
    try {
      if (editingExercise) {
        await updateExercise(editingExercise.id, payload);
        toast.success(`"${payload.name}" updated`);
      } else {
        await addExercise(payload);
        toast.success(`"${payload.name}" added`);
      }

      setIsOpen(false);
      resetForm();
    } finally {
      setIsSavingExercise(false);
    }
  };

  const handleDeleteRequest = (exercise: Exercise) => {
    setDeleteTarget(exercise);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || isDeletingExercise) return;
    setIsDeletingExercise(true);
    try {
      await removeExercise(deleteTarget.id);
      toast.success(`"${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
    } catch {
      toast.error('Cannot delete — this exercise still has logged sessions.');
    } finally {
      setIsDeletingExercise(false);
    }
  };

  const sessionCount = deleteTarget
    ? workouts.filter((w) => w.exerciseId === deleteTarget.id).length
    : 0;

  const hasSessions = sessionCount > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">Exercise Library</h2>
          <p className="text-muted-foreground text-sm">
            Build your own custom list of movements.
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button
              className="w-full gap-2 font-semibold sm:w-auto"
              onClick={handleNew}
              disabled={isSavingExercise}
            >
              <Plus className="h-4 w-4" /> New Exercise
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[calc(100%-2rem)] rounded-xl sm:w-full sm:max-w-lg">
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
                  placeholder={
                    WorkoutUtil.isCardioGroup(group)
                      ? 'e.g. Treadmill, Outdoor Run, Hyrox…'
                      : 'e.g. Incline Dumbbell Press'
                  }
                  disabled={isSavingExercise}
                />
              </div>
              <div className="space-y-2">
                <Label>Primary muscle</Label>
                <Select
                  value={group}
                  onValueChange={(v) => setGroup(v as MuscleGroup)}
                  disabled={isSavingExercise}
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
                  placeholder={
                    NOTES_PLACEHOLDER[group] ?? NOTES_PLACEHOLDER['Other']
                  }
                  disabled={isSavingExercise}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleSave}
                className="font-semibold"
                disabled={isSavingExercise}
              >
                {isSavingExercise ? (
                  <Loading
                    size="sm"
                    label={editingExercise ? 'Updating...' : 'Saving...'}
                    className="flex-row gap-2"
                  />
                ) : editingExercise ? (
                  'Update'
                ) : (
                  'Save'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="surface border-border/60 space-y-3 p-4">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-full" />
              <div className="border-border/60 border-t pt-3">
                <Skeleton className="h-3 w-16" />
              </div>
            </Card>
          ))}
        </div>
      ) : exercises.length === 0 ? (
        <Card className="surface p-10 text-center">
          <Dumbbell className="text-muted-foreground mx-auto mb-3 h-10 w-10" />
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
                className="surface group animate-fade-up border-border/60 hover:border-primary/40 p-4 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-display truncate text-lg leading-tight font-bold">
                      {ex.name}
                    </h3>
                    <Badge
                      variant="secondary"
                      className="mt-1.5 text-[10px] tracking-widest uppercase"
                    >
                      {ex.muscleGroup}
                    </Badge>
                    {ex.notes && (
                      <p className="text-muted-foreground mt-2 line-clamp-2 text-xs">
                        {ex.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground hover:text-primary h-8 w-8"
                      onClick={() => handleEdit(ex)}
                      aria-label={`Edit ${ex.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive h-8 w-8"
                      onClick={() => handleDeleteRequest(ex)}
                      aria-label={`Delete ${ex.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="border-border/60 text-muted-foreground mt-3 flex items-center justify-between border-t pt-3 font-mono text-xs">
                  <span>
                    {count} session{count !== 1 ? 's' : ''}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !isDeletingExercise) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="w-[calc(100%-2rem)] rounded-lg sm:w-full sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this exercise?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                {hasSessions ? (
                  <>
                    <p>
                      <span className="text-foreground font-semibold">
                        {deleteTarget?.name}
                      </span>{' '}
                      has{' '}
                      <span className="text-foreground font-semibold">
                        {sessionCount} logged session
                        {sessionCount !== 1 ? 's' : ''}
                      </span>
                      .
                    </p>
                    <p>
                      Remove all sessions for this exercise first before
                      deleting it.
                    </p>
                  </>
                ) : (
                  <p>
                    <span className="text-foreground font-semibold">
                      {deleteTarget?.name}
                    </span>{' '}
                    will be permanently deleted. This action cannot be undone.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingExercise}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={hasSessions || isDeletingExercise}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeletingExercise ? (
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
