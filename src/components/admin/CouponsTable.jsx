import React, { useEffect, useMemo, useState } from "react";
import { Copy, Edit, MoreVertical, Search, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

const PAGE_SIZE = 10;

const statusStyles = {
  active: "bg-green-100 text-green-700 border-green-200",
  expired: "bg-gray-100 text-gray-700 border-gray-200",
  scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  inactive: "bg-slate-100 text-slate-700 border-slate-200",
};

const statusLabels = {
  active: "Đang hoạt động",
  expired: "Hết hạn",
  scheduled: "Đã lên lịch",
  inactive: "Tạm ẩn",
};

function getCouponDisplayStatus(coupon) {
  const now = Date.now();
  const start = coupon?.start_date ? new Date(coupon.start_date).getTime() : null;
  const end = coupon?.end_date ? new Date(coupon.end_date).getTime() : null;
  const baseStatus = String(coupon?.status || "").toLowerCase();

  if (Number.isFinite(end) && end < now) return "expired";
  if (baseStatus === "inactive") return "inactive";
  if (Number.isFinite(start) && start > now) return "scheduled";
  return "active";
}

export function CouponsTable({ coupons = [], isLoading = false, onDeleteCoupon }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingCoupon, setDeletingCoupon] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  const filteredCoupons = useMemo(
    () => coupons.filter((coupon) => coupon.code.toLowerCase().includes(searchTerm.toLowerCase())),
    [coupons, searchTerm]
  );

  const totalPages = Math.max(1, Math.ceil(filteredCoupons.length / PAGE_SIZE));
  const pagedCoupons = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredCoupons.slice(start, start + PAGE_SIZE);
  }, [filteredCoupons, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, coupons.length]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
  };

  const confirmDelete = async () => {
    if (!deletingCoupon || !onDeleteCoupon) return;
    await onDeleteCoupon(deletingCoupon);
    setDeletingCoupon(null);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Tất cả mã giảm giá</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 rounded-lg border border-gray-300 py-2 pl-10 pr-4 transition-shadow focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-gray-200 bg-gray-50/80">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">ID</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Mã giảm giá</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Loại giảm giá</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Giá trị giảm</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Đơn tối thiểu</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Giảm tối đa</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Thời hạn</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Giới hạn sử dụng</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Trạng thái</th>
              <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-700">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={10} className="px-6 py-8 text-center text-sm text-gray-500">
                  Đang tải mã giảm giá...
                </td>
              </tr>
            ) : pagedCoupons.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-8 text-center text-sm text-gray-500">
                  Chưa có mã giảm giá trong cơ sở dữ liệu.
                </td>
              </tr>
            ) : (
              pagedCoupons.map((coupon) => {
                const displayStatus = getCouponDisplayStatus(coupon);
                const usagePercent =
                  coupon.usage_limit > 0
                    ? Math.min(100, Math.round((coupon.usage_count / coupon.usage_limit) * 100))
                    : 0;

                return (
                  <tr key={coupon.id} className="transition-colors hover:bg-purple-50/50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="text-sm font-medium text-purple-600">#{coupon.id}</span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="rounded-lg border border-purple-200 bg-purple-100 px-3 py-1.5 text-sm font-bold text-purple-700 shadow-sm">
                          {coupon.code}
                        </code>
                        <button
                          onClick={() => copyToClipboard(coupon.code)}
                          className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-purple-50 hover:text-purple-600"
                          title="Sao chép mã"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
                          coupon.discount_type === "PERCENTAGE"
                            ? "border-green-200 bg-green-50 text-green-700"
                            : "border-blue-200 bg-blue-50 text-blue-700"
                        }`}
                      >
                        {coupon.discount_type === "PERCENTAGE" ? "Phần trăm %" : "Số tiền cố định"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-gray-900">
                      {coupon.discount_type === "PERCENTAGE"
                        ? `${coupon.discount_value}%`
                        : formatPrice(coupon.discount_value)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                      {coupon.min_order_value > 0 ? formatPrice(coupon.min_order_value) : "Không yêu cầu"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                      {coupon.max_discount_amount ? formatPrice(coupon.max_discount_amount) : "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                      {new Date(coupon.start_date).toLocaleDateString("vi-VN")} đến{" "}
                      {new Date(coupon.end_date).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <div className="font-semibold text-gray-900">
                        {coupon.usage_count} / {coupon.usage_limit}
                      </div>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200">
                        <div className="h-1.5 rounded-full bg-purple-600" style={{ width: `${usagePercent}%` }} />
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${statusStyles[displayStatus]}`}>
                        {statusLabels[displayStatus]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:bg-purple-50 hover:text-purple-600">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-500 hover:bg-red-50 hover:text-red-600"
                          onClick={() => setDeletingCoupon(coupon)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:bg-gray-100">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-6 py-4">
        <span className="text-sm font-medium text-gray-600">
          Trang {currentPage}/{totalPages} - {filteredCoupons.length} mã giảm giá
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            className="border-gray-200 bg-white"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            className="border-gray-200 bg-white"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            Sau
          </Button>
        </div>
      </div>

      <AlertDialog open={Boolean(deletingCoupon)} onOpenChange={(open) => !open && setDeletingCoupon(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ẩn mã giảm giá?</AlertDialogTitle>
            <AlertDialogDescription>
              Mã "{deletingCoupon?.code}" sẽ chuyển sang trạng thái tạm ẩn và không còn áp dụng.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Xác nhận</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
