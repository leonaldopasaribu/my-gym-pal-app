import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import type {
  Exercise,
  MuscleGroup,
  WorkoutEntry,
  WorkoutSet,
} from './gym-types';

const SEED: Omit<Exercise, 'id' | 'createdAt'>[] = [
  { name: 'Bench Press', muscleGroup: 'Chest' },
  { name: 'Back Squat', muscleGroup: 'Legs' },
  { name: 'Deadlift', muscleGroup: 'Back' },
];

const LEGACY_EX = 'ironlog.exercises.v1';
const LEGACY_WO = 'ironlog.workouts.v1';
const MIGRATED_FLAG = 'ironlog.migrated.v1';

interface DbExercise {
  id: string;
  user_id: string;
  name: string;
  muscle_group: string;
  notes: string | null;
  created_at: string;
}

interface DbWorkout {
  id: string;
  user_id: string;
  exercise_id: string;
  date: string;
  sets: WorkoutSet[];
  note: string | null;
  created_at: string;
}

const fromDbEx = (r: DbExercise): Exercise => ({
  id: r.id,
  name: r.name,
  muscleGroup: r.muscle_group as MuscleGroup,
  notes: r.notes ?? undefined,
  createdAt: new Date(r.created_at).getTime(),
});

const fromDbWo = (r: DbWorkout): WorkoutEntry => ({
  id: r.id,
  exerciseId: r.exercise_id,
  date: r.date,
  sets: Array.isArray(r.sets) ? r.sets : [],
  note: r.note ?? undefined,
  createdAt: new Date(r.created_at).getTime(),
});

// Migrate localStorage data to the user's account on first login
async function migrateLocalData(userId: string) {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(MIGRATED_FLAG)) return;

  try {
    const rawEx = localStorage.getItem(LEGACY_EX);
    const rawWo = localStorage.getItem(LEGACY_WO);
    const localEx: any[] = rawEx ? JSON.parse(rawEx) : [];
    const localWo: any[] = rawWo ? JSON.parse(rawWo) : [];

    // Map of old id -> new id
    const idMap: Record<string, string> = {};

    if (localEx.length > 0) {
      const rows = localEx.map((e) => ({
        user_id: userId,
        name: e.name,
        muscle_group: e.muscleGroup,
        notes: e.notes ?? null,
      }));
      const { data: inserted, error } = await supabase
        .from('exercises')
        .insert(rows)
        .select();
      if (error) throw error;
      inserted?.forEach((row: any, i: number) => {
        idMap[localEx[i].id] = row.id;
      });
    }

    if (localWo.length > 0) {
      const rows = localWo
        .filter((w) => idMap[w.exerciseId])
        .map((w) => ({
          user_id: userId,
          exercise_id: idMap[w.exerciseId],
          date: w.date,
          sets: w.sets,
          note: w.note ?? null,
        }));
      if (rows.length) {
        const { error } = await supabase.from('workouts').insert(rows);
        if (error) throw error;
      }
    }

    localStorage.setItem(MIGRATED_FLAG, '1');
  } catch (e) {
    console.error('Migration failed:', e);
  }
}

async function ensureSeed(userId: string) {
  const seedKey = `ironlog.seeded.${userId}`;
  if (typeof window !== 'undefined' && localStorage.getItem(seedKey)) return;

  const { count } = await supabase
    .from('exercises')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  if ((count ?? 0) === 0) {
    await supabase.from('exercises').insert(
      SEED.map((s) => ({
        user_id: userId,
        name: s.name,
        muscle_group: s.muscleGroup,
      }))
    );
  }
  if (typeof window !== 'undefined') localStorage.setItem(seedKey, '1');
}

export function useExercises() {
  const { user } = useAuth();
  const [items, setItems] = useState<Exercise[]>([]);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) setItems((data as DbExercise[]).map(fromDbEx));
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) {
        setItems([]);
        return;
      }
      await migrateLocalData(user.id);
      await ensureSeed(user.id);
      if (!cancelled) await refresh();
    })();
    return () => {
      cancelled = true;
    };
  }, [user, refresh]);

  const addExercise = async (e: Omit<Exercise, 'id' | 'createdAt'>) => {
    if (!user) return;
    await supabase.from('exercises').insert({
      user_id: user.id,
      name: e.name,
      muscle_group: e.muscleGroup,
      notes: e.notes ?? null,
    });
    await refresh();
  };
  const removeExercise = async (id: string) => {
    await supabase.from('exercises').delete().eq('id', id);
    await refresh();
  };
  const updateExercise = async (id: string, patch: Partial<Exercise>) => {
    const dbPatch: any = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.muscleGroup !== undefined)
      dbPatch.muscle_group = patch.muscleGroup;
    if (patch.notes !== undefined) dbPatch.notes = patch.notes;
    await supabase.from('exercises').update(dbPatch).eq('id', id);
    await refresh();
  };

  return { exercises: items, addExercise, removeExercise, updateExercise };
}

export function useWorkouts() {
  const { user } = useAuth();
  const [items, setItems] = useState<WorkoutEntry[]>([]);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });
    if (!error && data)
      setItems((data as unknown as DbWorkout[]).map(fromDbWo));
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addWorkout = async (w: Omit<WorkoutEntry, 'id' | 'createdAt'>) => {
    if (!user) return;
    await supabase.from('workouts').insert({
      user_id: user.id,
      exercise_id: w.exerciseId,
      date: w.date,
      sets: w.sets as any,
      note: w.note ?? null,
    });
    await refresh();
  };
  const removeWorkout = async (id: string) => {
    await supabase.from('workouts').delete().eq('id', id);
    await refresh();
  };
  const updateWorkout = async (
    id: string,
    patch: Partial<Omit<WorkoutEntry, 'id' | 'createdAt'>>
  ) => {
    const dbPatch: any = {};
    if (patch.exerciseId !== undefined) dbPatch.exercise_id = patch.exerciseId;
    if (patch.date !== undefined) dbPatch.date = patch.date;
    if (patch.sets !== undefined) dbPatch.sets = patch.sets as any;
    if (patch.note !== undefined) dbPatch.note = patch.note ?? null;
    await supabase.from('workouts').update(dbPatch).eq('id', id);
    await refresh();
  };

  return { workouts: items, addWorkout, removeWorkout, updateWorkout };
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
