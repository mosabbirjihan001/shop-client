import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import AdminPanel from "./pages/AdminPanel";
import ProductDetail from "./pages/ProductDetail";
import CartPage from "./pages/CartPage";
import ProfilePage from "./pages/ProfilePage";
import Footer from "./components/Footer";
import ErrorBoundary from "./components/ErrorBoundary";

export default function App() {
  return (
    <div className="min-h-screen bg-base-200 text-base-content">
      <Navbar />
      <ErrorBoundary>
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminPanel />
              </ProtectedRoute>
            }
          />
          </Routes>
        </main>
      </ErrorBoundary>
      <Footer />
    </div>
  );
}
