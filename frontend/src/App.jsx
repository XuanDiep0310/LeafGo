import { Routes, Route, Navigate } from "react-router-dom"
import { useSelector } from "react-redux"

// Auth Pages
import LoginPage from "./pages/auth/LoginPage"
import RegisterPage from "./pages/auth/RegisterPage"
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage"

// User Pages
import UserLayout from "./layouts/UserLayout"
import UserBookingPage from "./pages/user/BookingPage"
import UserHistoryPage from "./pages/user/HistoryPage"

// Driver Pages
import DriverLayout from "./layouts/DriverLayout"
import DriverWorkplacePage from "./pages/driver/WorkplacePage"
import DriverDashboardPage from "./pages/driver/DashboardPage"
import DriverHistoryPage from "./pages/driver/HistoryPage"

// Admin Pages
import AdminLayout from "./layouts/AdminLayout"
import AdminDashboardPage from "./pages/admin/DashboardPage"
import AdminUsersPage from "./pages/admin/UsersPage"
import AdminTripsPage from "./pages/admin/TripsPage"
import AdminTariffPage from "./pages/admin/TariffPage"

// Shared Pages
import ProfilePage from "./pages/shared/ProfilePage"

// Private Route Component
const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user?.role?.toLowerCase())) {
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  const { user, isAuthenticated } = useSelector((state) => state.auth)

  // Redirect root based on role
  const getRootRedirect = () => {
    if (!isAuthenticated) return "/login"

    const role = user?.role?.toLowerCase(); // Chuẩn hóa

    if (role === "user") return "/user/booking"
    if (role === "driver") return "/driver/workplace"
    if (role === "admin") return "/admin/dashboard"
    return "/login"
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Root redirect */}
      <Route path="/" element={<Navigate to={getRootRedirect()} replace />} />

      {/* User Routes */}
      <Route
        path="/user/*"
        element={
          <PrivateRoute allowedRoles={["user"]}>
            <UserLayout />
          </PrivateRoute>
        }
      >
        <Route path="booking" element={<UserBookingPage />} />
        <Route path="history" element={<UserHistoryPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Driver Routes */}
      <Route
        path="/driver/*"
        element={
          <PrivateRoute allowedRoles={["driver"]}>
            <DriverLayout />
          </PrivateRoute>
        }
      >
        <Route path="workplace" element={<DriverWorkplacePage />} />
        <Route path="dashboard" element={<DriverDashboardPage />} />
        <Route path="history" element={<DriverHistoryPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Admin Routes */}
      <Route
        path="/admin/*"
        element={
          <PrivateRoute allowedRoles={["admin"]}>
            <AdminLayout />
          </PrivateRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="trips" element={<AdminTripsPage />} />
        <Route path="tariff" element={<AdminTariffPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
