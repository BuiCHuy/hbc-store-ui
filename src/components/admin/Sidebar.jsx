import React from "react";
import {
  LayoutDashboard,
  ChartColumn,
  Package,
  FolderTree,
  Building2,
  ShoppingCart,
  Users,
  ShoppingBag,
  Ticket,
  Sparkles,
  MessageSquare,
  Settings2,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const navigationItems = [
  { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard, href: "/admin" },
  { id: "reports", label: "Báo cáo", icon: ChartColumn, href: "/admin/reports" },
  { id: "products", label: "Sản phẩm", icon: Package, href: "/admin/products" },
  { id: "categories", label: "Danh mục", icon: FolderTree, href: "/admin/categories" },
  { id: "brands", label: "Hãng", icon: Building2, href: "/admin/brands" },
  { id: "orders", label: "Đơn hàng", icon: ShoppingCart, href: "/admin/orders" },
  { id: "users", label: "Người dùng", icon: Users, href: "/admin/users" },
  { id: "promotions", label: "Khuyến mại", icon: Sparkles, href: "/admin/promotions" },
  { id: "coupons", label: "Mã giảm giá", icon: Ticket, href: "/admin/coupons" },
  { id: "reviews", label: "Đánh giá", icon: MessageSquare, href: "/admin/reviews" },
  { id: "settings", label: "Cài đặt", icon: Settings2, href: "/admin/settings" },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 p-6">
        <Link to="/admin" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-blue-600">
            <ShoppingBag className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">HBC Store</div>
            <div className="text-xs text-gray-500">Quản trị</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <li key={item.id}>
                <Link
                  to={item.href}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                    isActive
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
