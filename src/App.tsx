
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, AuthGuard } from "@/globallogin/AuthContext";
import LoginPage from "@/globallogin/LoginPage";
import SSOCallbackPage from "@/globallogin/SSOCallbackPage";
import PortalSelectionPage from "@/globallogin/PortalSelectionPage";

import NotFound from "./pages/NotFound";
import GlobalUserManagementPage from "@/globallogin/user-management/GlobalUserManagementPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename="/globallogintest">
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/sso/callback" element={<SSOCallbackPage />} />

            {/* Protected */}
            <Route element={<AuthGuard />}>
              <Route path="/portals" element={<PortalSelectionPage />} />
              <Route path="/user-management" element={<GlobalUserManagementPage />} />
            </Route>

            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
