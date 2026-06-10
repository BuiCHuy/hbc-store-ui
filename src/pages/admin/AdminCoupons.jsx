import React, { useEffect, useMemo, useState } from "react";
import { Ticket, Plus, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { toast } from "sonner";

import { StatCard } from "../../components/admin/StatCard";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { CouponsTable } from "../../components/admin/CouponsTable";
import { AddCouponModal } from "../../components/admin/AddCouponModal";
import { getErrorMessageVi } from "../../lib/api";
import { createCoupon, deleteCoupon, getCoupons, updateCoupon } from "../../services/adminApi";

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

export function AdminCoupons() {
  const [isAddCouponModalOpen, setIsAddCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    let isMounted = true;

    async function loadCoupons() {
      setIsLoading(true);
      try {
        const data = await getCoupons();
        if (isMounted) setCoupons(data);
      } catch (error) {
        console.error("Lỗi tải mã giảm giá:", error);
        toast.error("Không tải được danh sách mã giảm giá", {
          description: getErrorMessageVi(error, "Không thể tải danh sách mã giảm giá."),
        });
        if (isMounted) setCoupons([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadCoupons();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddCoupon = async (formData) => {
    try {
      const savedCoupon = await createCoupon(formData);
      setCoupons((current) => [savedCoupon, ...current]);

      const discountDisplay =
        formData.discountType === "PERCENTAGE"
          ? `${formData.discountValue}%`
          : `${Number(formData.discountValue).toLocaleString("vi-VN")}đ`;

      toast.success("Mã giảm giá đã được kích hoạt thành công!", {
        description: `Mã "${formData.code}" (giảm ${discountDisplay}) đã sẵn sàng cho khách hàng sử dụng.`,
      });
      setIsAddCouponModalOpen(false);
    } catch (error) {
      toast.error("Không thể tạo mã giảm giá", {
        description: getErrorMessageVi(error, "Không thể tạo mã giảm giá."),
      });
    }
  };

  const handleEditCoupon = async (formData) => {
    if (!editingCoupon) return;
    try {
      const savedCoupon = await updateCoupon(editingCoupon.id, formData);
      setCoupons((current) =>
        current.map((item) => (item.id === editingCoupon.id ? savedCoupon : item))
      );
      toast.success("Cập nhật mã giảm giá thành công!");
      setEditingCoupon(null);
    } catch (error) {
      toast.error("Không thể cập nhật mã giảm giá", {
        description: getErrorMessageVi(error, "Không thể cập nhật mã giảm giá."),
      });
    }
  };

  const handleDeleteCoupon = async (coupon) => {
    try {
      await deleteCoupon(coupon.id);
      setCoupons((current) =>
        current.map((item) =>
          item.id === coupon.id ? { ...item, status: "inactive" } : item
        )
      );
      toast.success("Đã ẩn mã giảm giá");
    } catch (error) {
      toast.error("Không thể ẩn mã giảm giá", {
        description: getErrorMessageVi(error, "Không thể ẩn mã giảm giá."),
      });
    }
  };

  const stats = useMemo(() => {
    const total = coupons.length;
    const active = coupons.filter((coupon) => getCouponDisplayStatus(coupon) === "active").length;
    const usage = coupons.reduce((sum, coupon) => sum + Number(coupon.usage_count || 0), 0);

    const now = new Date();
    const sevenDaysLater = new Date(now);
    sevenDaysLater.setDate(now.getDate() + 7);
    const expiringSoon = coupons.filter((coupon) => {
      if (!coupon.end_date) return false;
      const endDate = new Date(coupon.end_date);
      return endDate >= now && endDate <= sevenDaysLater;
    }).length;
    return { total, active, usage, expiringSoon };
  }, [coupons]);

  const filteredCoupons = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return coupons.filter((coupon) => {
      const matchSearch = !keyword || coupon.code.toLowerCase().includes(keyword);
      const matchStatus =
        statusFilter === "all" || getCouponDisplayStatus(coupon) === statusFilter;
      const matchType = typeFilter === "all" || coupon.discount_type === typeFilter;
      return matchSearch && matchStatus && matchType;
    }).sort((a, b) => {
      const aTime = new Date(a.created_at || a.createdAt || 0).getTime();
      const bTime = new Date(b.created_at || b.createdAt || 0).getTime();
      if (aTime && bTime && aTime !== bTime) return bTime - aTime;
      return Number(b.id || 0) - Number(a.id || 0);
    });
  }, [coupons, searchTerm, statusFilter, typeFilter]);

  return (
    <main className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mã giảm giá</h1>
          <p className="mt-1 text-gray-600">Quản lý mã giảm giá và chiến dịch khuyến mại</p>
        </div>
        <Button
          className="h-11 bg-gradient-to-r from-purple-600 to-blue-600 px-6 font-medium text-white shadow-lg shadow-purple-500/30 hover:from-purple-700 hover:to-blue-700"
          onClick={() => setIsAddCouponModalOpen(true)}
        >
          <Plus className="mr-2 h-5 w-5" />
          Tạo mã giảm giá
        </Button>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Tổng mã giảm giá" value={String(stats.total)} icon={Ticket} iconBgColor="bg-purple-100" iconColor="text-purple-600" trend={{ value: "Theo dữ liệu", isPositive: true }} />
        <StatCard title="Mã đang hoạt động" value={String(stats.active)} icon={CheckCircle} iconBgColor="bg-green-100" iconColor="text-green-600" trend={{ value: "Theo dữ liệu", isPositive: true }} />
        <StatCard title="Tổng lượt sử dụng" value={stats.usage.toLocaleString("vi-VN")} icon={TrendingUp} iconBgColor="bg-blue-100" iconColor="text-blue-600" trend={{ value: "Theo dữ liệu", isPositive: true }} />
        <StatCard title="Sắp hết hạn" value={String(stats.expiringSoon)} icon={Clock} iconBgColor="bg-orange-100" iconColor="text-orange-600" trend={{ value: "Trong 7 ngày", isPositive: false }} />
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã giảm giá..."
            className="h-11 md:col-span-2"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="active">Đang hoạt động</SelectItem>
              <SelectItem value="scheduled">Đã lên lịch</SelectItem>
              <SelectItem value="expired">Hết hạn</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Loại giảm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả loại</SelectItem>
              <SelectItem value="PERCENTAGE">Phần trăm</SelectItem>
              <SelectItem value="FIXED_AMOUNT">Số tiền cố định</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <CouponsTable
        coupons={filteredCoupons}
        isLoading={isLoading}
        onDeleteCoupon={handleDeleteCoupon}
        onEditCoupon={setEditingCoupon}
      />

      {isAddCouponModalOpen && (
        <AddCouponModal
          isOpen={isAddCouponModalOpen}
          onClose={() => setIsAddCouponModalOpen(false)}
          onSave={handleAddCoupon}
        />
      )}
      {editingCoupon && (
        <AddCouponModal
          isOpen={Boolean(editingCoupon)}
          onClose={() => setEditingCoupon(null)}
          onSave={handleEditCoupon}
          initialData={editingCoupon}
          title="Cập nhật mã giảm giá"
          submitLabel="Lưu thay đổi"
        />
      )}
    </main>
  );
}
