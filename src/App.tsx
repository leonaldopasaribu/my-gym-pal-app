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
import Auth from './pages/Auth/Auth.tsx';
import NotFound from './pages/NotFound.tsx';
import { Loading } from './components/ui/loading.tsx';
import Workouts from './pages/Workouts/Workouts.tsx';
import { AICoach } from './components/gym/AICoach.tsx';
import { ExerciseManager } from './components/gym/ExerciseManager.tsx';
import { HomeView } from './components/gym/HomeView.tsx';
import { PRDashboard } from './components/gym/PRDashboard.tsx';
import { ProgressView } from './components/gym/ProgressView.tsx';
import { WorkoutLogger } from './components/gym/WorkoutLogger.tsx';
import { ROUTE_URL } from './constants/route-url.ts';

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
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" />
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <Routes>
            <Route path={ROUTE_URL.AUTH} element={<Auth />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            >
              <Route index element={<HomeView />} />
              <Route
                path={ROUTE_URL.WORKOUT_LOGGER}
                element={<WorkoutLogger />}
              />
              <Route
                path={ROUTE_URL.EXERCISE_MANAGER}
                element={<ExerciseManager />}
              />
              <Route
                path={ROUTE_URL.PROGRESS_VIEW}
                element={<ProgressView />}
              />
              <Route
                path={ROUTE_URL.PERSONAL_RECORDS}
                element={<PRDashboard />}
              />
              <Route path={ROUTE_URL.COACH} element={<AICoach />} />
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
);

export default App;
