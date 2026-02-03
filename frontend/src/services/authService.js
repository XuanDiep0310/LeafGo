<<<<<<< HEAD
import http from "./http";

const authService = {
  // ======================
  // LOGIN
  // POST /api/Auth/login
  // ======================
  // ...existing code...
  // ======================
  // LOGIN
  // POST /api/Auth/login
  // ======================
  login: async (email, password) => {
    try {
      const res = await http.post("/Auth/login", { email, password });
      console.log("LOGIN RESPONSE:", res.data);

      // support different response shapes
      const payload = res.data?.data ?? res.data ?? {};
      // tokens might be top-level in payload or inside payload.tokens
      const accessToken = payload.accessToken ?? payload.tokens?.accessToken;
      const refreshToken = payload.refreshToken ?? payload.tokens?.refreshToken;

      // derive user: prefer payload.user, otherwise remove known token fields from payload
      let user = payload.user ?? null;
      if (!user) {
        const { accessToken: _at, refreshToken: _rt, tokens, ...rest } = payload;
        user = Object.keys(rest).length ? rest : null;
      }

      if (accessToken) localStorage.setItem("accessToken", accessToken);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
      if (user) localStorage.setItem("user", JSON.stringify(user));

      return user;
    } catch (err) {
      console.error("authService.login error:", err.response ?? err);
      // rethrow so caller (thunk) can handle and produce user-facing message
      throw err;
    }
  },
// ...existing code...
  


  // ======================
  // REGISTER
  // POST /api/Auth/register
  // ======================
  register: async ({ email, password, fullName, phoneNumber, role }) => {
    const res = await http.post("/Auth/register", {
      email,
      password,
      fullName,
      phoneNumber,
      role,
    });
  
    const {
      accessToken,
      refreshToken,
      ...user
    } = res.data.data;
  
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(user)); 
  
    return user;
  },
  

  // ======================
  // REFRESH TOKEN
  // POST /api/Auth/refresh-token
  // ======================
  refreshToken: async () => {
    const refreshToken = localStorage.getItem("refreshToken");

    if (!refreshToken) {
      throw new Error("No refresh token found");
    }

    const res = await http.post("/Auth/refresh-token", {
      refreshToken,
    });

    const { accessToken, refreshToken: newRefreshToken } = res.data.data;

    localStorage.setItem("accessToken", accessToken);
    if (newRefreshToken) {
      localStorage.setItem("refreshToken", newRefreshToken);
    }

    return accessToken;
  },

  // ======================
  // LOGOUT / REVOKE TOKEN
  // POST /api/Auth/revoke-token
  // ======================
  logout: async () => {
    const refreshToken = localStorage.getItem("refreshToken");
  
    if (refreshToken) {
      await http.post("/Auth/revoke-token", { refreshToken });
    }
  
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user"); // ✅
  },

  // ======================
  // REVOKE ALL TOKENS
  // POST /api/Auth/revoke-all-tokens
  // ======================
  revokeAllTokens: async () => {
    const res = await http.post("/Auth/revoke-all-tokens");

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    return res.data;
  },

  // ======================
  // GET ALL TOKENS
  // GET /api/Auth/tokens
  // ======================
  getTokens: async () => {
    const res = await http.get("/Auth/tokens");
    return res.data.data;
  },
  

  // ======================
  // CHANGE PASSWORD (logged-in user)
  // POST /api/Auth/change-password
  // ======================
  changePassword: async (currentPassword, newPassword) => {
    const res = await http.post("/Auth/change-password", {
      currentPassword,
      newPassword,
    });

    return res.data;
  },

  // ======================
  // FORGOT PASSWORD
  // POST /api/Auth/forgot-password
  // ======================
  forgotPassword: async (email) => {
    const res = await http.post("/Auth/forgot-password", {
      email,
    });

    return res.data;
  },

  // ======================
  // RESET PASSWORD
  // POST /api/Auth/reset-password
  // ======================
  resetPassword: async (token, newPassword) => {
    const res = await http.post("/Auth/reset-password", {
      token,
      newPassword,
    });

    return res.data;
  },

  // ======================
  // HELPERS
  // ======================
  getAccessToken: () => {
    return localStorage.getItem("accessToken");
  },

  isAuthenticated: () => {
    return !!localStorage.getItem("accessToken");
  },
};

export default authService;
=======
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
        phoneNumber: d.phoneNumber,
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
        phoneNumber: d.phoneNumber,
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
          phoneNumber: d.phoneNumber,
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
        phoneNumber: d.phoneNumber,
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
>>>>>>> c4c6b0bde71457d7b95df295d52a43d7ccfbf610
