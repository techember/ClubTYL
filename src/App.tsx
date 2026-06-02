import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

import { Login } from "@/pages/Login";
import { Dashboard } from "@/pages/Dashboard";
import { UserManagement } from "@/pages/UserManagement";
import { WalletManagement } from "@/pages/WalletManagement";
import { CommissionSettings } from "@/pages/CommissionSettings";
import { ServiceControl } from "@/pages/serviceControl";
import Reports from "@/pages/Reports";
import { NotificationManagement } from "@/pages/NotificationManagement";
import NotFound from "./pages/NotFound";
import { AffiliateStore } from "@/pages/AffiliateStore";
import { Banner } from "@/pages/Master/Banner";
import { BottomBanner } from "@/pages/Master/BottomBanner";
import { HomeNote } from "@/pages/Master/HomeNote";
import { ApiProvider } from "@/pages/Master/ApiProvider";
import { NewsManagement } from "@/pages/NewsManagement";

const queryClient = new QueryClient();

const AdminRoutes = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/users" element={<UserManagement />} />
      <Route path="/wallet" element={<WalletManagement />} />
      <Route path="/commission" element={<CommissionSettings />} />
      <Route path="/services" element={<ServiceControl />} />
      <Route path="/master/services" element={<ServiceControl />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/notifications" element={<NotificationManagement />} />
      <Route path="/affiliate-store" element={<AffiliateStore />} />
      <Route path="/master/banner" element={<Banner />} />
      <Route path="/master/bottom-banner" element={<BottomBanner />} />
      <Route path="/master/home-note" element={<HomeNote />} />
      <Route path="/master/api-provider" element={<ApiProvider />} />
      <Route path="/news" element={<NewsManagement />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<AdminRoutes />} />
        </Routes>

      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
