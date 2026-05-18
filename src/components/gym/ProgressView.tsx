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
  entryTotalDistance,
  entryTotalDuration,
} from '@/lib/gym-store';
import { WorkoutUtil } from '@/lib/workout-util';
import { TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
} from 'recharts';
import { Skeleton } from '../ui/skeleton';

type StrengthMetric = 'top' | 'volume' | 'e1rm';
type CardioMetric = 'duration' | 'distance' | 'pace';
type Metric = StrengthMetric | CardioMetric;

const METRIC_LABEL: Record<Metric, string> = {
  top: 'Top Set Weight (kg)',
  volume: 'Total Volume (kg)',
  e1rm: 'Estimated 1RM (kg)',
  duration: 'Total Duration (min)',
  distance: 'Total Distance (km)',
  pace: 'Average Pace (min/km)',
};

const METRIC_UNIT: Record<Metric, string> = {
  top: 'kg',
  volume: 'kg',
  e1rm: 'kg',
  duration: 'min',
  distance: 'km',
  pace: 'min/km',
};

const STRENGTH_METRICS: { value: StrengthMetric; label: string }[] = [
  { value: 'top', label: 'Top' },
  { value: 'volume', label: 'Volume' },
  { value: 'e1rm', label: 'e1RM' },
];

const CARDIO_METRICS: { value: CardioMetric; label: string }[] = [
  { value: 'duration', label: 'Duration' },
  { value: 'distance', label: 'Distance' },
  { value: 'pace', label: 'Pace' },
];

function formatMetricValue(metric: Metric, value?: number) {
  if (value === undefined || Number.isNaN(value)) return '—';
  if (metric === 'pace') {
    const minutes = Math.floor(value);
    const seconds = Math.round((value - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  const rounded = Math.round(value * 10) / 10;
  return rounded.toLocaleString();
}

export function ProgressView() {
  const { exercises, isLoading: isLoadingExercises } = useExercises();
  const { workouts, isLoading: isLoadingWorkouts } = useWorkouts();
  const [exerciseId, setExerciseId] = useState<string>(exercises[0]?.id ?? '');
  const [metric, setMetric] = useState<Metric>('top');
  const isLoading = isLoadingExercises || isLoadingWorkouts;

  // Sync selection when exercises load
  const activeId = exerciseId || exercises[0]?.id || '';
  const selectedExercise = exercises.find((e) => e.id === activeId);
  const isCardio = selectedExercise
    ? WorkoutUtil.isCardioGroup(selectedExercise.muscleGroup)
    : false;
  const metricOptions = isCardio ? CARDIO_METRICS : STRENGTH_METRICS;
  const activeMetric = metricOptions.some((option) => option.value === metric)
    ? metric
    : isCardio
      ? 'duration'
      : 'top';

  const data = useMemo(() => {
    const filtered = workouts
      .filter((w) => w.exerciseId === activeId)
      .sort((a, b) => a.date.localeCompare(b.date));
    return filtered.map((w) => {
      const duration = entryTotalDuration(w);
      const distance = entryTotalDistance(w);
      return {
        date: w.date.slice(5), // mm-dd
        top: entryTopWeight(w),
        volume: entryVolume(w),
        e1rm: Math.round(entryBest1RM(w) * 10) / 10,
        duration,
        distance,
        pace: distance > 0 ? duration / distance : 0,
      };
    });
  }, [workouts, activeId]);

  const last = data[data.length - 1];
  const prev = data[data.length - 2];
  const delta =
    last && prev
      ? (last[activeMetric] as number) - (prev[activeMetric] as number)
      : 0;
  const isPositiveTrend = activeMetric === 'pace' ? delta < 0 : delta > 0;
  const isNegativeTrend = activeMetric === 'pace' ? delta > 0 : delta < 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-full sm:w-55" />
            <Skeleton className="h-10 w-44" />
          </div>
        </div>
        <Card className="surface border-border/60 space-y-4 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-9 w-28" />
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-65 w-full sm:h-80" />
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
          <p className="text-muted-foreground text-sm">
            {isCardio
              ? 'Track duration, distance & pace over time.'
              : 'Track weight & volume progress over time.'}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Select value={activeId} onValueChange={setExerciseId}>
            <SelectTrigger className="w-full sm:w-55">
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
            value={activeMetric}
            onValueChange={(v) => v && setMetric(v as Metric)}
            className="bg-secondary/40 grid w-full grid-cols-3 rounded-md p-0.5 sm:flex sm:w-auto"
          >
            {metricOptions.map((option) => (
              <ToggleGroupItem
                key={option.value}
                value={option.value}
                className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-3 text-xs"
              >
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>

      <Card className="surface border-border/60 p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-muted-foreground text-[11px] tracking-widest uppercase">
              {METRIC_LABEL[activeMetric]}
            </div>
            <div className="font-display mt-1 text-3xl font-bold">
              {last ? formatMetricValue(activeMetric, last[activeMetric]) : '—'}
              <span className="text-muted-foreground ml-1 text-base">
                {METRIC_UNIT[activeMetric]}
              </span>
            </div>
          </div>
          {last && prev && (
            <div
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-sm ${
                isPositiveTrend
                  ? 'bg-primary/15 text-primary'
                  : isNegativeTrend
                    ? 'bg-destructive/15 text-destructive'
                    : 'bg-secondary text-muted-foreground'
              }`}
            >
              <TrendingUp
                className={`h-4 w-4 ${isNegativeTrend ? 'rotate-180' : ''}`}
              />
              {delta > 0 ? '+' : ''}
              {activeMetric === 'pace'
                ? formatMetricValue(activeMetric, Math.abs(delta))
                : delta.toFixed(1)}
            </div>
          )}
        </div>

        {data.length === 0 ? (
          <div className="text-muted-foreground grid h-65 place-items-center px-4 text-center text-sm sm:h-80">
            No data for this exercise yet. Log a workout first!
          </div>
        ) : (
          <div className="h-65 sm:h-80">
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
                  dataKey={activeMetric}
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
