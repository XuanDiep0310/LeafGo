import axios from "axios";

const http = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "https://localhost:7206/api",
    headers: {
      "Content-Type": "application/json",
    },
  });
  

// ======================
// REQUEST INTERCEPTOR
// ======================
http.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem("accessToken");

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

// ======================
// RESPONSE INTERCEPTOR
// ======================
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Không có response → lỗi mạng
    if (!error.response) {
      return Promise.reject(error);
    }

    // Nếu 401 và chưa retry
    if (
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      // Tránh loop refresh
      if (originalRequest.url.includes("/Auth/login")) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(http(originalRequest));
            },
            reject,
          });
        });
      }

      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          throw new Error("No refresh token");
        }

        // Create a new axios instance without interceptor to avoid loop
        const refreshAxios = axios.create({
          baseURL: import.meta.env.VITE_API_URL || "https://localhost:7206/api",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const res = await refreshAxios.post("/Auth/refresh-token", {
          refreshToken,
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = res.data.data;

        localStorage.setItem("accessToken", newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
        }

        http.defaults.headers.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return http(originalRequest);
      } catch (err) {
        processQueue(err, null);
        if (window.location.pathname !== "/login") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          if (!window.__authRedirecting) {
            window.__authRedirecting = true;
            window.location.href = "/login";
          }
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default http;
