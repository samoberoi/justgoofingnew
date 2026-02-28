import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { AppProvider } from "./app/store";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            
            {/* Mobile App Routes */}
            <Route path="/app/splash" element={<SplashScreen />} />
            <Route path="/app/login" element={<LoginPage />} />
            <Route path="/app/welcome" element={<WelcomePage />} />
            <Route path="/app" element={<HomePage />} />
            <Route path="/app/cart" element={<CartPage />} />
            <Route path="/app/payment" element={<PaymentPage />} />
            <Route path="/app/tracking" element={<OrderTrackingPage />} />
            <Route path="/app/wallet" element={<WalletPage />} />
            <Route path="/app/orders" element={<OrdersPage />} />
            <Route path="/app/tiers" element={<TiersPage />} />
            <Route path="/app/streak" element={<StreakPage />} />
            <Route path="/app/spin" element={<SpinWheelPage />} />
            <Route path="/app/flash-dawats" element={<FlashDawatsPage />} />
            <Route path="/app/subscription" element={<SubscriptionPage />} />
            <Route path="/app/pre-book" element={<PreBookPage />} />
            <Route path="/app/profile" element={<ProfilePage />} />
            <Route path="/app/notifications" element={<NotificationsPage />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
