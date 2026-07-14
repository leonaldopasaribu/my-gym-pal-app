import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { v4 as uuidv4 } from 'uuid';
import type { WorkoutSet } from '@/lib/gym-types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export class Utils {
  static todayISO() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }

  static isoToDate(iso: string) {
    const d = new Date(iso + 'T00:00:00');
    return isNaN(d.getTime()) ? new Date() : d;
  }

  static dateToISO(d: Date) {
    const x = new Date(d);
    x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
    return x.toISOString().slice(0, 10);
  }

  static shiftDays(n: number) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return Utils.dateToISO(d);
  }

  static formatDateID(iso: string) {
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  }

  static defaultStrengthSet(): WorkoutSet {
    return { id: uuidv4(), reps: 8, weight: 20 };
  }

  static defaultCardioSet(last?: WorkoutSet): WorkoutSet {
    return {
      id: uuidv4(),
      reps: 0,
      weight: 0,
      durationMinutes: last?.durationMinutes ?? 30,
      distanceKm: last?.distanceKm ?? 5,
      speed: last?.speed ?? undefined,
    };
  }
}
