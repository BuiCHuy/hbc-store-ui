import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DollarSign, Undo2, Wallet, Package, ShoppingCart } from "lucide-react";
import { Button } from "../../components/ui/button";
import { getErrorMessageVi } from "../../lib/api";
import { getAdminOrders, getAdminRefundRequests } from "../../services/adminApi";

const ranges = [
  { id: "all", label: "Toàn bộ", days: null },
  { id: "7d", label: "7 ngày", days: 7 },
  { id: "30d", label: "30 ngày", days: 30 },
  { id: "90d", label: "90 ngày", days: 90 },
];

const orderStatusLabels = {
  PENDING: "Chờ xử lý",
  CONFIRMED: "Đã xác nhận",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã hủy",
};

function formatVnd(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function startDateFromRange(days) {
  if (!days) return null;
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - (days - 1));
  return date;
}

export function AdminReports() {
  const [orders, setOrders] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [rangeId, setRangeId] = useState("30d");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const [orderData, refundData] = await Promise.all([getAdminOrders(), getAdminRefundRequests()]);
        if (!mounted) return;
        setOrders(orderData);
        setRefunds(refundData);
      } catch (error) {
        toast.error("Không thể tải dữ liệu báo cáo", {
          description: getErrorMessageVi(error, "Không thể tải dữ liệu báo cáo."),
        });
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const rangeConfig = useMemo(() => ranges.find((item) => item.id === rangeId) || ranges[0], [rangeId]);

  const metrics = useMemo(() => {
    const fromDate = startDateFromRange(rangeConfig.days);

    const inRangeOrders = orders.filter((order) => {
      if (!fromDate) return true;
      return new Date(order.order_date) >= fromDate;
    });
    const inRangeRefunds = refunds.filter((refund) => {
      if (!fromDate) return true;
      return new Date(refund.created_at) >= fromDate;
    });

    const grossRevenue = inRangeOrders
      .filter((order) => order.status === "DELIVERED")
      .reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

    const refundedAmount = inRangeRefunds
      .filter((refund) => refund.status === "COMPLETED")
      .reduce((sum, refund) => sum + Number(refund.refund_amount || 0), 0);

    const netRevenue = Math.max(grossRevenue - refundedAmount, 0);
    const totalOrders = inRangeOrders.length;
    const deliveredOrders = inRangeOrders.filter((order) => order.status === "DELIVERED").length;
    const cancelledOrders = inRangeOrders.filter((order) => order.status === "CANCELLED").length;

    const orderByStatus = ["PENDING", "CONFIRMED", "SHIPPING", "DELIVERED", "CANCELLED"].map((status) => {
      const count = inRangeOrders.filter((order) => order.status === status).length;
      const percent = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0;
      return { status, count, percent };
    });

    const productMap = new Map();
    inRangeOrders
      .filter((order) => order.status === "DELIVERED")
      .forEach((order) => {
        (order.items || []).forEach((item) => {
          const existing = productMap.get(item.product_id) || {
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: 0,
            revenue: 0,
          };
          existing.quantity += Number(item.quantity || 0);
          existing.revenue += Number(item.total_price || 0);
          productMap.set(item.product_id, existing);
        });
      });

    const topProducts = [...productMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8);

    return {
      grossRevenue,
      refundedAmount,
      netRevenue,
      totalOrders,
      deliveredOrders,
      cancelledOrders,
      orderByStatus,
      topProducts,
    };
  }, [orders, refunds, rangeConfig.days]);

  return (
    <main className="p-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Báo cáo doanh thu</h1>
          <p className="mt-1 text-gray-600">Theo dõi doanh thu, hoàn tiền và hiệu suất đơn hàng</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-1">
          {ranges.map((item) => (
            <Button
              key={item.id}
              size="sm"
              variant="ghost"
              onClick={() => setRangeId(item.id)}
              className={`h-9 px-4 ${
                rangeId === item.id
                  ? "bg-purple-600 text-white hover:bg-purple-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard title="Doanh thu gộp" value={isLoading ? "..." : formatVnd(metrics.grossRevenue)} helper="Từ đơn đã giao" icon={DollarSign} />
        <MetricCard title="Tiền hoàn trả" value={isLoading ? "..." : formatVnd(metrics.refundedAmount)} helper="Yêu cầu hoàn tiền đã hoàn tất" icon={Undo2} />
        <MetricCard title="Doanh thu thuần" value={isLoading ? "..." : formatVnd(metrics.netRevenue)} helper="Gộp - Hoàn trả" icon={Wallet} />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Trạng thái đơn hàng</h2>
          <p className="mb-5 text-sm text-gray-500">Phân bổ đơn trong kỳ đã chọn</p>
          <div className="space-y-3">
            {metrics.orderByStatus.map((item) => (
              <div key={item.status}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{orderStatusLabels[item.status]}</span>
                  <span className="text-gray-600">
                    {item.count} đơn ({item.percent}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div className="h-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600" style={{ width: `${item.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            <MiniStat label="Tổng đơn" value={metrics.totalOrders} />
            <MiniStat label="Đã giao" value={metrics.deliveredOrders} />
            <MiniStat label="Đã hủy" value={metrics.cancelledOrders} />
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Top sản phẩm theo doanh thu</h2>
          <p className="mb-5 text-sm text-gray-500">Dựa trên đơn đã giao trong kỳ</p>
          {isLoading ? (
            <div className="text-sm text-gray-500">Đang tải dữ liệu...</div>
          ) : metrics.topProducts.length === 0 ? (
            <div className="text-sm text-gray-500">Chưa có dữ liệu doanh thu sản phẩm.</div>
          ) : (
            <div className="space-y-3">
              {metrics.topProducts.map((item, index) => (
                <div key={item.product_id} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      #{index + 1} {item.product_name}
                    </p>
                    <p className="text-xs text-gray-500">Đã bán: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-bold text-blue-600">{formatVnd(item.revenue)}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <SimpleCard
          icon={Package}
          title="Tỷ lệ giao thành công"
          value={metrics.totalOrders > 0 ? `${Math.round((metrics.deliveredOrders / metrics.totalOrders) * 100)}%` : "0%"}
        />
        <SimpleCard
          icon={ShoppingCart}
          title="Tỷ lệ hủy đơn"
          value={metrics.totalOrders > 0 ? `${Math.round((metrics.cancelledOrders / metrics.totalOrders) * 100)}%` : "0%"}
        />
      </div>
    </main>
  );
}

function MetricCard({ title, value, helper, icon: Icon }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <Icon className="h-5 w-5 text-purple-600" />
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{helper}</p>
    </div>
  );
}

function SimpleCard({ icon: Icon, title, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-gray-600">
        <Icon className="h-4 w-4" />
        <p className="text-sm font-medium">{title}</p>
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
}
