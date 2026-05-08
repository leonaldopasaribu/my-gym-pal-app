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
      <main className="container py-5 sm:py-8 pb-28 md:pb-8">
        {tab === 'home' && (
          <section className="mb-5 sm:mb-8 animate-fade-up">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary font-mono mb-2">
              Train · Track · Progress
            </p>
            <h1 className="font-display text-3xl sm:text-5xl font-bold leading-[1.05] max-w-2xl">
              Lift heavier{' '}
              <span className="text-gradient-primary">every week.</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2 sm:mt-3 max-w-xl">
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
          <TabsList className="hidden md:flex bg-secondary/40 border border-border/60 p-1 h-auto flex-wrap">
            <TabsTrigger
              value="home"
              className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2"
            >
              <Home className="h-4 w-4" /> Home
            </TabsTrigger>
            <TabsTrigger
              value="log"
              className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2"
            >
              <ListChecks className="h-4 w-4" /> Log
            </TabsTrigger>
            <TabsTrigger
              value="library"
              className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2"
            >
              <Dumbbell className="h-4 w-4" /> Library
            </TabsTrigger>
            <TabsTrigger
              value="progress"
              className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2"
            >
              <LineChart className="h-4 w-4" /> Progress
            </TabsTrigger>
            <TabsTrigger
              value="prs"
              className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2"
            >
              <Trophy className="h-4 w-4" /> PRs
            </TabsTrigger>
            <TabsTrigger
              value="coach"
              className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2"
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
            className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 rounded-none border-t border-border/60 bg-background/95 backdrop-blur-xl grid grid-cols-5 gap-0 p-0"
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
            <div className="md:hidden fixed bottom-20 right-4 z-50">
              {/* Outer Glow/Pulse Effect */}
              <div className="absolute inset-0 rounded-full bg-primary/40 animate-ping opacity-20" />

              <button
                type="button"
                onClick={() => setTab('coach')}
                className="relative h-14 w-14 rounded-full bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.4)] transition-all grid place-items-center hover:scale-110 active:scale-90 group"
                aria-label="Open AI Coach"
              >
                <div className="absolute inset-0 rounded-full border-2 border-white/20 group-hover:border-white/40 transition-colors" />
                <Sparkles className="h-7 w-7 animate-pulse-slow" />

                {/* Optional: Small 'New' or 'AI' Badge */}
                <span className="absolute -top-1 -right-1 bg-destructive text-[8px] font-bold px-1.5 py-0.5 rounded-full border-2 border-background">
                  AI Coach
                </span>
              </button>
            </div>
          )}
        </Tabs>

        <footer className="mt-10 sm:mt-16 pt-6 border-t border-border/60 text-[11px] text-muted-foreground font-mono text-center">
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
      className="flex-col gap-0.5 h-full rounded-none text-[10px] uppercase tracking-wider text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-t-2 border-transparent data-[state=active]:border-primary"
    >
      {icon}
      {label}
    </TabsTrigger>
  );
}

export default Index;
