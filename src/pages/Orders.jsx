import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Calendar, ChevronRight, Home, Package, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { confirmPayOSReturn, getMyOrders } from "../services/adminApi";

const statusConfig = {
  PENDING: "Đang xử lý",
  CONFIRMED: "Đã xác nhận",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã hủy",
};

const statusBadgeStyles = {
  PENDING: "bg-amber-50 text-amber-700 border border-amber-200",
  CONFIRMED: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  SHIPPING: "bg-blue-50 text-blue-700 border border-blue-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 border border-red-200",
};

const statusFilterStyles = {
  all: {
    active: "border-gray-900 bg-gray-900 text-white hover:bg-gray-800",
    idle: "border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50",
  },
  PENDING: {
    active: "border-amber-500 bg-amber-500 text-white hover:bg-amber-600",
    idle: "border-amber-200 text-amber-700 hover:border-amber-300 hover:bg-amber-50",
  },
  CONFIRMED: {
    active: "border-indigo-500 bg-indigo-500 text-white hover:bg-indigo-600",
    idle: "border-indigo-200 text-indigo-700 hover:border-indigo-300 hover:bg-indigo-50",
  },
  SHIPPING: {
    active: "border-blue-500 bg-blue-500 text-white hover:bg-blue-600",
    idle: "border-blue-200 text-blue-700 hover:border-blue-300 hover:bg-blue-50",
  },
  DELIVERED: {
    active: "border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600",
    idle: "border-emerald-200 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50",
  },
  CANCELLED: {
    active: "border-red-500 bg-red-500 text-white hover:bg-red-600",
    idle: "border-red-200 text-red-700 hover:border-red-300 hover:bg-red-50",
  },
};

export function Orders() {
  const { isLoggedIn, isAuthReady, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    if (!isAuthReady) return;
    if (!isLoggedIn) navigate("/login");
  }, [isAuthReady, isLoggedIn, navigate]);

  useEffect(() => {
    if (!isAuthReady || !isLoggedIn) return;
    const searchParams = new URLSearchParams(location.search);
    if (!searchParams.has("orderCode") && !searchParams.has("id") && !searchParams.has("code")) {
      return;
    }

    let active = true;
    async function handlePayOSReturn() {
      try {
        const paramsObject = Object.fromEntries(searchParams.entries());
        const result = await confirmPayOSReturn(paramsObject);
        if (active) {
          if (result?.message === "Payment confirmed") {
            toast.success("Thanh toán PayOS thành công");
          } else {
            toast.info("Bạn đã hủy hoặc chưa hoàn tất thanh toán");
          }
          navigate("/orders", { replace: true });
        }
      } catch (error) {
        if (active) {
          toast.error("Không thể xác nhận kết quả PayOS", {
            description: error.message,
          });
          navigate("/orders", { replace: true });
        }
      }
    }

    handlePayOSReturn();
    return () => {
      active = false;
    };
  }, [isAuthReady, isLoggedIn, location.search, navigate]);

  useEffect(() => {
    if (!isAuthReady || !isLoggedIn) return;
    let isMounted = true;

    async function loadOrders() {
      setIsLoading(true);
      try {
        const data = await getMyOrders();
        if (isMounted) setOrders(data);
      } catch (error) {
        toast.error("Không thể tải đơn hàng", {
          description: error.message,
        });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadOrders();
    return () => {
      isMounted = false;
    };
  }, [isAuthReady, isLoggedIn]);

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const matchesSearch = order.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === "all" || order.status === filterStatus;
        return matchesSearch && matchesStatus;
      }),
    [filterStatus, orders, searchTerm]
  );

  if (!isAuthReady || !isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <main className="user-container py-8">
        <div className="mb-8">
          <nav className="mb-4 flex items-center gap-1.5 text-xs text-gray-500">
            <Link
              to="/"
              className="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-purple-600"
            >
              <Home className="h-3.5 w-3.5" />
              Trang chủ
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
            <span className="font-semibold text-gray-900">Đơn hàng của tôi</span>
          </nav>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-gray-900">Đơn hàng của tôi</h1>
              <p className="text-gray-600">Quản lý và theo dõi trạng thái đơn hàng của bạn</p>
            </div>
            <div className="flex w-fit items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
              <div className="text-right">
                <p className="text-xs font-semibold uppercase text-gray-500">Tài khoản</p>
                <p className="font-bold text-gray-900">{user?.name}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-600">
                <Package className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder="Tìm kiếm theo mã đơn hàng"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="h-11 bg-gray-50 pl-10 transition-colors focus:bg-white"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {[
                ["all", "Tất cả"],
                ["PENDING", "Đang xử lý"],
                ["CONFIRMED", "Đã xác nhận"],
                ["SHIPPING", "Đang giao"],
                ["DELIVERED", "Đã giao"],
                ["CANCELLED", "Đã hủy"],
              ].map(([value, label]) => {
                const styleConfig = statusFilterStyles[value] || statusFilterStyles.all;
                return (
                  <Button
                    key={value}
                    variant="outline"
                    onClick={() => setFilterStatus(value)}
                    className={`h-11 whitespace-nowrap border font-semibold ${
                      filterStatus === value ? styleConfig.active : styleConfig.idle
                    }`}
                  >
                    {label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {isLoading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-500 shadow-sm">
              Đang tải đơn hàng...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-16 text-center shadow-sm">
              <Package className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <h3 className="mb-2 text-xl font-bold text-gray-900">Không tìm thấy đơn hàng nào</h3>
              <p className="mb-8 text-gray-500">
                Đơn hàng sẽ hiển thị tại đây sau khi bạn đặt hàng.
              </p>
              <Button onClick={() => navigate("/")}>Tiếp tục mua sắm</Button>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white transition-shadow hover:shadow-md"
              >
                <div className="flex flex-col justify-between gap-4 px-6 py-5 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50">
                      <Package className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{order.code}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Đặt ngày {new Date(order.order_date).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                      statusBadgeStyles[order.status] ||
                      "border border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                  >
                    {statusConfig[order.status] || order.status}
                  </span>
                </div>
                <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-100 px-6 py-4 sm:flex-row">
                  <span className="text-sm text-gray-600">{order.item_count} sản phẩm</span>
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-black text-blue-600">
                      {order.total_amount.toLocaleString("vi-VN")} đ
                    </span>
                    <Link to={`/orders/${order.id}`}>
                      <Button>Chi tiết đơn</Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
