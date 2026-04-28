import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppHeader } from '@/components/gym/AppHeader';
import { ExerciseManager } from '@/components/gym/ExerciseManager';
import { WorkoutLogger } from '@/components/gym/WorkoutLogger';
import { ProgressView } from '@/components/gym/ProgressView';
import { PRDashboard } from '@/components/gym/PRDashboard';
import { Dumbbell, ListChecks, LineChart, Trophy } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="container py-5 sm:py-8 pb-28 sm:pb-8">
        <section className="mb-5 sm:mb-8 animate-fade-up">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary font-mono mb-2">
            Train · Track · Progress
          </p>
          <h1 className="font-display text-3xl sm:text-5xl font-bold leading-[1.05] max-w-2xl">
            Lift heavier{' '}
            <span className="text-gradient-primary">every week.</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2 sm:mt-3 max-w-xl">
            Custom latihan, log sets/reps/beban, dan visualisasi progressive
            overload.
          </p>
        </section>

        <Tabs defaultValue="log" className="space-y-5 sm:space-y-6">
          {/* Desktop / tablet tabs */}
          <TabsList className="hidden sm:flex bg-secondary/40 border border-border/60 p-1 h-auto flex-wrap">
            <TabsTrigger
              value="log"
              className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <ListChecks className="h-4 w-4" /> Log
            </TabsTrigger>
            <TabsTrigger
              value="library"
              className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Dumbbell className="h-4 w-4" /> Library
            </TabsTrigger>
            <TabsTrigger
              value="progress"
              className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <LineChart className="h-4 w-4" /> Progress
            </TabsTrigger>
            <TabsTrigger
              value="prs"
              className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Trophy className="h-4 w-4" /> PRs
            </TabsTrigger>
          </TabsList>

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

          {/* Mobile bottom nav */}
          <TabsList
            className="sm:hidden fixed bottom-0 inset-x-0 z-40 h-16 rounded-none border-t border-border/60 bg-background/95 backdrop-blur-xl grid grid-cols-4 gap-0 p-0"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
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
        </Tabs>

        <footer className="mt-10 sm:mt-16 pt-6 border-t border-border/60 text-[11px] text-muted-foreground font-mono text-center">
          IRON LOG · Data tersimpan lokal di browser kamu
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
