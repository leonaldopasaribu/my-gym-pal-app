import { useCallback, useEffect, useState } from 'react';
import type { Exercise, WorkoutEntry } from './gym-types';

const KEY_EX = 'ironlog.exercises.v1';
const KEY_WO = 'ironlog.workouts.v1';

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, val: T) {
  localStorage.setItem(key, JSON.stringify(val));
  window.dispatchEvent(new StorageEvent('storage', { key }));
}

const SEED: Exercise[] = [
  {
    id: 'seed-bench',
    name: 'Bench Press',
    muscleGroup: 'Chest',
    createdAt: Date.now(),
  },
  {
    id: 'seed-squat',
    name: 'Back Squat',
    muscleGroup: 'Legs',
    createdAt: Date.now(),
  },
  {
    id: 'seed-deadlift',
    name: 'Deadlift',
    muscleGroup: 'Back',
    createdAt: Date.now(),
  },
];

function ensureSeed() {
  if (!localStorage.getItem(KEY_EX)) write(KEY_EX, SEED);
}

export function useExercises() {
  const [items, setItems] = useState<Exercise[]>([]);
  const refresh = useCallback(() => {
    ensureSeed();
    setItems(read<Exercise[]>(KEY_EX, []));
  }, []);
  useEffect(() => {
    refresh();
    const h = (e: StorageEvent) => {
      if (!e.key || e.key === KEY_EX) refresh();
    };
    window.addEventListener('storage', h);
    return () => window.removeEventListener('storage', h);
  }, [refresh]);

  const add = (e: Omit<Exercise, 'id' | 'createdAt'>) => {
    const next: Exercise = {
      ...e,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    write(KEY_EX, [next, ...items]);
  };
  const remove = (id: string) =>
    write(
      KEY_EX,
      items.filter((i) => i.id !== id)
    );
  const update = (id: string, patch: Partial<Exercise>) =>
    write(
      KEY_EX,
      items.map((i) => (i.id === id ? { ...i, ...patch } : i))
    );

  return {
    exercises: items,
    addExercise: add,
    removeExercise: remove,
    updateExercise: update,
  };
}

export function useWorkouts() {
  const [items, setItems] = useState<WorkoutEntry[]>([]);
  const refresh = useCallback(
    () => setItems(read<WorkoutEntry[]>(KEY_WO, [])),
    []
  );
  useEffect(() => {
    refresh();
    const h = (e: StorageEvent) => {
      if (!e.key || e.key === KEY_WO) refresh();
    };
    window.addEventListener('storage', h);
    return () => window.removeEventListener('storage', h);
  }, [refresh]);

  const add = (w: Omit<WorkoutEntry, 'id' | 'createdAt'>) => {
    const next: WorkoutEntry = {
      ...w,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    write(KEY_WO, [next, ...items]);
  };
  const remove = (id: string) =>
    write(
      KEY_WO,
      items.filter((i) => i.id !== id)
    );

  return { workouts: items, addWorkout: add, removeWorkout: remove };
}

// Helpers
export function bestSet(entries: WorkoutEntry[]) {
  let best = { weight: 0, reps: 0 };
  entries.forEach((e) =>
    e.sets.forEach((s) => {
      if (
        s.weight > best.weight ||
        (s.weight === best.weight && s.reps > best.reps)
      ) {
        best = { weight: s.weight, reps: s.reps };
      }
    })
  );
  return best;
}

// Estimated 1RM (Epley)
export function epley1RM(weight: number, reps: number) {
  if (reps <= 0 || weight <= 0) return 0;
  return weight * (1 + reps / 30);
}

export function entryTopWeight(e: WorkoutEntry) {
  return e.sets.reduce((m, s) => Math.max(m, s.weight), 0);
}

export function entryVolume(e: WorkoutEntry) {
  return e.sets.reduce((m, s) => m + s.weight * s.reps, 0);
}

export function entryBest1RM(e: WorkoutEntry) {
  return e.sets.reduce((m, s) => Math.max(m, epley1RM(s.weight, s.reps)), 0);
}
