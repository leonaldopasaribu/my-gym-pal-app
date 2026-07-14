import { useMemo, useState } from 'react';
import { ChevronRight, Dumbbell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { useExercises } from '@/lib/gym-store';

export function ExercisePicker({
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
