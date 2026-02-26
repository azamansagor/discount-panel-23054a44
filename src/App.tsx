import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { WishlistProvider } from "./contexts/WishlistContext";
import OnboardingScreen from "./components/onboarding/OnboardingScreen";
import Home from "./pages/Home";
import Discover from "./pages/Discover";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import CategoryResults from "./pages/CategoryResults";
import StoreDetail from "./pages/StoreDetail";
import StoreProducts from "./pages/StoreProducts";
import ProductDetail from "./pages/ProductDetail";
import Notifications from "./pages/Notifications";
import Login from "./pages/Login";
import Wishlist from "./pages/Wishlist";
import Search from "./pages/Search";
import Explore from "./pages/Explore";
import Tutorials from "./pages/Tutorials";
import TutorialDetail from "./pages/TutorialDetail";
import MyStores from "./pages/MyStores";
import CreateStore from "./pages/CreateStore";
import EditStore from "./pages/EditStore";
import MyProducts from "./pages/MyProducts";
import CreateProduct from "./pages/CreateProduct";
import EditProduct from "./pages/EditProduct";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <WishlistProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<OnboardingScreen />} />
              <Route path="/home" element={<Home />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/login" element={<Login />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/search" element={<Search />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/category/:categoryId/:categoryName?" element={<CategoryResults />} />
              <Route path="/store/:storeId" element={<StoreDetail />} />
              <Route path="/store/:storeId/products" element={<StoreProducts />} />
              <Route path="/product/:productId" element={<ProductDetail />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/tutorials" element={<Tutorials />} />
              <Route path="/tutorial/:tutorialId" element={<TutorialDetail />} />
              <Route path="/my-stores" element={<MyStores />} />
              <Route path="/my-stores/create" element={<CreateStore />} />
              <Route path="/my-stores/:storeId/edit" element={<EditStore />} />
              <Route path="/my-stores/:storeId/products" element={<MyProducts />} />
              <Route path="/my-stores/:storeId/products/create" element={<CreateProduct />} />
              <Route path="/my-stores/:storeId/products/:productId/edit" element={<EditProduct />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </WishlistProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
