import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
