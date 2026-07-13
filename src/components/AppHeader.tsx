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
    <header className="border-border/60 relative top-0 z-30 overflow-hidden border-b">
      {/* Layered background */}
      <div className="bg-background/70 absolute inset-0 backdrop-blur-2xl" />
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
      <div className="bg-foreground/5 pointer-events-none absolute -top-16 left-1/4 h-32 w-1/2 blur-3xl" />
      <div className="via-foreground/30 absolute right-0 bottom-0 left-0 h-px bg-linear-to-r from-transparent to-transparent" />

      <div className="relative container flex h-16 items-center justify-between">
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
            <div className="group border-border from-foreground/10 to-foreground/2 shadow-card relative grid h-11 w-11 place-items-center rounded-2xl border bg-linear-to-br">
              <Dumbbell className="text-foreground h-5 w-5 transition-transform group-hover:rotate-12" />

              <span className="bg-foreground absolute -top-1 -right-1 grid h-3 w-3 place-items-center rounded-full">
                <Flame className="text-background h-2 w-2" strokeWidth={3} />
              </span>

              <span className="animate-pulse-glow ring-foreground/10 absolute inset-0 rounded-2xl ring-1" />
            </div>
          )}

          <div className="leading-tight">
            <h1 className="font-display flex items-center gap-1.5 text-xl font-bold tracking-tight sm:text-lg">
              <span className="text-foreground">My</span>
              <span className="text-gradient-primary">Gym</span>
              <span className="text-foreground">Pal</span>
            </h1>
          </div>
        </div>
        {user && (
          <div className="flex items-center gap-2">
            <div className="border-border/60 bg-secondary/60 hidden items-center gap-2 rounded-full border px-2.5 py-1.5 sm:flex">
              <div className="bg-foreground text-background grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold">
                {userInitial}
              </div>
              <span className="text-muted-foreground max-w-35 truncate font-mono text-xs">
                {user.email}
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleLogout}
              className="hover:bg-destructive/10 hover:text-destructive gap-1.5"
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
