
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Vehicles from "./pages/Vehicles";
import FuelReport from "./pages/FuelReport";
import FuelTheft from "./pages/FuelTheft";
import SmSWhatsapp from "./pages/SMSNotifications";
import Whatsapp from "./pages/WhatsAppNotifications";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/vehicles" 
            element={
              <ProtectedRoute>
                <Vehicles />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/fuel-report" 
            element={
              <ProtectedRoute>
                <FuelReport />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/fuel-theft" 
            element={
              <ProtectedRoute>
                <FuelTheft />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/whatsapp" 
            element={
              <ProtectedRoute>
                <Whatsapp />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/sms-notifications" 
            element={
              <ProtectedRoute>
                <SmSWhatsapp />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
