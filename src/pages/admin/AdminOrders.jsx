import React, { useEffect, useMemo, useState } from "react";
import { Download, Eye, Package, Save, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { getErrorMessageVi } from "../../lib/api";
import {
  getAdminOrders,
  getAdminRefundRequests,
  updateOrderStatus,
  updateRefundStatus,
} from "../../services/adminApi";
import { useAdminNotifications } from "../../components/admin/AdminNotificationsContext";

const paymentLabels = {
  COD: "COD",
  BANK_TRANSFER: "Chuyển khoản",
};

const paymentStatusLabels = {
  UNPAID: "Chưa thanh toán",
  PAID: "Đã thanh toán",
  FAILED: "Thanh toán thất bại",
  REFUNDED: "Đã hoàn tiền",
};

const statusLabels = {
  PENDING: "Chờ xử lý",
  CONFIRMED: "Đã xác nhận",
  SHIPPING: "Đang giao",
  DELIVERED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

const refundStatusLabels = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  COMPLETED: "Đã hoàn tiền",
};

const refundStatusStyles = {
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  APPROVED: "bg-blue-100 text-blue-700 border-blue-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
  COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const statusOptions = ["PENDING", "CONFIRMED", "SHIPPING", "DELIVERED", "CANCELLED"];

const getAllowedNextStatuses = (currentStatus) => {
  switch (currentStatus) {
    case "PENDING":
      return ["PENDING", "CONFIRMED", "CANCELLED"];
    case "CONFIRMED":
      return ["CONFIRMED", "SHIPPING"];
    case "SHIPPING":
      return ["SHIPPING", "DELIVERED"];
    case "DELIVERED":
      return ["DELIVERED"];
    case "CANCELLED":
      return ["CANCELLED"];
    default:
      return ["PENDING"];
  }
};

const getStatusBadge = (status) => {
  const styles = {
    PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
    CONFIRMED: "bg-indigo-100 text-indigo-700 border-indigo-200",
    SHIPPING: "bg-blue-100 text-blue-700 border-blue-200",
    DELIVERED: "bg-green-100 text-green-700 border-green-200",
    CANCELLED: "bg-red-100 text-red-700 border-red-200",
  };
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${styles[status]}`}>
      {statusLabels[status]}
    </span>
  );
};

export function AdminOrders() {
  const PAGE_SIZE = 10;
  const { refreshToken } = useAdminNotifications();
  const [orders, setOrders] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingRefund, setIsUpdatingRefund] = useState(false);
  const [refundAdminNote, setRefundAdminNote] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let isMounted = true;
    async function loadOrders() {
      setIsLoading(true);
      try {
        const [ordersData, refundsData] = await Promise.all([getAdminOrders(), getAdminRefundRequests()]);
        if (!isMounted) return;
        setOrders(ordersData);
        setRefunds(refundsData);
      } catch (error) {
        toast.error("Không thể tải dữ liệu đơn hàng", {
          description: getErrorMessageVi(error, "Không thể tải dữ liệu đơn hàng."),
        });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadOrders();
    return () => {
      isMounted = false;
    };
  }, [refreshToken]);

  const openOrderDetail = (order) => {
    setSelectedOrder(order);
    setSelectedStatus(order.status || "PENDING");
    setRefundAdminNote("");
  };

  const closeOrderDetail = () => {
    setSelectedOrder(null);
    setSelectedStatus("");
    setRefundAdminNote("");
  };

  const filteredOrders = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return orders.filter((order) => {
      const matchSearch =
        !keyword ||
        order.code.toLowerCase().includes(keyword) ||
        (order.customer_name || "").toLowerCase().includes(keyword) ||
        (order.customer_phone || "").toLowerCase().includes(keyword);
      const matchStatus = statusFilter === "all" || order.status === statusFilter;
      const matchPayment = paymentFilter === "all" || order.payment_method === paymentFilter;
      return matchSearch && matchStatus && matchPayment;
    }).sort((a, b) => {
      const aTime = new Date(a.order_date || a.created_at || 0).getTime();
      const bTime = new Date(b.order_date || b.created_at || 0).getTime();
      if (aTime && bTime && aTime !== bTime) return bTime - aTime;
      return Number(b.id || 0) - Number(a.id || 0);
    });
  }, [orders, searchTerm, statusFilter, paymentFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const pagedOrders = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredOrders.slice(start, start + PAGE_SIZE);
  }, [filteredOrders, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, paymentFilter]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const latestRefundByOrderId = useMemo(() => {
    const map = new Map();
    refunds.forEach((refund) => {
      const key = String(refund.order_id);
      const existing = map.get(key);
      if (!existing || new Date(refund.created_at) > new Date(existing.created_at)) {
        map.set(key, refund);
      }
    });
    return map;
  }, [refunds]);

  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === "PENDING").length;
    const completed = orders.filter((o) => o.status === "DELIVERED").length;
    const grossRevenue = orders
      .filter((o) => o.status === "DELIVERED")
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    const refundedAmount = refunds
      .filter((r) => r.status === "COMPLETED")
      .reduce((sum, r) => sum + Number(r.refund_amount || 0), 0);
    const revenue = Math.max(grossRevenue - refundedAmount, 0);
    return { total, pending, completed, revenue };
  }, [orders, refunds]);

  const hasStatusChanged = selectedOrder && selectedStatus && selectedStatus !== selectedOrder.status;
  const allowedStatusOptions = useMemo(() => getAllowedNextStatuses(selectedOrder?.status), [selectedOrder]);
  const orderRefunds = useMemo(() => {
    if (!selectedOrder) return [];
    return refunds
      .filter((item) => String(item.order_id) === String(selectedOrder.id))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [refunds, selectedOrder]);

  const handleSaveStatus = async () => {
    if (!selectedOrder || !selectedStatus || !hasStatusChanged) return;
    setIsUpdatingStatus(true);
    try {
      const updated = await updateOrderStatus(selectedOrder.id, selectedStatus);
      setOrders((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setSelectedOrder(updated);
      setSelectedStatus(updated.status);
      toast.success("Cập nhật trạng thái thành công");
    } catch (error) {
      toast.error("Không thể cập nhật trạng thái", {
        description: getErrorMessageVi(error, "Không thể cập nhật trạng thái đơn hàng."),
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleRefundStatus = async (refund, nextStatus) => {
    setIsUpdatingRefund(true);
    try {
      const updated = await updateRefundStatus(refund.id, nextStatus, refundAdminNote);
      setRefunds((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      toast.success("Cập nhật yêu cầu hoàn tiền thành công");
      if (nextStatus === "COMPLETED" && selectedOrder?.id) {
        const freshOrder = await getAdminOrders();
        setOrders(freshOrder);
        const current = freshOrder.find((o) => String(o.id) === String(selectedOrder.id));
        if (current) setSelectedOrder(current);
      }
    } catch (error) {
      toast.error("Không thể cập nhật yêu cầu hoàn tiền", {
        description: getErrorMessageVi(error, "Không thể cập nhật yêu cầu hoàn tiền."),
      });
    } finally {
      setIsUpdatingRefund(false);
    }
  };

  return (
    <main className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Đơn hàng</h1>
          <p className="mt-1 text-gray-600">Theo dõi và quản lý đơn hàng khách hàng</p>
        </div>
        {/* <Button variant="outline" className="h-11 px-6">
          <Download className="mr-2 h-5 w-5" />
          Xuất đơn hàng
        </Button> */}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        <Stat title="Tổng đơn" value={stats.total} />
        <Stat title="Chờ xử lý" value={stats.pending} />
        <Stat title="Hoàn thành" value={stats.completed} />
        <Stat title="Doanh thu" value={`${stats.revenue.toLocaleString("vi-VN")} đ`} />
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã đơn, tên khách, SĐT..."
              className="h-11 bg-gray-50 pl-11"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {statusLabels[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Thanh toán" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả phương thức</SelectItem>
              <SelectItem value="COD">COD</SelectItem>
              <SelectItem value="BANK_TRANSFER">Chuyển khoản</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                <TableHead>Mã đơn hàng</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Ngày & giờ</TableHead>
                <TableHead>Sản phẩm</TableHead>
                <TableHead>Tổng tiền</TableHead>
                <TableHead>Thanh toán</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Hoàn tiền</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center">
                    Đang tải đơn hàng...
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center">
                    Không có đơn hàng khớp điều kiện.
                  </TableCell>
                </TableRow>
              ) : (
                pagedOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-purple-50/50">
                    <TableCell className="font-medium text-purple-600">{order.code}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-semibold text-gray-900">{order.customer_name}</div>
                        <div className="text-xs text-gray-500">{order.customer_email || order.customer_phone}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{new Date(order.order_date).toLocaleString("vi-VN")}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-2.5 py-1 text-sm font-medium text-gray-700">
                        <Package className="h-4 w-4 text-gray-500" />
                        {order.item_count}
                      </span>
                    </TableCell>
                    <TableCell className="font-bold text-gray-900">{order.total_amount.toLocaleString("vi-VN")} đ</TableCell>
                    <TableCell className="text-sm font-medium text-gray-700">{paymentLabels[order.payment_method]}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      {(() => {
                        const refund = latestRefundByOrderId.get(String(order.id));
                        if (!refund) {
                          return <span className="text-xs text-gray-500">Không có</span>;
                        }
                        return (
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                              refundStatusStyles[refund.status] || "bg-gray-100 text-gray-700 border-gray-200"
                            }`}
                          >
                            {refundStatusLabels[refund.status] || refund.status}
                          </span>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Button variant="ghost" size="sm" onClick={() => openOrderDetail(order)}>
                          <Eye className="mr-1.5 h-4 w-4" />
                          Xem
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-6 py-4">
          <span className="text-sm font-medium text-gray-600">
            Trang {currentPage}/{totalPages} - {filteredOrders.length} đơn hàng
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
              Trước
            </Button>
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>
              Sau
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={Boolean(selectedOrder)} onOpenChange={(open) => !open && closeOrderDetail()}>
        <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết đơn hàng {selectedOrder?.code}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 p-4 md:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-500">Khách hàng</p>
                  <p className="font-semibold text-gray-900">{selectedOrder.customer_name}</p>
                  <p className="text-sm text-gray-700">{selectedOrder.customer_phone}</p>
                  <p className="text-sm text-gray-700">{selectedOrder.customer_email || "Không có email"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Địa chỉ giao hàng</p>
                  <p className="font-medium text-gray-900">{selectedOrder.shipping_address}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Ngày đặt</p>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedOrder.order_date).toLocaleString("vi-VN")}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-gray-500">Trạng thái đơn</p>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                  >
                    {allowedStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {statusLabels[status]}
                      </option>
                    ))}
                  </select>
                  <Button
                    className="mt-3 w-full bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={handleSaveStatus}
                    disabled={!hasStatusChanged || isUpdatingStatus}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isUpdatingStatus ? "Đang cập nhật..." : "Lưu trạng thái"}
                  </Button>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Trạng thái thanh toán</p>
                  <p className="font-medium text-gray-900">
                    {paymentStatusLabels[selectedOrder.payment_status] || selectedOrder.payment_status}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Phương thức: {paymentLabels[selectedOrder.payment_method] || selectedOrder.payment_method}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200">
                <div className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900">
                  Sản phẩm trong đơn
                </div>
                <div className="divide-y divide-gray-100">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-3 text-sm">
                      <div>
                        <p className="font-medium text-gray-900">{item.product_name}</p>
                        <p className="text-xs text-gray-500">SL: {item.quantity}</p>
                      </div>
                      <div className="text-gray-700">{item.unit_price.toLocaleString("vi-VN")} đ</div>
                      <div className="font-semibold text-gray-900">{item.total_price.toLocaleString("vi-VN")} đ</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <p className="mb-2 text-sm font-semibold text-gray-900">Yêu cầu hoàn tiền</p>
                {orderRefunds.length === 0 ? (
                  <p className="text-sm text-gray-600">Đơn hàng này chưa có yêu cầu hoàn tiền.</p>
                ) : (
                  <div className="space-y-3">
                    {orderRefunds.map((refund) => (
                      <div key={refund.id} className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
                        <p className="font-semibold text-gray-900">
                          {refundStatusLabels[refund.status] || refund.status}
                        </p>
                        <p className="mt-1 text-gray-700">Lý do: {refund.reason}</p>
                        <p className="mt-1 text-gray-700">
                          Số tiền: {Number(refund.refund_amount || 0).toLocaleString("vi-VN")} đ
                        </p>
                        {refund.admin_note ? (
                          <p className="mt-1 text-gray-700">Ghi chú: {refund.admin_note}</p>
                        ) : null}
                        {refund.status !== "REJECTED" && refund.status !== "COMPLETED" ? (
                          <div className="mt-3 space-y-2">
                            <Textarea
                              value={refundAdminNote}
                              onChange={(e) => setRefundAdminNote(e.target.value)}
                              placeholder="Ghi chú xử lý refund (tùy chọn)"
                              className="min-h-[72px] bg-white"
                            />
                            <div className="flex flex-wrap gap-2">
                              {refund.status === "PENDING" ? (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleRefundStatus(refund, "APPROVED")}
                                    disabled={isUpdatingRefund}
                                  >
                                    Duyệt refund
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRefundStatus(refund, "REJECTED")}
                                    disabled={isUpdatingRefund}
                                  >
                                    Từ chối
                                  </Button>
                                </>
                              ) : null}
                              {refund.status === "APPROVED" ? (
                                <Button
                                  size="sm"
                                  onClick={() => handleRefundStatus(refund, "COMPLETED")}
                                  disabled={isUpdatingRefund}
                                >
                                  Xác nhận đã hoàn tiền
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="ml-auto w-full max-w-sm space-y-2 rounded-lg border border-gray-200 p-4 text-sm">
                <Line label="Tạm tính" value={selectedOrder.subtotal_amount} />
                <Line label="Phí ship" value={selectedOrder.shipping_fee} />
                <Line label="Giảm giá" value={selectedOrder.discount_amount} isMinus />
                <div className="border-t border-gray-200 pt-2">
                  <Line label="Tổng cộng" value={selectedOrder.total_amount} emphasize />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

function Line({ label, value, isMinus = false, emphasize = false }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600">{label}</span>
      <span className={emphasize ? "text-base font-bold text-gray-900" : "font-medium text-gray-900"}>
        {isMinus ? "-" : ""}
        {Number(value || 0).toLocaleString("vi-VN")} đ
      </span>
    </div>
  );
}

function Stat({ title, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-black text-gray-900">{value}</p>
    </div>
  );
}
