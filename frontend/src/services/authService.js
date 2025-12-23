import { mockApi } from "./mockData";

// Simulates backend authentication
// Implements FR-01, FR-02

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const authService = {
  // FR-01: Login functionality - using phone number instead of username
  login: async (phone, password) => {
    await delay(1000); // Simulate network delay

    const users = await mockApi.getAllUsers();
    const user = users.find(
      (u) => u.phone === phone && u.password === password
    );

    if (!user) {
      throw new Error("Số điện thoại hoặc mật khẩu không đúng");
    }

    if (!user.isActive) {
      throw new Error("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên");
    }

    // Don't return password
    const { password: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      token: `mock_token_${user.id}`,
    };
  },

  // FR-01: Register functionality (User/Driver only)
  register: async (userData) => {
    await delay(1000);

    const users = await mockApi.getAllUsers();
    const existingUser = users.find(
      (u) => u.email === userData.email || u.phone === userData.phone
    );

    if (existingUser) {
      throw new Error("Email hoặc số điện thoại đã tồn tại");
    }

    // Admin cannot register through public form
    if (userData.role === "admin") {
      throw new Error("Không thể đăng ký tài khoản admin");
    }

    // Auto-generate username from phone number
    const generatedUsername = `user_${userData.phone.replace(/[^0-9]/g, "")}`;
    const registerData = {
      ...userData,
      username: generatedUsername,
    };

    const newUser = await mockApi.createUser(registerData);
    const { password: _, ...userWithoutPassword } = newUser;
    return {
      user: userWithoutPassword,
      token: `mock_token_${newUser.id}`,
    };
  },

  // FR-02: Forgot password - Step 1: Send OTP
  sendResetPasswordOTP: async (email) => {
    await delay(1000);

    const users = await mockApi.getAllUsers();
    const user = users.find((u) => u.email === email);

    if (!user) {
      throw new Error("Email không tồn tại trong hệ thống");
    }

    // Simulate sending OTP (in real app, this would send to email)
    const otp = "123456"; // Mock OTP
    console.log(`[Mock] OTP gửi đến ${email}: ${otp}`);

    return {
      success: true,
      message: "Mã OTP đã được gửi đến email của bạn",
      mockOtp: otp, // For testing purposes
    };
  },

  // FR-02: Forgot password - Step 2: Reset password with OTP
  resetPasswordWithOTP: async (email, otp, newPassword) => {
    await delay(1000);

    // Verify OTP (in real app, this would check against stored OTP)
    if (otp !== "123456") {
      throw new Error("Mã OTP không đúng");
    }

    const users = await mockApi.getAllUsers();
    const user = users.find((u) => u.email === email);

    if (!user) {
      throw new Error("Email không tồn tại");
    }

    // Update password
    await mockApi.updateUser(user.id, { password: newPassword });

    return {
      success: true,
      message: "Mật khẩu đã được đặt lại thành công",
    };
  },

  // FR-02: Change password (from profile)
  changePassword: async (userId, oldPassword, newPassword) => {
    await delay(1000);

    const user = await mockApi.getUserById(userId);

    if (!user) {
      throw new Error("Người dùng không tồn tại");
    }

    if (user.password !== oldPassword) {
      throw new Error("Mật khẩu cũ không đúng");
    }

    await mockApi.updateUser(userId, { password: newPassword });

    return {
      success: true,
      message: "Đổi mật khẩu thành công",
    };
  },

  // FR-54, FR-04: Update profile
  updateProfile: async (userId, profileData) => {
    await delay(1000);

    const updatedUser = await mockApi.updateUser(userId, profileData);

    if (!updatedUser) {
      throw new Error("Cập nhật thất bại");
    }

    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  },
};
