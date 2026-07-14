import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ROUTE_URL } from '@/constants/route-url';
import { WorkoutEntry } from '@/lib/gym-types';
import { CalendarDays, ChevronRight } from 'lucide-react';
import { RecentSessionsList } from './RecentSessionList';
import { useNavigate } from 'react-router-dom';

type ExerciseLike = { name: string; muscleGroup: string };

export default function RecentSessionCard({
  isLoading,
  recent,
  exMap,
  onEdit,
  onDeleteRequest,
}: {
  isLoading: boolean;
  recent: WorkoutEntry[];
  exMap: Record<string, ExerciseLike>;
  onEdit: (workoutId: string) => void;
  onDeleteRequest: (workout: WorkoutEntry) => void;
}) {
  const navigate = useNavigate();

  return (
    <Card className="surface border-border/60 overflow-hidden p-4 sm:p-6">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="text-primary h-4 w-4" />
          <h2 className="font-display text-2xl font-bold">Recent</h2>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="text-muted-foreground cursor-pointer gap-1 pr-0 text-xs hover:text-black"
          onClick={() => navigate(ROUTE_URL.WORKOUTS)}
        >
          View all
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
      <p className="text-muted-foreground mb-4 text-sm">
        Your latest 10 sessions.
      </p>

      <RecentSessionsList
        isLoading={isLoading}
        recent={recent}
        exMap={exMap}
        onEdit={onEdit}
        onDeleteRequest={onDeleteRequest}
      />
    </Card>
  );
}
