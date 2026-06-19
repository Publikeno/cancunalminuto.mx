import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Categoria from "./pages/Categoria";
import Dashboard from "./pages/Dashboard";
import Fuentes from "./pages/Fuentes";
import Home from "./pages/Home";

function Router() {
  // Si el usuario accede desde admin.cancunalminuto.mx, mostrar siempre el Dashboard
  const isAdminSubdomain =
    typeof window !== "undefined" &&
    window.location.hostname.startsWith("admin.");

  if (isAdminSubdomain) {
    return <Dashboard />;
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/categoria/:slug" component={Categoria} />
      <Route path="/fuentes" component={Fuentes} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
