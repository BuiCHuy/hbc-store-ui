import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { AdminNotificationsProvider } from "./AdminNotificationsContext";

export function AdminLayout() {
  return (
    <AdminNotificationsProvider>
      <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
        <Sidebar />
        <div className="flex-1 ml-64 min-w-0 flex flex-col min-h-screen">
          <Header />
          <div className="flex-1 min-w-0 overflow-x-hidden">
            <Outlet />
          </div>
        </div>
      </div>
    </AdminNotificationsProvider>
  );
}
