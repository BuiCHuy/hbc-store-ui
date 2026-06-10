import React, { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Edit,
  Percent,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { StatCard } from "../../components/admin/StatCard";
import { PromotionModal } from "../../components/admin/PromotionModal";
import { getErrorMessageVi } from "../../lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { getBrands, getCategories, getProducts } from "../../hooks/useCatalog";
import {
  createPromotion,
  deletePromotion,
  getPromotions,
  updatePromotion,
} from "../../services/adminApi";

const statusStyles = {
  ACTIVE: "border-green-200 bg-green-50 text-green-700",
  INACTIVE: "border-gray-200 bg-gray-50 text-gray-600",
  EXPIRED: "border-red-200 bg-red-50 text-red-700",
};

const statusLabels = {
  ACTIVE: "Đang hoạt động",
  INACTIVE: "Tạm ẩn",
  EXPIRED: "Hết hạn",
};

const targetLabels = {
  PRODUCT: "Sản phẩm",
  CATEGORY: "Danh mục",
  BRAND: "Thương hiệu",
};

function getPromotionDisplayStatus(promotion) {
  const rawStatus = String(promotion?.status || "").toUpperCase();
  if (rawStatus !== "ACTIVE") return rawStatus || "INACTIVE";

  const now = Date.now();
  const start = promotion?.start_date ? new Date(promotion.start_date).getTime() : null;
  const end = promotion?.end_date ? new Date(promotion.end_date).getTime() : null;

  if (Number.isFinite(end) && end < now) return "EXPIRED";
  if (Number.isFinite(start) && start > now) return "INACTIVE";
  return "ACTIVE";
}

export function AdminPromotions() {
  const PAGE_SIZE = 10;
  const [promotions, setPromotions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [deletingPromotion, setDeletingPromotion] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      try {
        const [promotionData, categoryData, productData, brandData] = await Promise.all([
          getPromotions(),
          getCategories(),
          getProducts(),
          getBrands(),
        ]);

        if (!isMounted) return;
        setPromotions(promotionData);
        setCategories(categoryData.filter((category) => category.status !== "INACTIVE"));
        setProducts(productData.filter((product) => product.status !== "INACTIVE"));
        setBrands(brandData.filter((brand) => brand.status !== "INACTIVE"));
      } catch (error) {
        console.error("Lỗi tải khuyến mại:", error);
        toast.error("Không thể tải chương trình khuyến mại", {
          description: getErrorMessageVi(error, "Không thể tải chương trình khuyến mại."),
        });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredPromotions = useMemo(
    () =>
      promotions
        .filter((promotion) =>
          promotion.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
          const aTime = new Date(a.created_at || a.createdAt || 0).getTime();
          const bTime = new Date(b.created_at || b.createdAt || 0).getTime();
          if (aTime && bTime && aTime !== bTime) return bTime - aTime;
          return Number(b.id || 0) - Number(a.id || 0);
        }),
    [promotions, searchTerm]
  );

  const totalPages = Math.max(1, Math.ceil(filteredPromotions.length / PAGE_SIZE));
  const pagedPromotions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredPromotions.slice(start, start + PAGE_SIZE);
  }, [filteredPromotions, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const activeCount = promotions.filter(
    (item) => getPromotionDisplayStatus(item) === "ACTIVE"
  ).length;
  const handleOpenCreate = () => {
    setEditingPromotion(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (promotion) => {
    setEditingPromotion(promotion);
    setIsModalOpen(true);
  };

  const handleSavePromotion = async (promotionData) => {
    try {
      if (editingPromotion) {
        const savedPromotion = await updatePromotion(editingPromotion.id, promotionData);
        setPromotions((current) =>
          current.map((promotion) =>
            promotion.id === editingPromotion.id ? savedPromotion : promotion
          )
        );
        toast.success("Cập nhật chương trình khuyến mại thành công!");
      } else {
        const savedPromotion = await createPromotion(promotionData);
        setPromotions((current) => [savedPromotion, ...current]);
        toast.success("Tạo chương trình khuyến mại thành công!");
      }
      setIsModalOpen(false);
      setEditingPromotion(null);
    } catch (error) {
      toast.error("Không thể lưu chương trình khuyến mại", {
        description: getErrorMessageVi(error, "Không thể lưu chương trình khuyến mại."),
      });
    }
  };

  const confirmDeletePromotion = async () => {
    if (!deletingPromotion) return;
    try {
      await deletePromotion(deletingPromotion.id);
      setPromotions((current) =>
        current.map((item) =>
          item.id === deletingPromotion.id ? { ...item, status: "INACTIVE" } : item
        )
      );
      toast.success("Đã ẩn chương trình khuyến mại");
    } catch (error) {
      toast.error("Không thể ẩn chương trình khuyến mại", {
        description: getErrorMessageVi(error, "Không thể ẩn chương trình khuyến mại."),
      });
    } finally {
      setDeletingPromotion(null);
    }
  };

  return (
    <main className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Khuyến mại</h1>
          <p className="mt-1 text-gray-600">
            Quản lý các đợt sale áp dụng trực tiếp lên sản phẩm, danh mục và thương hiệu
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="h-11 bg-gradient-to-r from-purple-600 to-blue-600 px-6 text-white shadow-lg shadow-purple-500/30 hover:from-purple-700 hover:to-blue-700"
        >
          <Plus className="mr-2 h-5 w-5" />
          Thêm khuyến mại
        </Button>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Tổng chương trình" value={promotions.length} icon={Sparkles} iconBgColor="bg-purple-100" iconColor="text-purple-600" />
        <StatCard title="Đang hoạt động" value={activeCount} icon={Zap} iconBgColor="bg-green-100" iconColor="text-green-600" />
        <StatCard title="Ưu tiên cao nhất" value={Math.max(...promotions.map((item) => item.priority), 0)} icon={Percent} iconBgColor="bg-blue-100" iconColor="text-blue-600" />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-gray-900">Tất cả chương trình</h2>
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Tìm theo tên chương trình..."
                className="h-10 pl-10"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50/80">
              <tr>
                <TableHead>ID</TableHead>
                <TableHead>Chương trình</TableHead>
                <TableHead>Giảm giá</TableHead>
                <TableHead>Áp dụng</TableHead>
                <TableHead>Thời hạn</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                    Đang tải khuyến mại...
                  </td>
                </tr>
              ) : filteredPromotions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                    Chưa có chương trình khuyến mại trong cơ sở dữ liệu.
                  </td>
                </tr>
              ) : (
                pagedPromotions.map((promotion) => (
                  <tr key={promotion.id} className="transition-colors hover:bg-purple-50/50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-purple-600">
                      #{promotion.id}
                    </td>
                    <td className="min-w-[260px] px-6 py-4">
                      <div className="font-bold text-gray-900">{promotion.name}</div>
                      <p className="mt-1 line-clamp-1 text-sm text-gray-500">
                        {promotion.description || "Không có mô tả"}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-gray-500">
                        Ưu tiên: {promotion.priority}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="font-bold text-blue-600">{formatDiscount(promotion)}</span>
                    </td>
                    <td className="min-w-[220px] px-6 py-4">
                      <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                        {targetLabels[promotion.target_type]}
                      </span>
                      <p className="mt-2 text-sm text-gray-700">
                        {getTargetName(promotion, { categories, products, brands })}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <Calendar className="mt-0.5 h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">{formatDate(promotion.start_date)}</div>
                          <div className="text-xs text-gray-500">đến {formatDate(promotion.end_date)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusStyles[getPromotionDisplayStatus(promotion)]}`}>
                        {statusLabels[getPromotionDisplayStatus(promotion)]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:bg-purple-50 hover:text-purple-600" onClick={() => handleOpenEdit(promotion)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:bg-red-50 hover:text-red-600" onClick={() => setDeletingPromotion(promotion)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-6 py-4">
          <span className="text-sm font-medium text-gray-600">
            Hiển thị {filteredPromotions.length} trong {promotions.length} chương trình
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

      <PromotionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPromotion(null);
        }}
        onSave={handleSavePromotion}
        promotion={editingPromotion}
        categories={categories}
        products={products}
        brands={brands}
      />

      <AlertDialog open={Boolean(deletingPromotion)} onOpenChange={(open) => !open && setDeletingPromotion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ẩn chương trình khuyến mại?</AlertDialogTitle>
            <AlertDialogDescription>
              Chương trình "{deletingPromotion?.name}" sẽ chuyển sang trạng thái tạm ẩn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePromotion}>Xác nhận</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

function TableHead({ children, className = "" }) {
  return (
    <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 ${className}`}>
      {children}
    </th>
  );
}

function formatDiscount(promotion) {
  if (promotion.discount_type === "PERCENTAGE") return `${promotion.discount_value}%`;
  if (promotion.discount_type === "FIXED_PRICE") return `${promotion.discount_value.toLocaleString("vi-VN")}đ`;
  return `-${promotion.discount_value.toLocaleString("vi-VN")}đ`;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("vi-VN");
}

function getTargetName(promotion, catalog) {
  const firstId = promotion.target_ids?.[0];
  if (promotion.target_type === "CATEGORY") {
    return catalog.categories.find((category) => category.id === firstId)?.name || "N/A";
  }
  if (promotion.target_type === "BRAND") {
    return catalog.brands.find((brand) => Number(brand.id) === firstId)?.name || "N/A";
  }
  return catalog.products.find((product) => product.id === firstId)?.name || "N/A";
}
