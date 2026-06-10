import React, { useEffect, useMemo, useState } from "react";
import { Building2, Edit, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { getErrorMessageVi } from "../../lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { AddBrandModal } from "../../components/admin/AddBrandModal";
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
import { createBrand, deleteBrand, getBrands, updateBrand } from "../../hooks/useCatalog";

export function AdminBrands() {
  const PAGE_SIZE = 10;
  const [brands, setBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddBrandModalOpen, setIsAddBrandModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [deletingBrand, setDeletingBrand] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let isMounted = true;
    async function loadBrands() {
      setIsLoading(true);
      try {
        const data = await getBrands();
        if (isMounted) setBrands(data);
      } catch (error) {
        if (isMounted) setBrands([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadBrands();
    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const active = brands.filter((brand) => brand.status === "ACTIVE").length;
    return { total: brands.length, active, inactive: brands.length - active };
  }, [brands]);

  const filteredBrands = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return brands.filter((brand) => {
      const matchesSearch =
        !keyword ||
        brand.name.toLowerCase().includes(keyword) ||
        (brand.country || "").toLowerCase().includes(keyword) ||
        (brand.description || "").toLowerCase().includes(keyword);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && brand.status === "ACTIVE") ||
        (statusFilter === "inactive" && brand.status !== "ACTIVE");
      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      const aTime = new Date(a.created_at || a.createdAt || 0).getTime();
      const bTime = new Date(b.created_at || b.createdAt || 0).getTime();
      if (aTime && bTime && aTime !== bTime) return bTime - aTime;
      return Number(b.id || 0) - Number(a.id || 0);
    });
  }, [brands, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredBrands.length / PAGE_SIZE));
  const pagedBrands = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredBrands.slice(start, start + PAGE_SIZE);
  }, [filteredBrands, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handleCreateBrand = async (brandData) => {
    try {
      const savedBrand = await createBrand(brandData);
      setBrands((current) => [savedBrand, ...current]);
      toast.success("Thêm hãng thành công");
      setIsAddBrandModalOpen(false);
    } catch (error) {
      toast.error("Không thể thêm hãng", {
        description: getErrorMessageVi(error, "Không thể thêm hãng mới."),
      });
    }
  };

  const handleEditBrand = async (brandData) => {
    if (!editingBrand) return;
    try {
      const savedBrand = await updateBrand(editingBrand.id, brandData);
      setBrands((current) =>
        current.map((brand) => (brand.id === editingBrand.id ? savedBrand : brand))
      );
      toast.success("Cập nhật hãng thành công");
      setEditingBrand(null);
    } catch (error) {
      toast.error("Không thể cập nhật hãng", {
        description: getErrorMessageVi(error, "Không thể cập nhật thông tin hãng."),
      });
    }
  };

  const handleDeleteBrand = async (id) => {
    try {
      await deleteBrand(id);
      setBrands((current) =>
        current.map((brand) => (brand.id === id ? { ...brand, status: "INACTIVE" } : brand))
      );
      toast.success("Đã ẩn hãng");
    } catch (error) {
      toast.error("Không thể xóa hãng", {
        description: getErrorMessageVi(error, "Không thể xóa hãng."),
      });
    }
  };

  const confirmDeleteBrand = async () => {
    if (!deletingBrand) return;
    await handleDeleteBrand(deletingBrand.id);
    setDeletingBrand(null);
  };

  return (
    <main className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hãng</h1>
          <p className="mt-1 text-gray-600">Quản lý danh sách hãng sản xuất</p>
        </div>
        <Button
          className="h-11 bg-gradient-to-r from-purple-600 to-blue-600 px-6 font-medium text-white"
          onClick={() => setIsAddBrandModalOpen(true)}
        >
          <Plus className="mr-2 h-5 w-5" />
          Thêm hãng mới
        </Button>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <Stat title="Tổng hãng" value={stats.total} />
        <Stat title="Đang hoạt động" value={stats.active} />
        <Stat title="Đã ẩn" value={stats.inactive} />
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên hãng, quốc gia, mô tả..."
              className="h-11 bg-gray-50 pl-11"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="active">Đang hoạt động</SelectItem>
              <SelectItem value="inactive">Đã ẩn</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                <TableHead>Hãng</TableHead>
                <TableHead>Quốc gia</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="py-8 text-center">Đang tải hãng...</TableCell></TableRow>
              ) : filteredBrands.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-8 text-center">Không có hãng khớp điều kiện.</TableCell></TableRow>
              ) : (
                pagedBrands.map((brand) => (
                  <TableRow key={brand.id} className="hover:bg-purple-50/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white">
                          <Building2 className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="font-bold text-gray-900">{brand.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>{brand.country || "-"}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-gray-600">
                      {brand.description || "Không có mô tả"}
                    </TableCell>
                    <TableCell>
                      {brand.status === "ACTIVE" ? (
                        <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                          Hoạt động
                        </span>
                      ) : (
                        <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-bold text-gray-600">
                          Đã ẩn
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setEditingBrand(brand)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeletingBrand(brand)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-6 py-4">
        <span className="text-sm font-medium text-gray-600">
          Trang {currentPage}/{totalPages} - {filteredBrands.length} hãng
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

      {isAddBrandModalOpen && (
        <AddBrandModal
          isOpen={isAddBrandModalOpen}
          onClose={() => setIsAddBrandModalOpen(false)}
          onSave={handleCreateBrand}
        />
      )}
      {editingBrand && (
        <AddBrandModal
          isOpen={Boolean(editingBrand)}
          onClose={() => setEditingBrand(null)}
          onSave={handleEditBrand}
          initialData={editingBrand}
          title="Chỉnh sửa hãng"
          submitLabel="Cập nhật hãng"
        />
      )}
      <AlertDialog open={Boolean(deletingBrand)} onOpenChange={(open) => !open && setDeletingBrand(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận ẩn hãng?</AlertDialogTitle>
            <AlertDialogDescription>
              Hãng "{deletingBrand?.name}" sẽ chuyển sang trạng thái đã ẩn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300 text-gray-700 hover:bg-gray-100">Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteBrand} className="bg-red-600 text-white hover:bg-red-700">
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
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
