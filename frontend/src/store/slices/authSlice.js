import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authService } from "../../services/authService";

// Implements FR-01, FR-02, FR-04, FR-54

const initialState = {
  user: JSON.parse(localStorage.getItem("user")) || null,
  token: localStorage.getItem("accessToken") || null,
  isAuthenticated: !!localStorage.getItem("accessToken"),
  loading: false,
  error: null,
};

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
    }
  },
);

// FR-01: Register
export const register = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
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
  name: "auth",
  initialState,
  reducers: {
    // FR-01: Logout
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;

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
        state.isAuthenticated = true;
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
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })

      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
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
      });
  },
});

export const { logout, restoreSession, clearError, setUser, updateAvatar } =
  authSlice.actions;
export default authSlice.reducer;