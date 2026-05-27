import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Bell, LayoutDashboard, Store, LogOut } from "lucide-react";
import { Input } from "../ui/input";
import { useAuth } from "../../contexts/AuthContext";

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-8 py-4">
        <div className="max-w-xl flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="Tìm kiếm theo mã đơn hàng, tên khách hàng..."
              className="h-11 w-full border-gray-200 bg-gray-50 pl-11 pr-4 transition-colors focus:bg-white"
            />
          </div>
        </div>

        <div className="ml-6 flex items-center gap-4">
          <button className="relative rounded-lg p-2 transition-colors hover:bg-gray-100">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full border-2 border-white bg-red-500"></span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu((prev) => !prev)}
              onBlur={() => setTimeout(() => setShowUserMenu(false), 180)}
              className="cursor-pointer border-l border-gray-200 pl-4 transition-opacity hover:opacity-80"
            >
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">{user?.name || "Quản trị viên"}</div>
                  <div className="text-xs text-gray-500">{user?.email || "admin@hbcstore.com"}</div>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-600 font-bold text-white shadow-md">
                  {(user?.name || "QT").slice(0, 2).toUpperCase()}
                </div>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
                <div className="border-b border-gray-100 bg-gradient-to-br from-purple-50 to-blue-50 px-4 py-4">
                  <p className="text-sm font-bold text-gray-900">{user?.name || "Quản trị viên"}</p>
                  <p className="mt-0.5 truncate text-xs text-gray-600">{user?.email || "admin@hbcstore.com"}</p>
                  <span className="mt-2 inline-block rounded-full bg-purple-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-700">
                    Admin
                  </span>
                </div>

                <div className="py-2">
                  <Link
                    to="/admin/dashboard"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <LayoutDashboard className="h-4 w-4 text-gray-500" />
                    Tổng quan Admin
                  </Link>
                  <Link
                    to="/"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <Store className="h-4 w-4 text-gray-500" />
                    Về trang cửa hàng
                  </Link>
                  <div className="my-1 h-px bg-gray-100"></div>
                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                      navigate("/");
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
