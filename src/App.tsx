import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import OnboardingScreen from "./components/onboarding/OnboardingScreen";
import Home from "./pages/Home";
import Location from "./pages/Location";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import CategoryResults from "./pages/CategoryResults";
import StoreDetail from "./pages/StoreDetail";
import ProductDetail from "./pages/ProductDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<OnboardingScreen />} />
          <Route path="/home" element={<Home />} />
          <Route path="/location" element={<Location />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/category/:categoryId/:categoryName?" element={<CategoryResults />} />
          <Route path="/store/:storeId" element={<StoreDetail />} />
          <Route path="/product/:productId" element={<ProductDetail />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
