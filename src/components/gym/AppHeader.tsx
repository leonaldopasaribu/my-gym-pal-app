import { Dumbbell, LogOut, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function AppHeader() {
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    toast.success("See you later 👋");
  };

  const userInitial = user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <header className="relative border-b border-border/60 sticky top-0 z-30 overflow-hidden">
      {/* Layered background */}
      <div className="absolute inset-0 bg-background/70 backdrop-blur-2xl" />
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />
      <div className="absolute -top-16 left-1/4 h-32 w-1/2 bg-foreground/[0.05] blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-foreground/30 to-transparent" />

      <div className="container relative flex items-center justify-between h-16">
        <div className="flex items-center gap-3">
          <div className="relative h-11 w-11 grid place-items-center rounded-2xl bg-gradient-to-br from-foreground/10 to-foreground/[0.02] border border-border shadow-card group">
            <Dumbbell className="h-5 w-5 text-foreground transition-transform group-hover:rotate-12" />
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-foreground grid place-items-center">
              <Flame className="h-2 w-2 text-background" strokeWidth={3} />
            </span>
            <span className="absolute inset-0 rounded-2xl ring-1 ring-foreground/10 animate-pulse-glow" />
          </div>
          <div className="leading-tight">
            <h1 className="font-display text-base sm:text-lg font-bold tracking-tight flex items-center gap-1.5">
              <span className="text-foreground">My</span>
              <span className="text-gradient-primary">Gym</span>
              <span className="text-foreground">Pal</span>
            </h1>
            <div className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-foreground/60 animate-pulse" />
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-mono">
                Train · Track · Transform
              </p>
            </div>
          </div>
        </div>
        {user && (
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-secondary/60 border border-border/60">
              <div className="h-6 w-6 rounded-full bg-foreground text-background grid place-items-center text-[11px] font-bold">
                {userInitial}
              </div>
              <span className="text-xs text-muted-foreground font-mono truncate max-w-[140px]">
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
