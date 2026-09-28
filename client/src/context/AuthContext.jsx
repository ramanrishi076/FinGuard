import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("finguard_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [accessToken, setAccessToken] = useState(() =>
    localStorage.getItem("finguard_access_token")
  );
  const [refreshToken, setRefreshToken] = useState(() =>
    localStorage.getItem("finguard_refresh_token")
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleAuthExpired = () => {
      logout();
    };

    window.addEventListener("finguard:auth-expired", handleAuthExpired);
    return () => {
      window.removeEventListener("finguard:auth-expired", handleAuthExpired);
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await authService.login(email, password);
      setUser(data.user);
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);

      localStorage.setItem("finguard_user", JSON.stringify(data.user));
      localStorage.setItem("finguard_access_token", data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem("finguard_refresh_token", data.refreshToken);
      }
      return data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      await authService.register(name, email, password);
      // Automatically log in after registration
      return await login(email, password);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const currentRefreshToken =
      refreshToken || localStorage.getItem("finguard_refresh_token");
    try {
      if (currentRefreshToken) {
        await authService.logout(currentRefreshToken);
      }
    } catch {
      // Ignored
    } finally {
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      localStorage.removeItem("finguard_user");
      localStorage.removeItem("finguard_access_token");
      localStorage.removeItem("finguard_refresh_token");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        isAuthenticated: Boolean(user && accessToken),
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
