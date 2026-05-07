import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { useWorkouts } from '@/lib/gym-store';
import { Flame, Activity } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

function toISODate(d: Date) {
  const x = new Date(d);
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
  return x.toISOString().slice(0, 10);
}

export function HomeView() {
  const { workouts, isLoading } = useWorkouts();

  const { streak, sessions30, days } = useMemo(() => {
    const dateSet = new Set(workouts.map((w) => w.date));

    // Streak: consecutive days back from today (or yesterday if no log today)
    let streak = 0;
    const cursor = new Date();
    if (!dateSet.has(toISODate(cursor))) {
      cursor.setDate(cursor.getDate() - 1);
    }
    while (dateSet.has(toISODate(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    // 30 day grid (oldest -> newest)
    const days: { date: string; count: number }[] = [];
    let sessions30 = 0;
    const counts: Record<string, number> = {};
    workouts.forEach((w) => {
      counts[w.date] = (counts[w.date] || 0) + 1;
    });
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = toISODate(d);
      const c = counts[iso] || 0;
      sessions30 += c;
      days.push({ date: iso, count: c });
    }

    return { streak, sessions30, days };
  }, [workouts]);

  const maxCount = Math.max(1, ...days.map((d) => d.count));

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="surface border-border/60 p-6 sm:p-8 space-y-4">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-16 w-48" />
          <Skeleton className="h-4 w-3/4" />
        </Card>
        <Card className="surface border-border/60 p-5 sm:p-6 space-y-4">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-12 w-32" />
          <div className="grid grid-cols-10 gap-1.5">
            {Array.from({ length: 30 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-[5px]" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Momentum / Streak */}
      <Card className="surface border-border/60 p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-primary font-mono mb-3">
          <Flame className="h-3.5 w-3.5" />
          Momentum
        </div>
        <div className="flex items-baseline gap-3">
          <div className="font-display text-6xl sm:text-7xl font-bold leading-none text-gradient-primary">
            {streak}
          </div>
          <div className="text-lg sm:text-xl text-muted-foreground font-medium">
            {streak === 1 ? 'Day' : 'Days'} Streak
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-3">
          {streak === 0
            ? 'Log a workout today to start your streak.'
            : 'Keep showing up. Consistency builds champions.'}
        </p>
      </Card>

      {/* 30-day velocity */}
      <Card className="surface border-border/60 p-5 sm:p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-primary font-mono mb-2">
              <Activity className="h-3.5 w-3.5" />
              30 Day Velocity
            </div>
            <div className="flex items-baseline gap-2">
              <div className="font-display text-4xl sm:text-5xl font-bold">
                {sessions30}
              </div>
              <div className="text-sm text-muted-foreground">
                {sessions30 === 1 ? 'session' : 'sessions'}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-10 gap-1.5">
          {days.map((d) => {
            const intensity =
              d.count === 0 ? 0 : Math.min(1, d.count / maxCount);
            const opacity = d.count === 0 ? 0.08 : 0.25 + intensity * 0.75;
            return (
              <div
                key={d.date}
                title={`${d.date} · ${d.count} session${d.count === 1 ? '' : 's'}`}
                className="aspect-square rounded-[5px] border border-border/40"
                style={{
                  backgroundColor: `hsl(var(--primary) / ${opacity})`,
                }}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between mt-4 text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
          <span>30 days ago</span>
          <div className="flex items-center gap-1">
            <span className="mr-1">Less</span>
            {[0.08, 0.35, 0.6, 0.85, 1].map((o, i) => (
              <div
                key={i}
                className="h-2.5 w-2.5 rounded-[3px] border border-border/40"
                style={{ backgroundColor: `hsl(var(--primary) / ${o})` }}
              />
            ))}
            <span className="ml-1">More</span>
          </div>
          <span>Today</span>
        </div>
      </Card>
    </div>
  );
}
