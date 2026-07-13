import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import {
  Dumbbell,
  Trophy,
  LayoutDashboard,
  Sparkles,
  MoreHorizontal,
  Rocket,
  Flame,
} from 'lucide-react';
import { ROUTE_URL } from '@/constants/route-url';
import { useState, useEffect, useRef } from 'react';
import Footer from '@/components/Footer';

const NAV_ITEMS = [
  {
    to: ROUTE_URL.DASHBOARD,
    end: true,
    icon: LayoutDashboard,
    label: 'Dashboard',
  },
  { to: ROUTE_URL.WORKOUT_LOGGER, end: false, icon: Flame, label: 'Log' },
  {
    to: ROUTE_URL.EXERCISE_MANAGER,
    end: false,
    icon: Dumbbell,
    label: 'Library',
  },
  {
    to: ROUTE_URL.PROGRESS_VIEW,
    end: false,
    icon: Rocket,
    label: 'Progress',
  },
  { to: ROUTE_URL.PERSONAL_RECORDS, end: false, icon: Trophy, label: 'PRs' },
  { to: ROUTE_URL.AI_COACH, end: false, icon: Sparkles, label: 'Coach' },
];

const MOBILE_NAV_ITEMS = [
  {
    to: ROUTE_URL.DASHBOARD,
    end: true,
    icon: LayoutDashboard,
    label: 'Dashboard',
  },
  {
    to: ROUTE_URL.EXERCISE_MANAGER,
    end: false,
    icon: Dumbbell,
    label: 'Library',
  },
  {
    to: ROUTE_URL.PROGRESS_VIEW,
    end: false,
    icon: Rocket,
    label: 'Progress',
  },
];

const MORE_ITEMS = [
  { to: ROUTE_URL.PERSONAL_RECORDS, end: false, icon: Trophy, label: 'PRs' },
];

type IndicatorRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

