import { Dumbbell, Flame } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="border-b border-border/60 bg-background/60 backdrop-blur-xl sticky top-0 z-30">
      <div className="container flex items-center justify-between h-16">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 grid place-items-center rounded-xl bg-primary/15 border border-primary/30">
            <Dumbbell className="h-5 w-5 text-primary" />
            <span className="absolute inset-0 rounded-xl animate-pulse-glow" />
          </div>
          <div className="leading-tight">
            <h1 className="font-display text-lg font-bold tracking-tight">
              IRON<span className="text-gradient-primary">LOG</span>
            </h1>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Progressive Overload Tracker
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <Flame className="h-4 w-4 text-accent" />
          NO DAYS OFF
        </div>
      </div>
    </header>
  );
}
