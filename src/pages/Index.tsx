import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppHeader } from '@/components/gym/AppHeader';
import { ExerciseManager } from '@/components/gym/ExerciseManager';
import { WorkoutLogger } from '@/components/gym/WorkoutLogger';
import { ProgressView } from '@/components/gym/ProgressView';
import { PRDashboard } from '@/components/gym/PRDashboard';
import { HomeView } from '@/components/gym/HomeView';
import {
  Dumbbell,
  ListChecks,
  LineChart,
  Trophy,
  Home,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { AICoach } from '@/components/gym/AICoach';

const Index = () => {
  const [tab, setTab] = useState('home');

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="container py-5 pb-28 sm:py-8 md:pb-8">
        {tab === 'home' && (
          <section className="mb-5 animate-fade-up sm:mb-8">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.3em] text-primary sm:text-xs">
              Train · Track · Progress
            </p>
            <h1 className="max-w-2xl font-display text-3xl font-bold leading-[1.05] sm:text-5xl">
              Lift heavier{' '}
              <span className="text-gradient-primary">every week.</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:mt-3 sm:text-base">
              Custom exercises, log sets/reps/weight, and visualize progressive
              overload.
            </p>
          </section>
        )}

        <Tabs
          value={tab}
          onValueChange={setTab}
          className="space-y-5 sm:space-y-6"
        >
          {/* Tablet & desktop top tabs (>=768px) */}
          <TabsList className="hidden h-auto flex-wrap border border-border/60 bg-secondary/40 p-1 md:flex">
            <TabsTrigger
              value="home"
              className="gap-2 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Home className="h-4 w-4" /> Home
            </TabsTrigger>
            <TabsTrigger
              value="log"
              className="gap-2 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <ListChecks className="h-4 w-4" /> Log
            </TabsTrigger>
            <TabsTrigger
              value="library"
              className="gap-2 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Dumbbell className="h-4 w-4" /> Library
            </TabsTrigger>
            <TabsTrigger
              value="progress"
              className="gap-2 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <LineChart className="h-4 w-4" /> Progress
            </TabsTrigger>
            <TabsTrigger
              value="prs"
              className="gap-2 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Trophy className="h-4 w-4" /> PRs
            </TabsTrigger>
            <TabsTrigger
              value="coach"
              className="gap-2 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Sparkles className="h-4 w-4" /> Coach
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="mt-0">
            <HomeView />
          </TabsContent>
          <TabsContent value="log" className="mt-0">
            <WorkoutLogger />
          </TabsContent>
          <TabsContent value="library" className="mt-0">
            <ExerciseManager />
          </TabsContent>
          <TabsContent value="progress" className="mt-0">
            <ProgressView />
          </TabsContent>
          <TabsContent value="prs" className="mt-0">
            <PRDashboard />
          </TabsContent>
          <TabsContent value="coach" className="mt-0">
            <AICoach />
          </TabsContent>

          {/* Mobile bottom nav (<768px) */}
          <TabsList
            className="fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-5 gap-0 rounded-none border-t border-border/60 bg-background/95 p-0 backdrop-blur-xl md:hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <MobileTab
              value="home"
              icon={<Home className="h-5 w-5" />}
              label="Home"
            />
            <MobileTab
              value="log"
              icon={<ListChecks className="h-5 w-5" />}
              label="Log"
            />
            <MobileTab
              value="library"
              icon={<Dumbbell className="h-5 w-5" />}
              label="Library"
            />
            <MobileTab
              value="progress"
              icon={<LineChart className="h-5 w-5" />}
              label="Progress"
            />
            <MobileTab
              value="prs"
              icon={<Trophy className="h-5 w-5" />}
              label="PRs"
            />
          </TabsList>
          {/* Mobile floating coach bubble */}
          {tab !== 'coach' && (
            <div className="fixed bottom-20 right-4 z-50 md:hidden">
              {/* Outer Glow/Pulse Effect */}
              <div className="absolute inset-0 animate-ping rounded-full bg-primary/40 opacity-20" />

              <button
                type="button"
                onClick={() => setTab('coach')}
                className="group relative grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.4)] transition-all hover:scale-110 active:scale-90"
                aria-label="Open AI Coach"
              >
                <div className="absolute inset-0 rounded-full border-2 border-white/20 transition-colors group-hover:border-white/40" />
                <Sparkles className="animate-pulse-slow h-7 w-7" />

                {/* Optional: Small 'New' or 'AI' Badge */}
                <span className="absolute -right-1 -top-1 rounded-full border-2 border-background bg-destructive px-1.5 py-0.5 text-[8px] font-bold">
                  AI Coach
                </span>
              </button>
            </div>
          )}
        </Tabs>

        <footer className="mt-10 border-t border-border/60 pt-6 text-center font-mono text-[11px] text-muted-foreground sm:mt-16">
          MY GYM PAL · Your data is securely stored in the cloud
        </footer>
      </main>
    </div>
  );
};

function MobileTab({
  value,
  icon,
  label,
}: {
  value: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <TabsTrigger
      value={value}
      className="h-full flex-col gap-0.5 rounded-none border-t-2 border-transparent text-[10px] uppercase tracking-wider text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
    >
      {icon}
      {label}
    </TabsTrigger>
  );
}

export default Index;
