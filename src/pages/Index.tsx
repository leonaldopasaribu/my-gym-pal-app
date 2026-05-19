import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { AppHeader } from '@/components/gym/AppHeader';
import {
  Dumbbell,
  ListChecks,
  LineChart,
  Trophy,
  Home,
  Sparkles,
} from 'lucide-react';
import { ROUTE_URL } from '@/constants/route-url';

const NAV_ITEMS = [
  { to: ROUTE_URL.HOME, end: true, icon: Home, label: 'Home' },
  { to: ROUTE_URL.WORKOUT_LOGGER, end: false, icon: ListChecks, label: 'Log' },
  {
    to: ROUTE_URL.EXERCISE_MANAGER,
    end: false,
    icon: Dumbbell,
    label: 'Library',
  },
  {
    to: ROUTE_URL.PROGRESS_VIEW,
    end: false,
    icon: LineChart,
    label: 'Progress',
  },
  { to: ROUTE_URL.PERSONAL_RECORDS, end: false, icon: Trophy, label: 'PRs' },
  { to: ROUTE_URL.COACH, end: false, icon: Sparkles, label: 'Coach' },
];

const desktopLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex items-center gap-2 rounded-[50px] px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-primary text-primary-foreground'
      : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
  ].join(' ');

const Index = () => {
  const location = useLocation();
  const isHomePage = location.pathname === ROUTE_URL.HOME;
  const isCoachPage = location.pathname === ROUTE_URL.COACH;

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="container py-5 pb-28 sm:py-8 md:pb-8">
        {/* Hero — only on home route */}
        {isHomePage && (
          <section className="animate-fade-up mb-5 sm:mb-8">
            <p className="text-primary mb-2 font-mono text-[10px] tracking-[0.3em] uppercase sm:text-xs">
              Train · Track · Progress
            </p>
            <h1 className="font-display max-w-2xl text-3xl leading-[1.05] font-bold sm:text-5xl">
              Lift heavier{' '}
              <span className="text-gradient-primary">every week.</span>
            </h1>
            <p className="text-muted-foreground mt-2 max-w-xl text-sm sm:mt-3 sm:text-base">
              Custom exercises, log sets/reps/weight, and visualize progressive
              overload.
            </p>
          </section>
        )}

        {/* Desktop top nav (≥768px) */}
        <nav className="border-border/60 bg-secondary/40 mx-auto mb-5 hidden h-auto w-fit flex-wrap justify-center rounded-[50px] border p-1 sm:mb-6 md:flex">
          {NAV_ITEMS.map(({ to, end, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={end} className={desktopLinkClass}>
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Page content */}
        <Outlet />

        {/* Mobile floating coach bubble */}
        {!isCoachPage && (
          <div className="fixed right-4 bottom-20 z-50 md:hidden">
            <div className="bg-primary/40 absolute inset-0 animate-ping rounded-full opacity-20" />
            <NavLink
              to="/coach"
              className="group from-primary via-primary to-primary/80 text-primary-foreground relative grid h-14 w-14 place-items-center rounded-full bg-linear-to-br shadow-[0_0_20px_rgba(var(--primary),0.4)] transition-all hover:scale-110 active:scale-90"
              aria-label="Open AI Coach"
            >
              <div className="absolute inset-0 rounded-full border-2 border-white/20 transition-colors group-hover:border-white/40" />
              <Sparkles className="animate-pulse-slow h-7 w-7" />
              <span className="border-background bg-destructive absolute -top-1 -right-1 rounded-full border-2 px-1.5 py-0.5 text-[8px] font-bold">
                AI Coach
              </span>
            </NavLink>
          </div>
        )}

        <footer className="border-border/60 text-muted-foreground mt-10 border-t pt-6 text-center font-mono text-[11px] sm:mt-16">
          MY GYM PAL · Your data is securely stored in the cloud
        </footer>
      </main>

      {/* Mobile bottom nav (<768px) — 5 items, coach pakai floating bubble */}
      <nav
        className="border-border/60 bg-background/95 fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-5 gap-0 border-t backdrop-blur-xl md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {NAV_ITEMS.filter((n) => n.label !== 'Coach').map(
          ({ to, end, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  'flex h-full flex-col items-center justify-center gap-0.5 border-t-2 text-[10px] tracking-wider uppercase transition-colors',
                  isActive
                    ? 'border-primary text-primary'
                    : 'text-muted-foreground border-transparent',
                ].join(' ')
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          )
        )}
      </nav>
    </div>
  );
};

export default Index;