const Index = () => {
  const location = useLocation();
  const isDashboardPage = location.pathname === ROUTE_URL.DASHBOARD;
  const isAiCoachPage = location.pathname === ROUTE_URL.AI_COACH;
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  const isMoreActive = MORE_ITEMS.some((item) =>
    item.end
      ? location.pathname === item.to
      : location.pathname.startsWith(item.to)
  );

  // ── Desktop nav: sliding pill indicator ──────────────────────────────────
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [indicator, setIndicator] = useState<IndicatorRect | null>(null);

  const activeNavItem =
    NAV_ITEMS.find((item) =>
      item.end
        ? location.pathname === item.to
        : location.pathname.startsWith(item.to)
    ) ?? NAV_ITEMS[0];

  useEffect(() => {
    const measure = () => {
      const el = itemRefs.current[activeNavItem.to];
      if (el) {
        setIndicator({
          left: el.offsetLeft,
          top: el.offsetTop,
          width: el.offsetWidth,
          height: el.offsetHeight,
        });
      }
    };
    // wait a tick so fonts/layout have settled before first measurement
    const raf = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
    };
  }, [activeNavItem.to, location.pathname]);

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="container py-5 pb-28 sm:py-8 md:pb-8">
        {/* Hero — only on home route */}
        {isDashboardPage && (
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
        <nav className="border-border/60 bg-secondary/40 relative mx-auto mb-5 hidden h-auto w-fit flex-wrap justify-center rounded-[50px] border p-1 sm:mb-6 md:flex">
          {indicator && (
            <div
              className="bg-primary pointer-events-none absolute rounded-full transition-all duration-300 ease-out"
              style={{
                left: indicator.left,
                top: indicator.top,
                width: indicator.width,
                height: indicator.height,
              }}
            />
          )}
          {NAV_ITEMS.map(({ to, end, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              ref={(el) => {
                itemRefs.current[to] = el;
              }}
              className={({ isActive }) =>
                [
                  'relative z-10 flex items-center gap-2 rounded-[50px] px-3 py-2 text-sm font-medium transition-colors duration-200',
                  isActive
                    ? 'text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                ].join(' ')
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Page content */}
        <Outlet />

        {/* Mobile floating coach bubble */}
        {!isAiCoachPage && (
          <div className="fixed right-4 bottom-20 z-50 md:hidden">
            <div className="bg-primary/40 absolute inset-0 animate-ping rounded-full opacity-20" />
            <NavLink
              to={ROUTE_URL.AI_COACH}
              className="group from-primary via-primary to-primary/80 text-primary-foreground relative grid h-14 w-14 place-items-center rounded-full bg-linear-to-br shadow-[0_0_20px_rgba(var(--primary),0.4)] transition-all hover:scale-110 active:scale-90"
              aria-label="Open AI Coach"
            >
              <div className="absolute inset-0 rounded-full border-2 border-white/20 transition-colors group-hover:border-white/40" />
              <Sparkles className="animate-pulse-slow h-6 w-6" />
              <span className="border-background bg-destructive absolute -top-1 -right-1 rounded-full border-2 px-1.5 py-0.5 text-[8px] font-bold">
                AI Coach
              </span>
            </NavLink>
          </div>
        )}

        <Footer />
      </main>

      {/* More drawer backdrop */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* More drawer */}
      <div
        className={[
          'border-border/60 bg-background/95 fixed inset-x-0 z-40 rounded-t-2xl border-t backdrop-blur-xl transition-transform duration-300 md:hidden',
          moreOpen ? 'translate-y-0' : 'translate-y-full',
        ].join(' ')}
        style={{ bottom: '64px' }}
      >
        <div className="flex justify-center pt-2 pb-1">
          <div className="bg-border h-1 w-9 rounded-full" />
        </div>
        <p className="text-muted-foreground px-5 pb-2 font-mono text-[10px] tracking-[0.2em] uppercase">
          More
        </p>
        <div className="border-border/40 grid grid-cols-3 border-t">
          {MORE_ITEMS.map(({ to, end, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center justify-center gap-1.5 py-4 text-[11px] tracking-wider uppercase transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="h-6 w-6" />
                  <span>{label}</span>
                  {isActive && (
                    <span className="bg-primary h-1 w-1 rounded-full" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
        <div
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          className="h-2"
        />
      </div>

      {/* Mobile bottom nav (<768px) */}
      <nav
        className="border-border/60 bg-background fixed inset-x-0 bottom-0 z-50 flex h-18 items-start justify-between border-t px-2 pt-2 md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Home */}
        <NavLink
          to={MOBILE_NAV_ITEMS[0].to}
          end={MOBILE_NAV_ITEMS[0].end}
          className="flex flex-1 flex-col items-center gap-1 text-[11px] transition-colors"
        >
          {({ isActive }) => (
            <>
              <span
                className={[
                  'grid h-8 w-8 place-items-center rounded-full transition-colors duration-200',
                  isActive
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground',
                ].join(' ')}
              >
                <LayoutDashboard className="h-5 w-5" />
              </span>
              <span
                className={
                  isActive
                    ? 'text-primary font-bold'
                    : 'text-muted-foreground font-medium'
                }
              >
                Dashboard
              </span>
            </>
          )}
        </NavLink>

        {/* Library */}
        <NavLink
          to={MOBILE_NAV_ITEMS[1].to}
          end={MOBILE_NAV_ITEMS[1].end}
          className="flex flex-1 flex-col items-center gap-1 text-[11px] transition-colors"
        >
          {({ isActive }) => (
            <>
              <span
                className={[
                  'grid h-8 w-8 place-items-center rounded-full transition-colors duration-200',
                  isActive
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground',
                ].join(' ')}
              >
                <Dumbbell className="h-5 w-5" />
              </span>
              <span
                className={
                  isActive
                    ? 'text-primary font-bold'
                    : 'text-muted-foreground font-medium'
                }
              >
                Library
              </span>
            </>
          )}
        </NavLink>

        {/* FAB — Check In style, besar + glossy ring, nongol ke atas bar */}
        <div className="relative flex flex-1 flex-col items-center">
          <div className="relative -mt-6 h-14 w-14">
            {/* Glow blur statis di belakang — bikin cincin "menyala" lembut */}
            <div className="bg-primary/50 absolute inset-0 -z-10 scale-50 rounded-full blur-lg" />

            <NavLink
              to={ROUTE_URL.WORKOUT_LOGGER}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="from-primary/60 via-primary to-primary relative flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br p-1.25 shadow-[0_8px_20px_-2px_rgba(var(--primary),0.55)] transition-all duration-200 hover:-translate-y-1 active:scale-95"
              aria-label="Log workout"
            >
              {/* Badan tombol solid di dalam ring */}
              <div className="bg-primary text-primary-foreground relative flex h-full w-full items-center justify-center rounded-full">
                {/* Highlight glossy pojok kiri-atas */}
                <div className="pointer-events-none absolute inset-0 rounded-full bg-linear-to-br from-white/35 via-transparent to-transparent" />
                <Flame className="relative z-10 h-6 w-6 transition-transform duration-200 group-hover:rotate-90" />
              </div>
            </NavLink>
          </div>

          <span
            className={[
              'mt-2 text-[11px] tracking-wide transition-colors',
              location.pathname.startsWith(ROUTE_URL.WORKOUT_LOGGER)
                ? 'text-primary font-bold'
                : 'text-muted-foreground font-semibold',
            ].join(' ')}
          >
            Log
          </span>
        </div>

        {/* Progress */}
        <NavLink
          to={MOBILE_NAV_ITEMS[2].to}
          end={MOBILE_NAV_ITEMS[2].end}
          className="flex flex-1 flex-col items-center gap-1 text-[11px] transition-colors"
        >
          {({ isActive }) => (
            <>
              <span
                className={[
                  'grid h-8 w-8 place-items-center rounded-full transition-colors duration-200',
                  isActive
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground',
                ].join(' ')}
              >
                <Rocket className="h-5 w-5" />
              </span>
              <span
                className={
                  isActive
                    ? 'text-primary font-bold'
                    : 'text-muted-foreground font-medium'
                }
              >
                Progress
              </span>
            </>
          )}
        </NavLink>

        {/* More */}
        <button
          onClick={() => setMoreOpen((prev) => !prev)}
          className="flex flex-1 flex-col items-center gap-1 text-[11px] transition-colors"
          aria-label="More menu"
        >
          <span
            className={[
              'grid h-8 w-8 place-items-center rounded-full transition-colors duration-200',
              isMoreActive || moreOpen
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground',
            ].join(' ')}
          >
            <MoreHorizontal className="h-5 w-5" />
          </span>
          <span
            className={
              isMoreActive || moreOpen
                ? 'text-primary font-bold'
                : 'text-muted-foreground font-medium'
            }
          >
            More
          </span>
        </button>
      </nav>
    </div>
  );
};

export default Index;
