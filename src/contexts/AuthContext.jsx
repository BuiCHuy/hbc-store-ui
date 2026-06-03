import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { apiGet, apiPost, apiPut } from "../lib/api";
import { setCartUserKey } from "../services/cartStorage";

const AuthContext = createContext(undefined);

function normalizeBackendUser(backendUser, token) {
  return {
    id: backendUser.id,
    email: backendUser.email || "",
    name: backendUser.fullName || backendUser.name || "",
    phoneNumber: backendUser.phoneNumber || backendUser.phone || backendUser.phone_number || "",
    address: backendUser.address || backendUser.defaultAddress || "",
    role: backendUser.role === "ADMIN" ? "admin" : "user",
    status: backendUser.status,
    createdAt: backendUser.createdAt || null,
    token,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("auth_user");
      if (raw) {
        const parsed = JSON.parse(raw);
        setUser(parsed);
        setCartUserKey(parsed.id || parsed.email);
      } else {
        setCartUserKey("guest");
      }
    } catch {
      localStorage.removeItem("auth_user");
      setCartUserKey("guest");
    }
    setIsAuthReady(true);
  }, []);

  const loginCustomer = async (email, password) => {
    try {
      const data = await apiPost("/auth/login", { email, password });
      const userData = normalizeBackendUser(data.user, data.token);
      if (userData.role === "admin") return false;
      setUser(userData);
      localStorage.setItem("auth_user", JSON.stringify(userData));
      setCartUserKey(userData.id || userData.email);
      return true;
    } catch (error) {
      console.error("Lỗi đăng nhập khách hàng:", error);
      return false;
    }
  };

  const loginAdmin = async (email, password) => {
    try {
      const data = await apiPost("/auth/login", { email, password });
      const userData = normalizeBackendUser(data.user, data.token);
      if (userData.role !== "admin") return false;
      setUser(userData);
      localStorage.setItem("auth_user", JSON.stringify(userData));
      setCartUserKey(userData.id || userData.email);
      return true;
    } catch (error) {
      console.error("Lỗi đăng nhập quản trị:", error);
      return false;
    }
  };

  const loginWithGoogle = async (idToken) => {
    try {
      const data = await apiPost("/auth/google", { idToken }, { skipAuth: true });
      const userData = normalizeBackendUser(data.user, data.token);
      if (userData.role === "admin") return false;
      setUser(userData);
      localStorage.setItem("auth_user", JSON.stringify(userData));
      setCartUserKey(userData.id || userData.email);
      return true;
    } catch (error) {
      console.error("Lỗi đăng nhập Google:", error);
      return false;
    }
  };

  const registerCustomer = async ({ email, password, fullName }) => {
    try {
      const data = await apiPost("/auth/register", {
        email,
        password,
        fullName,
      });
      return {
        success: true,
        message: data?.message || "Đăng ký thành công",
        requiresEmailVerification: !!data?.requiresEmailVerification,
      };
    } catch (error) {
      console.error("Lỗi đăng ký khách hàng:", error);
      return {
        success: false,
        message: error?.message || "Đăng ký thất bại",
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("auth_user");
    setCartUserKey("guest");
    toast.success("Đăng xuất thành công");
    window.location.reload();
  };

  const updateUserProfile = async (profilePatch) => {
    if (!user) return false;
    try {
      await apiPut(`/users/${user.id}`, {
        email: user.email,
        fullName: profilePatch?.name ?? user.name,
        phoneNumber: profilePatch?.phoneNumber ?? user.phoneNumber ?? "",
        address: profilePatch?.address ?? user.address ?? "",
        role: user.role === "admin" ? "ADMIN" : "CUSTOMER",
        status: user.status || "ACTIVE",
      });
      const latest = await apiGet(`/users/${user.id}`);
      const updated = normalizeBackendUser(latest, user.token);
      setUser(updated);
      localStorage.setItem("auth_user", JSON.stringify(updated));
      return true;
    } catch (error) {
      console.error("Lỗi cập nhật hồ sơ:", error);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthReady,
        isLoggedIn: user !== null,
        isAdmin: user?.role === "admin",
        loginCustomer,
        loginAdmin,
        loginWithGoogle,
        registerCustomer,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
