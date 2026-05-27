import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { Layout } from "./components/Layout"; 
import { ScrollToTop } from "./components/ScrollToTop";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ProductDetail } from "./pages/ProductDetail";
import { ShoppingCart } from "./pages/ShoppingCart";
import { Profile } from "./pages/Profile";
import { Toaster } from "sonner";
import { Orders } from "./pages/Orders";
import { OrderDetail } from "./pages/OrderDetail";
import { SearchResults } from "./pages/SearchResults";
import { AdminLayout } from "./components/admin/AdminLayout";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminLogin } from "./pages/admin/AdminLogin";
import { AdminRoute } from "./components/admin/AdminRoute";
import { AdminOrders } from "./pages/admin/AdminOrders";
import { AdminCategories } from "./pages/admin/AdminCategories";
import { AdminCoupons } from "./pages/admin/AdminCoupons";
import { AdminProducts } from "./pages/admin/AdminProducts";
import { AdminUsers } from "./pages/admin/AdminUsers";
import { AdminPromotions } from "./pages/admin/AdminPromotions";
import { AdminBrands } from "./pages/admin/AdminBrands";
import { AdminReviews } from "./pages/admin/AdminReviews";
import { AdminReports } from "./pages/admin/AdminReports";
import { AdminSettings } from "./pages/admin/AdminSettings";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<ShoppingCart />} />
            <Route path="/profile" element={<Profile />} />
            <Route path = "/orders" element={<Orders />} />
            <Route path = "/orders/:id" element={<OrderDetail />} />
            <Route path="/search" element={<SearchResults />} />
          </Route>
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="brands" element={<AdminBrands />} />
              <Route path="coupons" element={<AdminCoupons />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="promotions" element={<AdminPromotions />} />
              <Route path="reviews" element={<AdminReviews />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
          </Route>
        </Routes>
        
        <Toaster
          position="top-right"
          richColors
          duration={2200}
          closeButton
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
