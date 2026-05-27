import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export function AdminRoute() {
  const { isAuthReady, isLoggedIn, isAdmin } = useAuth();

  if (!isAuthReady) return null;

  if (!isLoggedIn) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return <Outlet />;
}
