import { Dumbbell, LogOut, Flame, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

interface AppHeaderProps {
  isShowButtonBack?: boolean;
  handleBack?: () => void;
}

export function AppHeader({ isShowButtonBack, handleBack }: AppHeaderProps) {
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    toast.success('See you later 👋');
  };

  const userInitial = user?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <header className="relative top-0 z-30 overflow-hidden border-b border-border/60">
      {/* Layered background */}
      <div className="absolute inset-0 bg-background/70 backdrop-blur-2xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage:
            'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }}
      />
      <div className="pointer-events-none absolute -top-16 left-1/4 h-32 w-1/2 bg-foreground/[0.05] blur-3xl" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-foreground/30 to-transparent" />

      <div className="container relative flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          {isShowButtonBack ? (
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 shrink-0"
              onClick={handleBack}
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          ) : (
            <div className="group relative grid h-11 w-11 place-items-center rounded-2xl border border-border bg-gradient-to-br from-foreground/10 to-foreground/[0.02] shadow-card">
              <Dumbbell className="h-5 w-5 text-foreground transition-transform group-hover:rotate-12" />

              <span className="absolute -right-1 -top-1 grid h-3 w-3 place-items-center rounded-full bg-foreground">
                <Flame className="h-2 w-2 text-background" strokeWidth={3} />
              </span>

              <span className="absolute inset-0 animate-pulse-glow rounded-2xl ring-1 ring-foreground/10" />
            </div>
          )}

          <div className="leading-tight">
            <h1 className="flex items-center gap-1.5 font-display text-xl font-bold tracking-tight sm:text-lg">
              <span className="text-foreground">My</span>
              <span className="text-gradient-primary">Gym</span>
              <span className="text-foreground">Pal</span>
            </h1>
          </div>
        </div>
        {user && (
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-border/60 bg-secondary/60 px-2.5 py-1.5 sm:flex">
              <div className="grid h-6 w-6 place-items-center rounded-full bg-foreground text-[11px] font-bold text-background">
                {userInitial}
              </div>
              <span className="max-w-[140px] truncate font-mono text-xs text-muted-foreground">
                {user.email}
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleLogout}
              className="gap-1.5 hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
