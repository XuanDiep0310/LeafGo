import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authService from "../../services/authService";

const initialState = {
<<<<<<< HEAD
  user: null,
  accessToken: null,
  isAuthenticated: false,
=======
  user: JSON.parse(localStorage.getItem("user")) || null,
  token: localStorage.getItem("accessToken") || null,
  isAuthenticated: !!localStorage.getItem("accessToken"),
>>>>>>> c4c6b0bde71457d7b95df295d52a43d7ccfbf610
  loading: false,
  error: null,
};

<<<<<<< HEAD
/* ======================
   LOGIN
====================== */
export const login = createAsyncThunk(
  "Auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await authService.login(email, password);
      
      // Lưu token vào localStorage
      if (response.accessToken) {
        localStorage.setItem("accessToken", response.accessToken);
      }
      if (response.refreshToken) {
        localStorage.setItem("refreshToken", response.refreshToken);
      }
      
      return response;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
=======
// Async thunks
// FR-01: Login - supports both email and phone
export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      // Support multiple formats: { phone, password } or { phoneOrEmail, password }
      const phoneOrEmail =
        credentials.phoneOrEmail || credentials.phone || credentials.email;
      const password = credentials.password;

      if (!phoneOrEmail || !password) {
        throw new Error("Vui lòng nhập đầy đủ thông tin đăng nhập");
      }

      const response = await authService.login(phoneOrEmail, password);

      // Tokens are already stored in authService.login
      // Just store user in localStorage for backward compatibility
      localStorage.setItem("user", JSON.stringify(response.user));

      return response;
    } catch (error) {
      return rejectWithValue(error.message || "Đăng nhập thất bại");
>>>>>>> c4c6b0bde71457d7b95df295d52a43d7ccfbf610
    }
  },
);

/* ======================
   REGISTER
====================== */
export const register = createAsyncThunk(
  "Auth/register",
  async (data, { rejectWithValue }) => {
    try {
<<<<<<< HEAD
      const user = await authService.register(data);
      return user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
=======
      const response = await authService.register(userData);

      // Tokens are already stored in authService.register
      localStorage.setItem("user", JSON.stringify(response.user));

      return response;
    } catch (error) {
      return rejectWithValue(error.message || "Đăng ký thất bại");
    }
  },
);

// Sửa sendResetPasswordOTP thunk
export const sendResetPasswordOTP = createAsyncThunk(
  "auth/sendResetPasswordOTP",
  async (email, { rejectWithValue }) => {
    try {
      const response = await authService.sendResetPasswordOTP(email);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// Sửa resetPasswordWithOTP thunk - nhận object thay vì 3 params riêng
export const resetPasswordWithOTP = createAsyncThunk(
  "auth/resetPasswordWithOTP",
  async ({ email, token, newPassword }, { rejectWithValue }) => {
    try {
      const response = await authService.resetPasswordWithOTP(
        email,
        token,
        newPassword,
      );
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// FR-02: Change password
export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async (
    { userId, oldPassword, currentPassword, newPassword },
    { rejectWithValue },
  ) => {
    try {
      // Support both 'oldPassword' and 'currentPassword' parameter names
      const current = currentPassword || oldPassword;
      const response = await authService.changePassword(
        userId,
        current,
        newPassword,
      );
      return response;
    } catch (error) {
      return rejectWithValue(error.message || "Đổi mật khẩu thất bại");
    }
  },
);

// FR-54, FR-04: Update profile
export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async ({ userId, profileData }, { rejectWithValue }) => {
    try {
      const updatedUser = await authService.updateProfile(userId, profileData);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return updatedUser;
    } catch (error) {
      return rejectWithValue(error.message || "Cập nhật thông tin thất bại");
>>>>>>> c4c6b0bde71457d7b95df295d52a43d7ccfbf610
    }
  },
);

// Get user profile from backend
export const getUserProfile = createAsyncThunk(
  "auth/getUserProfile",
  async (_, { rejectWithValue }) => {
    try {
      const user = await authService.getUserProfile();
      localStorage.setItem("user", JSON.stringify(user));
      return user;
    } catch (error) {
      return rejectWithValue(
        error.message || "Lấy thông tin người dùng thất bại",
      );
    }
  },
);

const authSlice = createSlice({
  name: "Auth",
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
<<<<<<< HEAD
      state.error = null;
    },

    restoreSession: (state) => {
      const token = localStorage.getItem("accessToken");
      const userRaw = localStorage.getItem("user");

      if (!token || !userRaw || userRaw === "undefined") {
        return;
      }

      try {
        state.accessToken = token;
        state.user = JSON.parse(userRaw);
=======

      // Clear all auth data
      authService.logout();
    },

    // Restore session from localStorage
    restoreSession: (state) => {
      const token = localStorage.getItem("accessToken");
      const user = localStorage.getItem("user");

      if (token && user) {
        state.token = token;
        state.user = JSON.parse(user);
>>>>>>> c4c6b0bde71457d7b95df295d52a43d7ccfbf610
        state.isAuthenticated = true;
      } catch {
        localStorage.clear();
      }
    },

    clearError: (state) => {
      state.error = null;
    },

    // Update user data in state
    setUser: (state, action) => {
      state.user = action.payload;
      if (action.payload) {
        localStorage.setItem("user", JSON.stringify(action.payload));
      }
    },

    // Update avatar only (synchronous, no API call)
    updateAvatar: (state, action) => {
      if (state.user) {
        state.user.avatar = action.payload;
        localStorage.setItem("user", JSON.stringify(state.user));
      }
    },
  },

  extraReducers: (builder) => {
    builder
      // LOGIN
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })

<<<<<<< HEAD
      // REGISTER
=======
      // Register
>>>>>>> c4c6b0bde71457d7b95df295d52a43d7ccfbf610
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.accessToken = localStorage.getItem("accessToken");
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
<<<<<<< HEAD
=======
      })

      // Send Reset Password OTP
      .addCase(sendResetPasswordOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendResetPasswordOTP.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(sendResetPasswordOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Reset Password
      .addCase(resetPasswordWithOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPasswordWithOTP.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(resetPasswordWithOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Change Password
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get User Profile
      .addCase(getUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(getUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
>>>>>>> c4c6b0bde71457d7b95df295d52a43d7ccfbf610
      });
  },
});

<<<<<<< HEAD
export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (email, { rejectWithValue }) => {
    try {
      return await authService.forgotPassword(email);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ token, newPassword }, { rejectWithValue }) => {
    try {
      return await authService.resetPassword(token, newPassword);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);


export const { logout, restoreSession, clearError } = authSlice.actions;
export default authSlice.reducer;
=======
export const { logout, restoreSession, clearError, setUser, updateAvatar } =
  authSlice.actions;
export default authSlice.reducer;
>>>>>>> c4c6b0bde71457d7b95df295d52a43d7ccfbf610
