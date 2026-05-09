import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useWorkouts, useRestDays } from '@/lib/gym-store';
import { Flame, Activity, Moon, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

function toISODate(d: Date) {
  const x = new Date(d);
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
  return x.toISOString().slice(0, 10);
}

export function HomeView() {
  const { workouts, isLoading: woLoading } = useWorkouts();
  const {
    restDays,
    addRestDay,
    removeRestDay,
    isLoading: rdLoading,
  } = useRestDays();
  const isLoading = woLoading || rdLoading;

  const [restNote, setRestNote] = useState('');
  const [restOpen, setRestOpen] = useState(false);
  const today = toISODate(new Date());
  const todayHasWorkout = useMemo(
    () => workouts.some((w) => w.date === today),
    [workouts, today]
  );
  const todayIsRest = useMemo(
    () => restDays.some((r) => r.date === today),
    [restDays, today]
  );

  const { streak, sessions30, restCount30, days } = useMemo(() => {
    const woSet = new Set(workouts.map((w) => w.date));
    const restSet = new Set(restDays.map((r) => r.date));
    const activeSet = new Set([...woSet, ...restSet]);

    // Streak: workout OR rest day counts. Toleransi: kalau hari ini kosong, mulai dari kemarin.
    let streak = 0;
    const cursor = new Date();
    if (!activeSet.has(toISODate(cursor))) {
      cursor.setDate(cursor.getDate() - 1);
    }
    while (activeSet.has(toISODate(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    // 30 day grid
    const days: { date: string; count: number; isRest: boolean }[] = [];
    let sessions30 = 0;
    let restCount30 = 0;
    const counts: Record<string, number> = {};
    workouts.forEach((w) => {
      counts[w.date] = (counts[w.date] || 0) + 1;
    });
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = toISODate(d);
      const c = counts[iso] || 0;
      const isRest = restSet.has(iso);
      sessions30 += c;
      if (isRest) restCount30++;
      days.push({ date: iso, count: c, isRest });
    }

    return { streak, sessions30, restCount30, days };
  }, [workouts, restDays]);

  const maxCount = Math.max(1, ...days.map((d) => d.count));

  const handleMarkRest = async () => {
    await addRestDay(today, restNote.trim() || undefined);
    setRestNote('');
    setRestOpen(false);
    toast.success('Rest day logged. Recovery is part of progress 💪');
  };

  const handleUnmarkRest = async () => {
    await removeRestDay(today);
    toast.success('Rest day removed');
  };

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
            ? 'Log a workout or mark a rest day to start your streak.'
            : 'Keep showing up. Rest days count too — recovery is progress.'}
        </p>

        {/* Today action */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {todayIsRest ? (
            <>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/40 px-3 py-1.5 text-xs">
                <Moon className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono uppercase tracking-wider">
                  Rest day today
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleUnmarkRest}
                className="h-8 gap-1 text-xs"
              >
                <X className="h-3.5 w-3.5" /> Undo
              </Button>
            </>
          ) : todayHasWorkout ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-primary/10 px-3 py-1.5 text-xs">
              <Flame className="h-3.5 w-3.5 text-primary" />
              <span className="font-mono uppercase tracking-wider">
                Workout logged today
              </span>
            </div>
          ) : (
            <Dialog open={restOpen} onOpenChange={setRestOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs"
                >
                  <Moon className="h-3.5 w-3.5" /> Mark today as rest day
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Moon className="h-4 w-4 text-primary" /> Log rest day
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <p className="text-sm text-muted-foreground">
                    Rest days keep your streak alive. Add an optional note for
                    your history.
                  </p>
                  <Input
                    placeholder="e.g. recovery, sore legs, deload..."
                    value={restNote}
                    onChange={(e) => setRestNote(e.target.value)}
                    maxLength={120}
                  />
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setRestOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleMarkRest} className="gap-1.5">
                    <Plus className="h-4 w-4" /> Log rest day
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </Card>

      {/* 30-day velocity */}
      <Card className="surface border-border/60 p-5 sm:p-6">
        <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
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
          {restCount30 > 0 && (
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono mb-1 flex items-center gap-1 justify-end">
                <Moon className="h-3 w-3" /> Rest
              </div>
              <div className="font-display text-2xl font-bold text-muted-foreground">
                {restCount30}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-10 gap-1.5">
          {days.map((d) => {
            const intensity =
              d.count === 0 ? 0 : Math.min(1, d.count / maxCount);
            const opacity = d.count === 0 ? 0.08 : 0.25 + intensity * 0.75;
            const tip = d.isRest
              ? `${d.date} · Rest day`
              : `${d.date} · ${d.count} session${d.count === 1 ? '' : 's'}`;
            return (
              <div
                key={d.date}
                title={tip}
                className="aspect-square rounded-[5px] border border-border/40 relative"
                style={{
                  backgroundColor:
                    d.count > 0
                      ? `hsl(var(--primary) / ${opacity})`
                      : d.isRest
                        ? `hsl(var(--muted-foreground) / 0.25)`
                        : `hsl(var(--primary) / 0.08)`,
                }}
              >
                {d.isRest && d.count === 0 && (
                  <Moon className="absolute inset-0 m-auto h-2.5 w-2.5 text-muted-foreground" />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between mt-4 text-[10px] uppercase tracking-wider text-muted-foreground font-mono flex-wrap gap-2">
          <span>30 days ago</span>
          <div className="flex items-center gap-2">
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
            <span className="opacity-50">·</span>
            <div className="flex items-center gap-1">
              <div
                className="h-2.5 w-2.5 rounded-[3px] border border-border/40 flex items-center justify-center"
                style={{
                  backgroundColor: `hsl(var(--muted-foreground) / 0.25)`,
                }}
              >
                <Moon className="h-2 w-2" />
              </div>
              <span>Rest</span>
            </div>
          </div>
          <span>Today</span>
        </div>
      </Card>
    </div>
  );
}
