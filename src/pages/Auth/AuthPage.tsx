import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dumbbell,
  Flame,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

export default function AuthPage() {
  const navigate = useNavigate();
  const { session, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isLoading && session) navigate('/', { replace: true });
  }, [session, isLoading, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setBusy(false);
    if (error) {
      if (error.message.toLowerCase().includes('already')) {
        toast.error('Email already registered', {
          description: 'Try signing in instead.',
        });
      } else {
        toast.error(error.message);
      }
      return;
    }
    toast.success('Account created — let’s get to work 💪');
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setBusy(false);
    if (error) {
      toast.error('Sign in failed', { description: error.message });
      return;
    }
    toast.success('Welcome back 🔥');
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Layered background — same language as the app header */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage:
            'radial-gradient(ellipse at center, black 25%, transparent 70%)',
        }}
      />
      <div className="bg-foreground/5 pointer-events-none absolute -top-24 left-[15%] h-72 w-[40%] rounded-full blur-3xl" />
      <div className="bg-foreground/5 pointer-events-none absolute right-[10%] -bottom-24 h-72 w-[40%] rounded-full blur-3xl" />

      <div className="relative grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
        {/* ── Brand panel — hidden on small screens ───────────────────────── */}
        <div className="relative hidden overflow-hidden lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-12">
          <div className="absolute top-12 left-12 z-10 flex items-center gap-3">
            <div className="group border-border from-foreground/10 to-foreground/2 shadow-card relative grid h-11 w-11 place-items-center rounded-2xl border bg-linear-to-br">
              <Dumbbell className="text-foreground h-5 w-5 transition-transform group-hover:rotate-12" />
              <span className="bg-foreground absolute -top-1 -right-1 grid h-3 w-3 place-items-center rounded-full">
                <Flame className="text-background h-2 w-2" strokeWidth={3} />
              </span>
              <span className="animate-pulse-glow ring-foreground/10 absolute inset-0 rounded-2xl ring-1" />
            </div>
            <h1 className="font-display flex items-center gap-1.5 text-xl font-bold tracking-tight">
              <span className="text-foreground">My</span>
              <span className="text-gradient-primary">Gym</span>
              <span className="text-foreground">Pal</span>
            </h1>
          </div>

          <div className="relative z-10 max-w-md text-center">
            <p className="text-muted-foreground mb-3 text-xs font-medium tracking-[0.2em] uppercase">
              Progressive overload, logged
            </p>
            <h2 className="font-display text-4xl leading-[1.1] font-bold tracking-tight text-balance">
              The gym doesn’t wait.
              <br />
              <span className="text-gradient-primary">
                Neither should your log.
              </span>
            </h2>
            <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
              Every set, every plate, every PR — tracked the moment you rack it.
              No spreadsheets, no memory games, no losing the thread on leg day.
            </p>
          </div>
        </div>

        {/* ── Auth form ─────────────────────────────────────────────────────── */}
        <div className="grid place-items-center p-4">
          <div className="w-full max-w-md">
            <div className="animate-fade-up mb-6 flex flex-col items-center text-center lg:hidden">
              <div className="group border-border from-foreground/10 to-foreground/2 shadow-card relative mb-3 grid h-14 w-14 place-items-center rounded-2xl border bg-linear-to-br">
                <Dumbbell className="text-foreground h-7 w-7" />
                <span className="bg-foreground absolute -top-1 -right-1 grid h-3.5 w-3.5 place-items-center rounded-full">
                  <Flame className="text-background h-2 w-2" strokeWidth={3} />
                </span>
                <span className="animate-pulse-glow ring-foreground/10 absolute inset-0 rounded-2xl ring-1" />
              </div>
              <h1 className="font-display flex items-center gap-2 text-3xl font-bold tracking-tight">
                <span>My</span>
                <span className="text-gradient-primary">Gym</span>
                <span>Pal</span>
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                The gym doesn’t wait — neither should your log.
              </p>
            </div>

            <Card className="surface border-border/60 shadow-card animate-fade-up p-5 sm:p-6">
              <Tabs defaultValue="signin">
                <TabsList className="bg-muted/60 relative mb-6 grid w-full grid-cols-2 rounded-full p-1">
                  <TabsTrigger
                    value="signin"
                    className="data-[state=active]:bg-foreground data-[state=active]:text-background gap-1.5 rounded-full transition-colors duration-200"
                  >
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger
                    value="signup"
                    className="data-[state=active]:bg-foreground data-[state=active]:text-background gap-1.5 rounded-full transition-colors duration-200"
                  >
                    Sign Up
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="animate-fade-up">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email-in">Email</Label>
                      <div className="border-border bg-input/40 focus-within:border-foreground/50 focus-within:ring-foreground/10 flex items-center gap-2 rounded-xl border px-3 transition-colors duration-200 focus-within:ring-4">
                        <Mail className="text-muted-foreground h-4 w-4 shrink-0" />
                        <Input
                          id="email-in"
                          type="email"
                          autoComplete="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email"
                          className="h-11 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="pw-in">Password</Label>
                      <div className="border-border bg-input/40 focus-within:border-foreground/50 focus-within:ring-foreground/10 flex items-center gap-2 rounded-xl border px-3 transition-colors duration-200 focus-within:ring-4">
                        <Lock className="text-muted-foreground h-4 w-4 shrink-0" />
                        <Input
                          id="pw-in"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          className="h-11 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          aria-label={
                            showPassword ? 'Hide password' : 'Show password'
                          }
                          className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      disabled={busy}
                      size="lg"
                      className="glow-primary w-full font-semibold transition-transform active:scale-[0.98]"
                    >
                      {busy ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Signing in...
                        </span>
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="animate-fade-up">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email-up">Email</Label>
                      <div className="border-border bg-input/40 focus-within:border-foreground/50 focus-within:ring-foreground/10 flex items-center gap-2 rounded-xl border px-3 transition-colors duration-200 focus-within:ring-4">
                        <Mail className="text-muted-foreground h-4 w-4 shrink-0" />
                        <Input
                          id="email-up"
                          type="email"
                          autoComplete="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email"
                          className="h-11 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="pw-up">Password</Label>
                      <div className="border-border bg-input/40 focus-within:border-foreground/50 focus-within:ring-foreground/10 flex items-center gap-2 rounded-xl border px-3 transition-colors duration-200 focus-within:ring-4">
                        <Lock className="text-muted-foreground h-4 w-4 shrink-0" />
                        <Input
                          id="pw-up"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          required
                          minLength={6}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          className="h-11 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          aria-label={
                            showPassword ? 'Hide password' : 'Show password'
                          }
                          className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <p className="text-muted-foreground pl-1 text-xs">
                        At least 6 characters.
                      </p>
                    </div>
                    <Button
                      type="submit"
                      disabled={busy}
                      size="lg"
                      className="glow-primary w-full font-semibold transition-transform active:scale-[0.98]"
                    >
                      {busy ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sign up...
                        </span>
                      ) : (
                        'Sign Up'
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </Card>

            <p className="text-muted-foreground mt-4 flex items-start justify-center gap-1.5 text-xs">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              Synced automatically — nothing to export, nothing to lose.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
