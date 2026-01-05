import {
  login as apiLogin,
  register as apiRegister,
  forgotPassword as apiForgotPassword,
  resetPassword as apiResetPassword,
  changePassword as apiChangePassword,
  getUserProfile as apiGetUserProfile,
  updateUserProfile as apiUpdateUserProfile,
} from "./apiClient";

// Adapter around backend Auth API to match app's expected shapes
export const authService = {
  login: async (phoneOrEmail, password) => {
    try {
      // Validate input
      if (!phoneOrEmail || !password) {
        throw new Error("Vui lòng nhập đầy đủ thông tin đăng nhập");
      }

      console.log("🔍 Login attempt:", { phoneOrEmail, password: "***" }); // Debug

      // Backend yêu cầu CẢ email VÀ phoneNumber, để empty string nếu không có
      const isEmail = String(phoneOrEmail).includes("@");
      const payload = {
        email: isEmail ? phoneOrEmail : "",
        phoneNumber: isEmail ? "" : phoneOrEmail,
        password
      };

      console.log("📤 Payload sent:", payload); // Debug

      const res = await apiLogin(payload);

      console.log("✅ Login response:", res); // Debug

      // res should be the API wrapper response: { success, message, data }
      if (!res.success) {
        throw new Error(res.message || "Đăng nhập thất bại");
      }

      const d = res.data;

      // Transform to app's user format matching mockDatabase structure
      const user = {
        id: d.id,
        username: d.email || d.phoneNumber,
        email: d.email,
        fullName: d.fullName,
        phone: d.phoneNumber,
        role: d.role,
        balance: d.balance || 0,
        avatar: d.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${d.id}`,
        isActive: d.isActive !== false,
        isOnline: d.isOnline,
        createdAt: d.createdAt || new Date().toISOString(), // ✅ FIX: Use ISO string
        // Include driver-specific fields if present
        ...(d.vehicleInfo && { vehicleInfo: d.vehicleInfo }),
        ...(d.driverStatus && { driverStatus: d.driverStatus }),
        ...(d.rating && { rating: d.rating }),
        ...(d.totalTrips && { totalTrips: d.totalTrips }),
      };

      // Store user data
      localStorage.setItem("user", JSON.stringify(user));

      return {
        user,
        token: d.accessToken || null,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Đăng nhập thất bại";
      throw new Error(message);
    }
  },

  register: async (userData) => {
    try {
      // Transform userData to match backend API format
      const payload = {
        email: userData.email,
        password: userData.password,
        fullName: userData.fullName,
        phoneNumber: userData.phone || userData.phoneNumber,
        role: userData.role || "user",
      };

      const res = await apiRegister(payload);

      if (!res.success) {
        throw new Error(res.message || "Đăng ký thất bại");
      }

      const d = res.data;

      const user = {
        id: d.id,
        username: d.email || d.phoneNumber,
        email: d.email,
        fullName: d.fullName,
        phone: d.phoneNumber,
        role: d.role,
        balance: d.balance || 0,
        avatar: d.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${d.id}`,
        isActive: d.isActive !== false,
        isOnline: d.isOnline,
        createdAt: d.createdAt || new Date().toISOString(), // ✅ FIX: Use ISO string
      };

      localStorage.setItem("user", JSON.stringify(user));

      return {
        user,
        token: d.accessToken || null,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Đăng ký thất bại";
      throw new Error(message);
    }
  },

  sendResetPasswordOTP: async (email) => {
    try {
      // Backend provides forgot-password endpoint
      const res = await apiForgotPassword({ email });

      if (!res.success) {
        throw new Error(res.message || "Gửi mã xác thực thất bại");
      }

      return res;
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Gửi mã xác thực thất bại";
      throw new Error(message);
    }
  },

  resetPasswordWithOTP: async (email, token, newPassword) => {
    try {
      // Backend expects { token, newPassword }
      const res = await apiResetPassword({ token, newPassword });

      if (!res.success) {
        throw new Error(res.message || "Đặt lại mật khẩu thất bại");
      }

      return res;
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Đặt lại mật khẩu thất bại";
      throw new Error(message);
    }
  },

  changePassword: async (_userId, currentPassword, newPassword) => {
    try {
      // Backend expects { currentPassword, newPassword } and infers user from auth
      const res = await apiChangePassword({ currentPassword, newPassword });

      if (!res.success) {
        throw new Error(res.message || "Đổi mật khẩu thất bại");
      }

      return res;
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Đổi mật khẩu thất bại";
      throw new Error(message);
    }
  },

  // Keep updateProfile using existing mock for now (no public API defined in prompt)
  updateProfile: async (userId, profileData) => {
    try {
      // Try backend API first if available
      const res = await apiUpdateUserProfile(profileData);

      if (res.success) {
        const d = res.data;
        const updatedUser = {
          id: d.id,
          username: d.email || d.phoneNumber,
          email: d.email,
          fullName: d.fullName,
          phone: d.phoneNumber,
          role: d.role,
          balance: d.balance || 0,
          avatar: d.avatar,
          isActive: d.isActive !== false,
          isOnline: d.isOnline,
          createdAt: d.createdAt, // ✅ Giữ nguyên từ API (đã là string)
          ...(d.vehicleInfo && { vehicleInfo: d.vehicleInfo }),
          ...(d.driverStatus && { driverStatus: d.driverStatus }),
          ...(d.rating && { rating: d.rating }),
          ...(d.totalTrips && { totalTrips: d.totalTrips }),
        };

        localStorage.setItem("user", JSON.stringify(updatedUser));
        return updatedUser;
      }
    } catch (error) {
      console.warn("Backend update not available, using localStorage:", error.message);
    }

    // Fallback to local update via existing stored user
    const userStr = localStorage.getItem("user");
    if (!userStr) throw new Error("No user in localStorage");

    const user = JSON.parse(userStr);
    const updated = { ...user, ...profileData };
    localStorage.setItem("user", JSON.stringify(updated));

    return updated;
  },

  getUserProfile: async () => {
    try {
      const res = await apiGetUserProfile();

      if (!res.success) {
        throw new Error(res.message || "Lấy thông tin người dùng thất bại");
      }

      const d = res.data;

      const user = {
        id: d.id,
        username: d.email || d.phoneNumber,
        email: d.email,
        fullName: d.fullName,
        phone: d.phoneNumber,
        role: d.role,
        balance: d.balance || 0,
        avatar: d.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${d.id}`,
        isActive: d.isActive !== false,
        isOnline: d.isOnline,
        createdAt: d.createdAt, // ✅ Giữ nguyên từ API (đã là string)
        ...(d.vehicleInfo && { vehicleInfo: d.vehicleInfo }),
        ...(d.driverStatus && { driverStatus: d.driverStatus }),
        ...(d.rating && { rating: d.rating }),
        ...(d.totalTrips && { totalTrips: d.totalTrips }),
      };

      localStorage.setItem("user", JSON.stringify(user));
      return user;
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Lấy thông tin người dùng thất bại";
      throw new Error(message);
    }
  },

  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("expiresAt");
    localStorage.removeItem("user");
  },
};