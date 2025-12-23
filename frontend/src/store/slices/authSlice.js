import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authService } from "../../services/authService";

// Implements FR-01, FR-02, FR-04, FR-54

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

// Async thunks
// FR-01: Login
export const login = createAsyncThunk(
  "auth/login",
  async ({ phone, password }, { rejectWithValue }) => {
    try {
      const response = await authService.login(phone, password);
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// FR-01: Register
export const register = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData);
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// FR-02: Send OTP for password reset
export const sendResetPasswordOTP = createAsyncThunk(
  "auth/sendResetPasswordOTP",
  async (email, { rejectWithValue }) => {
    try {
      const response = await authService.sendResetPasswordOTP(email);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// FR-02: Reset password with OTP
export const resetPasswordWithOTP = createAsyncThunk(
  "auth/resetPasswordWithOTP",
  async ({ email, otp, newPassword }, { rejectWithValue }) => {
    try {
      const response = await authService.resetPasswordWithOTP(
        email,
        otp,
        newPassword
      );
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// FR-02: Change password
export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async ({ userId, oldPassword, newPassword }, { rejectWithValue }) => {
    try {
      const response = await authService.changePassword(
        userId,
        oldPassword,
        newPassword
      );
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
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
      return rejectWithValue(error.message);
    }
  }
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
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
    // Restore session from localStorage
    restoreSession: (state) => {
      const token = localStorage.getItem("token");
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
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
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
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, restoreSession, clearError } = authSlice.actions;
export default authSlice.reducer;
