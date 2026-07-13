import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider, useAuth } from '@/hooks/use-auth.tsx';
import Index from './pages/Index.tsx';
import AuthPage from './pages/Auth/AuthPage.tsx';
import NotFound from './pages/NotFound.tsx';
import { Loading } from './components/ui/loading.tsx';
import Workouts from './pages/Workouts/WorkoutsPage.tsx';
import { ROUTE_URL } from './constants/route-url.ts';
import { Analytics } from '@vercel/analytics/react';
import { AICoachPage } from './pages/AICoach/AICoachPage.tsx';
import { DashboardPage } from './pages/Dashboard/DashboardPage.tsx';
import { ExerciseManagerPage } from './pages/ExerciseManager/ExerciseManagerPage.tsx';
import { PersonalRecordsPage } from './pages/PersonalRecords/PersonalRecordsPage.tsx';
import { ProgressViewPage } from './pages/ProgressView/ProgressViewPage.tsx';
import { WorkoutLoggerPage } from './pages/WorkoutLogger/WorkoutLoggerPage.tsx';

const queryClient = new QueryClient();

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  if (isLoading) {
    return <Loading fullPage label="Loading your gym..." size="lg" />;
  }
  if (!session) return <Navigate to={ROUTE_URL.AUTH} replace />;
  return <>{children}</>;
}

const App = () => (
  <>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-center" />
        <BrowserRouter>
          <ScrollToTop />
          <AuthProvider>
            <Routes>
              <Route path={ROUTE_URL.AUTH} element={<AuthPage />} />
              <Route
                path={ROUTE_URL.DASHBOARD}
                element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route
                  path={ROUTE_URL.WORKOUT_LOGGER}
                  element={<WorkoutLoggerPage />}
                />
                <Route
                  path={ROUTE_URL.EXERCISE_MANAGER}
                  element={<ExerciseManagerPage />}
                />
                <Route
                  path={ROUTE_URL.PROGRESS_VIEW}
                  element={<ProgressViewPage />}
                />
                <Route
                  path={ROUTE_URL.PERSONAL_RECORDS}
                  element={<PersonalRecordsPage />}
                />
                <Route path={ROUTE_URL.AI_COACH} element={<AICoachPage />} />
              </Route>

              <Route
                path={ROUTE_URL.WORKOUTS}
                element={
                  <ProtectedRoute>
                    <Workouts />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>

    <Analytics />
  </>
);

export default App;
