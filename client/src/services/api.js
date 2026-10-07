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

const generateIdempotencyKey = () => {
  return "idemp_" + Date.now() + "_" + Math.random().toString(36).substring(2, 10);
};

export const walletService = {
  getWallet: async () => {
    const res = await api.get("/wallet");
    return res.data.wallet;
  },
  deposit: async (amount, description, pin = null, idempotencyKey = null) => {
    const key = idempotencyKey || generateIdempotencyKey();
    const res = await api.post(
      "/wallet/deposit",
      {
        amount: String(amount),
        description: description || undefined,
        pin: pin || undefined,
      },
      {
        headers: { "x-idempotency-key": key },
      }
    );
    return res.data;
  },
  withdraw: async (amount, pin = null) => {
    const res = await api.post("/wallet/withdraw", {
      amount: String(amount),
      pin: pin || undefined,
    });
    return res.data;
  },
  transfer: async (recipient, amount, description, pin = null, idempotencyKey = null) => {
    const key = idempotencyKey || generateIdempotencyKey();
    const res = await api.post(
      "/wallet/transfer",
      {
        recipient: String(recipient),
        amount: String(amount),
        description: description || undefined,
        pin: pin || undefined,
      },
      {
        headers: { "x-idempotency-key": key },
      }
    );
    return res.data;
  },
  lookupRecipients: async (query = "") => {
    const res = await api.get(`/wallet/lookup?query=${encodeURIComponent(query)}`);
    return res.data.recipients || [];
  },
  addRecipient: async ({ name, upiId, email, initialBalance }) => {
    const res = await api.post("/wallet/recipients", { name, upiId, email, initialBalance });
    return res.data;
  },
  updateRecipient: async (id, { name, upiId }) => {
    const res = await api.put(`/wallet/recipients/${id}`, { name, upiId });
    return res.data;
  },
  deleteRecipient: async (id) => {
    const res = await api.delete(`/wallet/recipients/${id}`);
    return res.data;
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

export const pinService = {
  getPinStatus: async () => {
    const res = await api.get("/auth/pin/status");
    return res.data;
  },
  setPin: async (pin) => {
    const res = await api.post("/auth/pin", { pin });
    return res.data;
  },
  verifyPin: async (pin) => {
    const res = await api.post("/auth/pin/verify", { pin });
    return res.data;
  },
  resetPin: async (password, newPin) => {
    const res = await api.post("/auth/pin/reset", { password, newPin });
    return res.data;
  },
};

export const complianceService = {
  getFlaggedTransactions: async (status = "ALL") => {
    const res = await api.get(`/compliance/flagged?status=${encodeURIComponent(status)}`);
    return res.data.transactions || [];
  },
  getComplianceStats: async () => {
    const res = await api.get("/compliance/stats");
    return res.data.stats || {};
  },
  resolveTransaction: async (id, action, notes) => {
    const res = await api.post(`/compliance/resolve/${id}`, { action, notes });
    return res.data;
  },
};

export const systemService = {
  getRealtimeStatus: async () => {
    const res = await api.get("/realtime/status");
    return res.data;
  },
};

export const bankService = {
  getDirectory: async (query = "", category = "ALL") => {
    const params = new URLSearchParams();
    if (query) params.append("query", query);
    if (category && category !== "ALL") params.append("category", category);
    const res = await api.get(`/banks/directory?${params.toString()}`);
    return res.data.banks || [];
  },
  getMyAccounts: async () => {
    const res = await api.get("/banks/my-accounts");
    return res.data.accounts || [];
  },
  linkAccount: async (bankCode, accountType = "SAVINGS") => {
    const res = await api.post("/banks/link", { bankCode, accountType });
    return res.data;
  },
  setPrimary: async (id) => {
    const res = await api.patch(`/banks/${id}/primary`);
    return res.data;
  },
  unlinkAccount: async (id) => {
    const res = await api.delete(`/banks/${id}`);
    return res.data;
  },
  checkBalance: async (id, pin) => {
    const res = await api.post(`/banks/${id}/balance`, { pin });
    return res.data;
  },
};

export default api;

