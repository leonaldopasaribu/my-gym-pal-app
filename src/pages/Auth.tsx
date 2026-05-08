import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

export default function Auth() {
  const navigate = useNavigate();
  const { session, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    toast.success('Account created successfully 💪');
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
    <div className="min-h-screen grid place-items-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="h-14 w-14 grid place-items-center rounded-2xl bg-gradient-to-br from-foreground/10 to-foreground/[0.02] border border-border mb-3 shadow-card">
            <Dumbbell className="h-7 w-7 text-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight flex items-center gap-2">
            <span>My</span>
            <span className="text-gradient-primary">Gym</span>
            <span>Pal</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Train · Track · Transform
          </p>
        </div>

        <Card className="p-5 surface border-border/60">
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email-in">Email</Label>
                  <Input
                    id="email-in"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pw-in">Password</Label>
                  <Input
                    id="pw-in"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={busy}
                  size="lg"
                  className="w-full font-semibold glow-primary"
                >
                  {busy ? 'Processing...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email-up">Email</Label>
                  <Input
                    id="email-up"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pw-up">Password</Label>
                  <Input
                    id="pw-up"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={busy}
                  size="lg"
                  className="w-full font-semibold glow-primary"
                >
                  {busy ? 'Processing...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Your data is securely stored in the cloud — never lost again 🔒
        </p>
      </div>
    </div>
  );
}
