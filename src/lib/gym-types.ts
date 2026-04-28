export type MuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Arms'
  | 'Legs'
  | 'Core'
  | 'Cardio'
  | 'Other';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  notes?: string;
  createdAt: number;
}

export interface WorkoutSet {
  id: string;
  reps: number;
  weight: number; // kg
}

export interface WorkoutEntry {
  id: string;
  exerciseId: string;
  date: string; // ISO yyyy-mm-dd
  sets: WorkoutSet[];
  note?: string;
  createdAt: number;
}

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'Chest',
  'Back',
  'Shoulders',
  'Arms',
  'Legs',
  'Core',
  'Cardio',
  'Other',
];
