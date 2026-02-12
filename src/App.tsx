import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import Index from "./pages/Index";
import SystemStatus from "./pages/SystemStatus";
import LedControl from "./pages/LedControl";
import MotorControl from "./pages/MotorControl";
import SettingsPage from "./pages/SettingsPage";
import FullScreenMatch from "./pages/FullScreenMatch";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/status" element={<SystemStatus />} />
            <Route path="/leds" element={<LedControl />} />
            <Route path="/motor" element={<MotorControl />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="/fullscreen" element={<FullScreenMatch />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
