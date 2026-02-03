import http from "./http";

const healthService = {
  // ======================
  // HEALTH CHECK
  // GET /health
  // ======================
  checkHealth: async () => {
    // Health endpoint is at root level, not under /api
    const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5191";
    const res = await fetch(`${baseURL}/health`);
    
    if (!res.ok) {
      throw new Error(`Health check failed: ${res.status}`);
    }
    
    return res.json();
  },
};

export default healthService;

