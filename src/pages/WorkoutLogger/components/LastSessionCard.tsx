import { Copy, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  entryTotalDistance,
  entryTotalDuration,
  entryTopWeight,
  entryVolume,
} from '@/lib/gym-store';
import type { WorkoutEntry } from '@/lib/gym-types';
import { WorkoutUtil } from '@/lib/workout-util';
import { Utils } from '@/lib/utils';

export function LastSessionCard({
  lastSession,
  isCardio,
  onCopy,
}: {
  lastSession: WorkoutEntry;
  isCardio: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="animate-fade-up border-border/60 bg-secondary/40 rounded-xl border p-4">
      <div className="mb-3 flex items-center gap-2">
        <Zap className="fill-primary/20 text-primary h-3.5 w-3.5" />
        <div className="min-w-0">
          <span className="font-display block text-sm leading-none font-bold tracking-tight">
            Last Session
          </span>
          <span className="text-muted-foreground font-mono text-[10px] leading-none">
            {Utils.formatDateID(lastSession.date)}
          </span>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {lastSession.sets.map((s, i) => (
          <span
            key={s.id}
            className="border-border/60 bg-background/60 rounded border px-2 py-0.5 font-mono text-[11px]"
          >
            {i + 1}:{' '}
            {isCardio
              ? WorkoutUtil.formatCardioSet(s)
              : `${s.reps}×${s.weight}kg`}
          </span>
        ))}
      </div>

      <div className="border-border/40 space-y-3 border-t pt-3">
        {isCardio ? (
          <div className="text-muted-foreground flex flex-wrap gap-4 font-mono text-[10px]">
            <span>
              DUR{' '}
              <span className="text-primary font-bold">
                {entryTotalDuration(lastSession)}min
              </span>
            </span>
            {entryTotalDistance(lastSession) > 0 && (
              <span>
                DIST{' '}
                <span className="text-primary font-bold">
                  {entryTotalDistance(lastSession)}km
                </span>
              </span>
            )}
            {entryTotalDistance(lastSession) > 0 && (
              <span>
                PACE{' '}
                <span className="text-primary font-bold">
                  {WorkoutUtil.formatPace(
                    entryTotalDuration(lastSession),
                    entryTotalDistance(lastSession)
                  )}
                </span>
              </span>
            )}
            {lastSession.sets.some((s) => (s.speed ?? 0) > 0) && (
              <span>
                SPD{' '}
                <span className="text-primary font-bold">
                  {lastSession.sets.find((s) => (s.speed ?? 0) > 0)?.speed}
                </span>
              </span>
            )}
          </div>
        ) : (
          <div className="text-muted-foreground flex gap-4 font-mono text-[10px]">
            <span>
              TOP{' '}
              <span className="text-primary font-bold">
                {entryTopWeight(lastSession)}kg
              </span>
            </span>
            <span>
              VOL{' '}
              <span className="text-primary font-bold">
                {entryVolume(lastSession).toLocaleString()}kg
              </span>
            </span>
          </div>
        )}

        <Button
          size="sm"
          onClick={onCopy}
          className="bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground h-9 w-full gap-2 border-none text-xs font-bold transition-all active:scale-[0.98]"
        >
          <Copy className="h-3.5 w-3.5" />
          Copy Last Session
        </Button>
      </div>
    </div>
  );
}
