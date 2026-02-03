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
