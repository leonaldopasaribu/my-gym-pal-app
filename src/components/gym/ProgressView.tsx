import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  useExercises,
  useWorkouts,
  entryTopWeight,
  entryVolume,
  entryBest1RM,
} from '@/lib/gym-store';
import { TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
} from 'recharts';
import { Skeleton } from '../ui/skeleton';

type Metric = 'top' | 'volume' | 'e1rm';

const METRIC_LABEL: Record<Metric, string> = {
  top: 'Top Set Weight (kg)',
  volume: 'Total Volume (kg)',
  e1rm: 'Estimated 1RM (kg)',
};

export function ProgressView() {
  const { exercises, isLoading: isLoadingExercises } = useExercises();
  const { workouts, isLoading: isLoadingWorkouts } = useWorkouts();
  const [exerciseId, setExerciseId] = useState<string>(exercises[0]?.id ?? '');
  const [metric, setMetric] = useState<Metric>('top');
  const isLoading = isLoadingExercises || isLoadingWorkouts;

  // Sync selection when exercises load
  const activeId = exerciseId || exercises[0]?.id || '';

  const data = useMemo(() => {
    const filtered = workouts
      .filter((w) => w.exerciseId === activeId)
      .sort((a, b) => a.date.localeCompare(b.date));
    return filtered.map((w) => ({
      date: w.date.slice(5), // mm-dd
      top: entryTopWeight(w),
      volume: entryVolume(w),
      e1rm: Math.round(entryBest1RM(w) * 10) / 10,
    }));
  }, [workouts, activeId]);

  const last = data[data.length - 1];
  const prev = data[data.length - 2];
  const delta =
    last && prev ? (last[metric] as number) - (prev[metric] as number) : 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-full sm:w-[220px]" />
            <Skeleton className="h-10 w-44" />
          </div>
        </div>
        <Card className="surface space-y-4 border-border/60 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-9 w-28" />
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-[260px] w-full sm:h-[320px]" />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">
            Progressive Overload
          </h2>
          <p className="text-sm text-muted-foreground">
            Track weight & volume progress over time.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Select value={activeId} onValueChange={setExerciseId}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Select exercise" />
            </SelectTrigger>
            <SelectContent>
              {exercises.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ToggleGroup
            type="single"
            value={metric}
            onValueChange={(v) => v && setMetric(v as Metric)}
            className="grid w-full grid-cols-3 rounded-md bg-secondary/40 p-0.5 sm:flex sm:w-auto"
          >
            <ToggleGroupItem
              value="top"
              className="px-3 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              Top
            </ToggleGroupItem>
            <ToggleGroupItem
              value="volume"
              className="px-3 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              Volume
            </ToggleGroupItem>
            <ToggleGroupItem
              value="e1rm"
              className="px-3 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              e1RM
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <Card className="surface border-border/60 p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
              {METRIC_LABEL[metric]}
            </div>
            <div className="mt-1 font-display text-3xl font-bold">
              {last ? Number(last[metric]).toLocaleString() : '—'}
              <span className="ml-1 text-base text-muted-foreground">kg</span>
            </div>
          </div>
          {last && prev && (
            <div
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-sm ${
                delta > 0
                  ? 'bg-primary/15 text-primary'
                  : delta < 0
                    ? 'bg-destructive/15 text-destructive'
                    : 'bg-secondary text-muted-foreground'
              }`}
            >
              <TrendingUp
                className={`h-4 w-4 ${delta < 0 ? 'rotate-180' : ''}`}
              />
              {delta > 0 ? '+' : ''}
              {delta.toFixed(1)}
            </div>
          )}
        </div>

        {data.length === 0 ? (
          <div className="grid h-[260px] place-items-center px-4 text-center text-sm text-muted-foreground sm:h-[320px]">
            No data for this exercise yet. Log a workout first!
          </div>
        ) : (
          <div className="h-[260px] sm:h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0.5}
                    />
                    <stop
                      offset="100%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="hsl(var(--border))"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                />
                <Area
                  type="monotone"
                  dataKey={metric}
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  fill="url(#grad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}
