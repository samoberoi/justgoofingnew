import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AppProvider } from "./app/store";
import { StoreSelectionProvider } from "./app/hooks/useStoreSelection";
import { OpsAuthProvider, useAuth } from "./ops/hooks/useAuth";
import PageTransition from "./app/components/PageTransition";
import SplashScreen from "./app/pages/SplashScreen";
import LoginPage from "./app/pages/LoginPage";
import WelcomePage from "./app/pages/WelcomePage";
import DashboardPage from "./app/pages/DashboardPage";
import MenuPage from "./app/pages/MenuPage";
import BuyPackPage from "./app/pages/BuyPackPage";
import MyQRPage from "./app/pages/MyQRPage";
import ExtendSessionPage from "./app/pages/ExtendSessionPage";
import BookingPage from "./app/pages/BookingPage";
import BookingConfirmedPage from "./app/pages/BookingConfirmedPage";
import WalletPage from "./app/pages/WalletPage";
import OrdersPage from "./app/pages/OrdersPage";
import TiersPage from "./app/pages/TiersPage";
import StreakPage from "./app/pages/StreakPage";
import ProfilePage from "./app/pages/ProfilePage";
import KidsPage from "./app/pages/KidsPage";
import NotificationsPage from "./app/pages/NotificationsPage";
import PaymentPage from "./app/pages/PaymentPage";

// Ops pages
import SuperAdminDashboard from "./ops/pages/SuperAdminDashboard";
import LoyaltyEnginePage from "./ops/pages/LoyaltyEnginePage";
import StoreManagerDashboard from "./ops/pages/StoreManagerDashboard";
import OpsOrdersPage from "./ops/pages/OpsOrdersPage";
import OpsMenuPage from "./ops/pages/OpsMenuPage";
import OpsAnalyticsPage from "./ops/pages/OpsAnalyticsPage";
import OpsSettingsPage from "./ops/pages/OpsSettingsPage";
import OpsCustomersPage from "./ops/pages/OpsCustomersPage";
import KitchenView from "./ops/pages/KitchenView";
import DeliveryView from "./ops/pages/DeliveryView";
import StaffCheckInPage from "./ops/pages/StaffCheckInPage";

const queryClient = new QueryClient();

const OpsRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-coral border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !role) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(role)) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

const T = ({ children }: { children: React.ReactNode }) => <PageTransition>{children}</PageTransition>;

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/login" element={<T><LoginPage /></T>} />

        {/* Customer routes */}
        <Route path="/welcome" element={<T><WelcomePage /></T>} />
        <Route path="/home" element={<T><DashboardPage /></T>} />
        <Route path="/menu" element={<T><MenuPage /></T>} />
        <Route path="/buy-pack/:packId" element={<T><BuyPackPage /></T>} />
        <Route path="/my-qr" element={<T><MyQRPage /></T>} />
        <Route path="/extend-session/:sessionId" element={<T><ExtendSessionPage /></T>} />
        <Route path="/book/:itemId" element={<T><BookingPage /></T>} />
        <Route path="/booking-confirmed/:bookingId" element={<T><BookingConfirmedPage /></T>} />
        <Route path="/wallet" element={<T><WalletPage /></T>} />
        <Route path="/orders" element={<T><OrdersPage /></T>} />
        <Route path="/tiers" element={<T><TiersPage /></T>} />
        <Route path="/streak" element={<T><StreakPage /></T>} />
        <Route path="/profile" element={<T><ProfilePage /></T>} />
        <Route path="/kids" element={<T><KidsPage /></T>} />
        <Route path="/notifications" element={<T><NotificationsPage /></T>} />
        <Route path="/payment" element={<T><PaymentPage /></T>} />

        {/* Ops routes */}
        <Route path="/dashboard" element={
          <OpsRoute allowedRoles={['super_admin', 'store_manager']}>
            <DashboardSwitch />
          </OpsRoute>
        } />
        <Route path="/check-in" element={
          <OpsRoute allowedRoles={['super_admin', 'store_manager']}>
            <StaffCheckInPage />
          </OpsRoute>
        } />
        <Route path="/ops-orders" element={
          <OpsRoute allowedRoles={['super_admin', 'store_manager']}>
            <OpsOrdersPage />
          </OpsRoute>
        } />
        <Route path="/ops-menu" element={
          <OpsRoute allowedRoles={['super_admin', 'store_manager']}>
            <OpsMenuPage />
          </OpsRoute>
        } />
        <Route path="/customers" element={
          <OpsRoute allowedRoles={['super_admin', 'store_manager']}>
            <OpsCustomersPage />
          </OpsRoute>
        } />
        <Route path="/analytics" element={
          <OpsRoute allowedRoles={['super_admin']}>
            <OpsAnalyticsPage />
          </OpsRoute>
        } />
        <Route path="/settings" element={
          <OpsRoute allowedRoles={['super_admin']}>
            <OpsSettingsPage />
          </OpsRoute>
        } />
        <Route path="/loyalty" element={
          <OpsRoute allowedRoles={['super_admin']}>
            <LoyaltyEnginePage />
          </OpsRoute>
        } />
        <Route path="/kitchen" element={
          <OpsRoute allowedRoles={['kitchen_manager']}>
            <KitchenView />
          </OpsRoute>
        } />
        <Route path="/deliveries" element={
          <OpsRoute allowedRoles={['delivery_partner']}>
            <DeliveryView />
          </OpsRoute>
        } />

        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <StoreSelectionProvider>
          <OpsAuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AnimatedRoutes />
            </BrowserRouter>
          </OpsAuthProvider>
        </StoreSelectionProvider>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

const DashboardSwitch = () => {
  const { role } = useAuth();
  if (role === 'super_admin') return <SuperAdminDashboard />;
  return <StoreManagerDashboard />;
};

export default App;
