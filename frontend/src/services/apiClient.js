import axios from "axios";

// QUAN TRỌNG: Dùng proxy, không gọi trực tiếp backend
// Tất cả requests sẽ đi qua Vite proxy để bypass CORS
const apiClient = axios.create({
    baseURL: "", // Empty = same origin, sẽ dùng proxy
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
});

// Attach access token to requests when available
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle token refresh on 401 errors
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshTokenValue = localStorage.getItem("refreshToken");
            if (refreshTokenValue) {
                try {
                    const res = await axios.post(
                        "/api/Auth/refresh-token", // Qua proxy
                        { refreshToken: refreshTokenValue },
                        { withCredentials: true }
                    );

                    if (res?.data?.data) {
                        const d = res.data.data;
                        if (d.accessToken) localStorage.setItem("accessToken", d.accessToken);
                        if (d.refreshToken) localStorage.setItem("refreshToken", d.refreshToken);
                        if (d.expiresAt) localStorage.setItem("expiresAt", d.expiresAt);

                        // Retry original request with new token
                        originalRequest.headers.Authorization = `Bearer ${d.accessToken}`;
                        return apiClient(originalRequest);
                    }
                } catch (refreshError) {
                    // Refresh failed, clear tokens and redirect to login
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("refreshToken");
                    localStorage.removeItem("expiresAt");
                    localStorage.removeItem("user");
                    window.location.href = "/login";
                    return Promise.reject(refreshError);
                }
            }
        }

        return Promise.reject(error);
    }
);

// Auth endpoints
export async function register(payload) {
    const res = await apiClient.post("/api/Auth/register", payload);
    return res.data;
}

export async function login(payload) {
    const res = await apiClient.post("/api/Auth/login", payload);

    // Store tokens if present
    if (res?.data?.data) {
        const d = res.data.data;
        if (d.accessToken) localStorage.setItem("accessToken", d.accessToken);
        if (d.refreshToken) localStorage.setItem("refreshToken", d.refreshToken);
        if (d.expiresAt) localStorage.setItem("expiresAt", d.expiresAt);
    }

    return res.data;
}

export async function refreshToken(refreshTokenValue) {
    const res = await apiClient.post("/api/Auth/refresh-token", {
        refreshToken: refreshTokenValue
    });

    if (res?.data?.data) {
        const d = res.data.data;
        if (d.accessToken) localStorage.setItem("accessToken", d.accessToken);
        if (d.refreshToken) localStorage.setItem("refreshToken", d.refreshToken);
        if (d.expiresAt) localStorage.setItem("expiresAt", d.expiresAt);
    }

    return res.data;
}

export async function revokeToken(refreshTokenValue) {
    const res = await apiClient.post("/api/Auth/revoke-token", {
        refreshToken: refreshTokenValue
    });
    return res.data;
}

export async function revokeAllTokens() {
    const res = await apiClient.post("/api/Auth/revoke-all-tokens");
    return res.data;
}

export async function getTokens() {
    const res = await apiClient.get("/api/Auth/tokens");
    return res.data;
}

export async function changePassword(payload) {
    const res = await apiClient.post("/api/Auth/change-password", payload);
    return res.data;
}

export async function forgotPassword(payload) {
    const res = await apiClient.post("/api/Auth/forgot-password", payload);
    return res.data;
}

export async function resetPassword(payload) {
    const res = await apiClient.post("/api/Auth/reset-password", payload);
    return res.data;
}

export async function getHealth() {
    const res = await apiClient.get("/health");
    return res.data;
}

export async function getUserProfile() {
    const res = await apiClient.get("/api/Users/profile");
    return res.data;
}

export async function updateUserProfile(payload) {
    const res = await apiClient.put("/api/Users/profile", payload);
    return res.data;
}

export default apiClient;