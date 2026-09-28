import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach Access Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("finguard_access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Seamless Token Refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/register") &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("finguard_refresh_token");
      if (!refreshToken) {
        window.dispatchEvent(new CustomEvent("finguard:auth-expired"));
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        if (data.accessToken) {
          localStorage.setItem("finguard_access_token", data.accessToken);
          if (data.refreshToken) {
            localStorage.setItem("finguard_refresh_token", data.refreshToken);
          }
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshErr) {
        localStorage.removeItem("finguard_access_token");
        localStorage.removeItem("finguard_refresh_token");
        localStorage.removeItem("finguard_user");
        window.dispatchEvent(new CustomEvent("finguard:auth-expired"));
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

// Centralized API Services
export const authService = {
  login: async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    return res.data;
  },
  register: async (name, email, password) => {
    const res = await api.post("/auth/register", { name, email, password });
    return res.data;
  },
  logout: async (refreshToken) => {
    try {
      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken });
      }
    } catch {
      // Ignored during client cleanup
    }
  },
};

export const walletService = {
  getWallet: async () => {
    const res = await api.get("/wallet");
    return res.data.wallet;
  },
  deposit: async (amount) => {
    const res = await api.post("/wallet/deposit", { amount: String(amount) });
    return res.data;
  },
  withdraw: async (amount) => {
    const res = await api.post("/wallet/withdraw", { amount: String(amount) });
    return res.data;
  },
  transfer: async (recipient, amount, description) => {
    const res = await api.post("/wallet/transfer", {
      recipient: String(recipient),
      amount: String(amount),
      description: description || undefined,
    });
    return res.data;
  },
  lookupRecipients: async (query = "") => {
    const res = await api.get(`/wallet/lookup?query=${encodeURIComponent(query)}`);
    return res.data.recipients || [];
  },
};

export const transactionService = {
  getTransactions: async () => {
    const res = await api.get("/transactions");
    return res.data.transactions;
  },
  getTransactionById: async (id) => {
    const res = await api.get(`/transactions/${id}`);
    return res.data.transaction;
  },
};

export const systemService = {
  getRealtimeStatus: async () => {
    const res = await api.get("/realtime/status");
    return res.data;
  },
};

export default api;
