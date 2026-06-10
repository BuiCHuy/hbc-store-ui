import React, { useEffect, useMemo, useState } from "react";
import { DollarSign, ShoppingCart, AlertTriangle, Package } from "lucide-react";
import { toast } from "sonner";
import { StatCard } from "../../components/admin/StatCard";
import { OrdersTable } from "../../components/admin/OrdersTable";
import { getErrorMessageVi } from "../../lib/api";
import { getProducts } from "../../hooks/useCatalog";
import { getAdminOrders } from "../../services/adminApi";

export function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      setIsLoading(true);
      try {
        const [productData, orderData] = await Promise.all([getProducts(), getAdminOrders()]);
        if (!isMounted) return;
        setProducts(productData);
        setOrders(orderData);
      } catch (error) {
        if (!isMounted) return;
        setProducts([]);
        setOrders([]);
        toast.error("Không thể tải dữ liệu tổng quan", {
          description: getErrorMessageVi(error, "Không thể tải dữ liệu tổng quan."),
        });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const totalRevenue = orders
      .filter((order) => order.status === "DELIVERED")
      .reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

    const processingOrders = orders.filter(
      (order) =>
        order.status === "PENDING" || order.status === "CONFIRMED" || order.status === "SHIPPING"
    ).length;

    const outOfStockProducts = products.filter((product) => (product.stockQuantity ?? 0) === 0).length;
    const totalProducts = products.length;

    return {
      totalRevenue,
      processingOrders,
      outOfStockProducts,
      totalProducts,
    };
  }, [orders, products]);

  const formatVnd = (value) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <main className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tổng quan</h1>
          <p className="mt-1 text-gray-600">Chào mừng trở lại! Đây là tình hình hôm nay.</p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tổng doanh thu"
          value={isLoading ? "..." : formatVnd(stats.totalRevenue)}
          icon={DollarSign}
          trend={{ value: "Theo đơn đã giao", isPositive: true }}
        />
        <StatCard
          title="Đơn hàng đang xử lý"
          value={isLoading ? "..." : String(stats.processingOrders)}
          icon={ShoppingCart}
          trend={{ value: "Đang chờ + Đã xác nhận + Đang giao", isPositive: true }}
        />
        <StatCard
          title="Sản phẩm hết hàng"
          value={isLoading ? "..." : String(stats.outOfStockProducts)}
          icon={AlertTriangle}
          trend={{ value: "Tồn kho = 0", isPositive: false }}
        />
        <StatCard
          title="Tổng sản phẩm"
          value={isLoading ? "..." : String(stats.totalProducts)}
          icon={Package}
          trend={{ value: "Theo cơ sở dữ liệu", isPositive: true }}
        />
      </div>

      <OrdersTable />
    </main>
  );
}
