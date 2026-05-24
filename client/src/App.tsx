import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LogPage from "@/pages/log";
import PlanPage from "@/pages/plan";
import MusclesPage from "@/pages/muscles";
import HistoryPage from "@/pages/history";
import ExportPage from "@/pages/export";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider, useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { LockScreen } from "@/components/LockScreen";

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={LogPage} />
      <Route path="/plan" component={PlanPage} />
      <Route path="/muscles" component={MusclesPage} />
      <Route path="/history" component={HistoryPage} />
      <Route path="/export" component={ExportPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Gate() {
  const { unlocked } = useAuth();
  if (!unlocked) return <LockScreen />;
  return (
    <AppShell>
      <AppRouter />
    </AppShell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router hook={useHashLocation}>
              <Gate />
            </Router>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
