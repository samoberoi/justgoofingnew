import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./app/store";
import { OpsAuthProvider, useAuth } from "./ops/hooks/useAuth";
import SplashScreen from "./app/pages/SplashScreen";
import LoginPage from "./app/pages/LoginPage";
import WelcomePage from "./app/pages/WelcomePage";
import HomePage from "./app/pages/HomePage";
import CartPage from "./app/pages/CartPage";
import PaymentPage from "./app/pages/PaymentPage";
import OrderTrackingPage from "./app/pages/OrderTrackingPage";
import WalletPage from "./app/pages/WalletPage";
import OrdersPage from "./app/pages/OrdersPage";
import TiersPage from "./app/pages/TiersPage";
import StreakPage from "./app/pages/StreakPage";
import SpinWheelPage from "./app/pages/SpinWheelPage";
import FlashDawatsPage from "./app/pages/FlashDawatsPage";
import SubscriptionPage from "./app/pages/SubscriptionPage";
import PreBookPage from "./app/pages/PreBookPage";
import ProfilePage from "./app/pages/ProfilePage";
import NotificationsPage from "./app/pages/NotificationsPage";

// Ops pages
import OpsLoginPage from "./ops/pages/OpsLoginPage";
import SuperAdminDashboard from "./ops/pages/SuperAdminDashboard";
import StoreManagerDashboard from "./ops/pages/StoreManagerDashboard";
import OpsOrdersPage from "./ops/pages/OpsOrdersPage";
import OpsMenuPage from "./ops/pages/OpsMenuPage";
import OpsAnalyticsPage from "./ops/pages/OpsAnalyticsPage";
import OpsSettingsPage from "./ops/pages/OpsSettingsPage";
import OpsCustomersPage from "./ops/pages/OpsCustomersPage";
import KitchenView from "./ops/pages/KitchenView";
import DeliveryView from "./ops/pages/DeliveryView";

const queryClient = new QueryClient();

const OpsRouter = () => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <div className="fixed inset-0 bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
    </div>;
  }

  if (!user) return <OpsLoginPage />;

  if (!role) {
    return <div className="fixed inset-0 bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-foreground font-heading">No Role Assigned</p>
      <p className="text-muted-foreground text-sm">Contact your admin to get access.</p>
    </div>;
  }

  // Role-based default route
  const defaultRoute = {
    super_admin: '/ops/dashboard',
    store_manager: '/ops/dashboard',
    kitchen_manager: '/ops/kitchen',
    delivery_partner: '/ops/deliveries',
  }[role];

  return (
    <Routes>
      <Route path="/" element={<Navigate to={defaultRoute} replace />} />
      {/* Super Admin & Store Manager */}
      {(role === 'super_admin' || role === 'store_manager') && (
        <>
          <Route path="/dashboard" element={role === 'super_admin' ? <SuperAdminDashboard /> : <StoreManagerDashboard />} />
          <Route path="/orders" element={<OpsOrdersPage />} />
          <Route path="/menu" element={<OpsMenuPage />} />
          <Route path="/customers" element={<OpsCustomersPage />} />
        </>
      )}
      {/* Super Admin only */}
      {role === 'super_admin' && (
        <>
          <Route path="/analytics" element={<OpsAnalyticsPage />} />
          <Route path="/settings" element={<OpsSettingsPage />} />
        </>
      )}
      {/* Kitchen Manager */}
      {role === 'kitchen_manager' && <Route path="/kitchen" element={<KitchenView />} />}
      {/* Delivery Partner */}
      {role === 'delivery_partner' && <Route path="/deliveries" element={<DeliveryView />} />}
      {/* Catch-all */}
      <Route path="*" element={<Navigate to={defaultRoute} replace />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<SplashScreen />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/welcome" element={<WelcomePage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/tracking" element={<OrderTrackingPage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/tiers" element={<TiersPage />} />
            <Route path="/streak" element={<StreakPage />} />
            <Route path="/spin" element={<SpinWheelPage />} />
            <Route path="/flash-dawats" element={<FlashDawatsPage />} />
            <Route path="/subscription" element={<SubscriptionPage />} />
            <Route path="/pre-book" element={<PreBookPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/ops/*" element={
              <OpsAuthProvider>
                <OpsRouter />
              </OpsAuthProvider>
            } />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
