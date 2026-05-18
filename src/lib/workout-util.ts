import { MuscleGroup, WorkoutSet } from './gym-types';

export class WorkoutUtil {
  static isCardioGroup(muscleGroup: MuscleGroup): boolean {
    return muscleGroup === 'Cardio';
  }

  // Format pace as mm:ss/km
  static formatPace(durationMinutes: number, distanceKm: number): string {
    if (!distanceKm || distanceKm <= 0) return '';
    const paceMinPerKm = durationMinutes / distanceKm;
    const mins = Math.floor(paceMinPerKm);
    const secs = Math.round((paceMinPerKm - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}/km`;
  }

  // Format a cardio set for display: "30min · 5.0km · 6:00/km"
  static formatCardioSet(s: WorkoutSet): string {
    const parts: string[] = [];
    if (s.durationMinutes) parts.push(`${s.durationMinutes}min`);
    if (s.distanceKm) parts.push(`${s.distanceKm}km`);
    if (s.durationMinutes && s.distanceKm) {
      const pace = WorkoutUtil.formatPace(s.durationMinutes, s.distanceKm);
      if (pace) parts.push(pace);
    }
    return parts.join(' · ');
  }
}
