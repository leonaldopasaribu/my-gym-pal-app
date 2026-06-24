export type MuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Biceps'
  | 'Triceps'
  | 'Legs'
  | 'Glutes'
  | 'Forearms'
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
  // Strength
  reps: number;
  weight: number;
  // Cardio (optional — only present when muscleGroup === 'Cardio')
  durationMinutes?: number;
  distanceKm?: number;
  avgHeartRate?: number;
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
  'Biceps',
  'Triceps',
  'Legs',
  'Glutes',
  'Forearms',
  'Core',
  'Cardio',
  'Other',
];
