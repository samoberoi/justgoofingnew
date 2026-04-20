import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./app/store";
import { StoreSelectionProvider } from "./app/hooks/useStoreSelection";
import { OpsAuthProvider, useAuth } from "./ops/hooks/useAuth";
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
import NotificationsPage from "./app/pages/NotificationsPage";

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
const queryClient = new QueryClient();

// Ops route guard component
const OpsRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !role) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(role)) return <Navigate to="/login" replace />;

  return <>{children}</>;
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
            <Routes>
              {/* Shared entry */}
              <Route path="/" element={<SplashScreen />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Customer routes */}
              <Route path="/welcome" element={<WelcomePage />} />
              <Route path="/home" element={<DashboardPage />} />
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/buy-pack/:packId" element={<BuyPackPage />} />
              <Route path="/my-qr" element={<MyQRPage />} />
              <Route path="/extend-session/:sessionId" element={<ExtendSessionPage />} />
              <Route path="/book/:itemId" element={<BookingPage />} />
              <Route path="/booking-confirmed/:bookingId" element={<BookingConfirmedPage />} />
              <Route path="/wallet" element={<WalletPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/tiers" element={<TiersPage />} />
              <Route path="/streak" element={<StreakPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/notifications" element={<NotificationsPage />} />

              {/* Ops routes — role-guarded */}
              <Route path="/dashboard" element={
                <OpsRoute allowedRoles={['super_admin', 'store_manager']}>
                  <DashboardSwitch />
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

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
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
