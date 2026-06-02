import React, { useEffect, useMemo, useState } from "react";
import { Edit, Layers, Package, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
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
import { AddCategoryModal } from "../../components/admin/AddCategoryModal";
import { SubcategoryManagerModal } from "../../components/admin/SubcategoryManagerModal";
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
import { createCategory, deleteCategory, getCategories, updateCategory } from "../../hooks/useCatalog";

export function AdminCategories() {
  const PAGE_SIZE = 10;
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [managingSubcategoriesFor, setManagingSubcategoriesFor] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let isMounted = true;
    async function loadCategories() {
      setIsLoading(true);
      try {
        const data = await getCategories();
        if (isMounted) setCategories(data);
      } catch {
        if (isMounted) setCategories([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const active = categories.filter((category) => category.status === "ACTIVE").length;
    return { total: categories.length, active, inactive: categories.length - active };
  }, [categories]);

  const filteredCategories = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return categories.filter((category) => {
      const matchSearch =
        !keyword ||
        category.name.toLowerCase().includes(keyword) ||
        (category.description || "").toLowerCase().includes(keyword);
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && category.status === "ACTIVE") ||
        (statusFilter === "inactive" && category.status !== "ACTIVE");
      return matchSearch && matchStatus;
    }).sort((a, b) => {
      const aTime = new Date(a.created_at || a.createdAt || 0).getTime();
      const bTime = new Date(b.created_at || b.createdAt || 0).getTime();
      if (aTime && bTime && aTime !== bTime) return bTime - aTime;
      return Number(b.id || 0) - Number(a.id || 0);
    });
  }, [categories, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / PAGE_SIZE));
  const pagedCategories = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredCategories.slice(start, start + PAGE_SIZE);
  }, [filteredCategories, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const toSlug = (name) =>
    name
      ?.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "";

  const handleSaveCategory = async (categoryData) => {
    try {
      const savedCategory = await createCategory(categoryData);
      setCategories((current) => [savedCategory, ...current]);
      toast.success("Thêm danh mục thành công");
      setIsAddCategoryModalOpen(false);
    } catch (error) {
      toast.error("Không thể thêm danh mục", { description: error.message });
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await deleteCategory(id);
      setCategories((current) =>
        current.map((category) =>
          category.id === id ? { ...category, status: "INACTIVE" } : category
        )
      );
      toast.success("Đã ẩn danh mục");
    } catch (error) {
      toast.error("Không thể xóa danh mục", { description: error.message });
    }
  };

  const confirmDeleteCategory = async () => {
    if (!deletingCategory) return;
    await handleDeleteCategory(deletingCategory.id);
    setDeletingCategory(null);
  };

  const handleEditCategory = async (categoryData) => {
    if (!editingCategory) return;
    try {
      const savedCategory = await updateCategory(editingCategory.id, categoryData);
      setCategories((current) =>
        current.map((category) =>
          category.id === editingCategory.id ? savedCategory : category
        )
      );
      toast.success("Cập nhật danh mục thành công");
      setEditingCategory(null);
    } catch (error) {
      toast.error("Không thể cập nhật danh mục", { description: error.message });
    }
  };

  return (
    <main className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Danh mục</h1>
          <p className="mt-1 text-gray-600">Quản lý danh mục sản phẩm</p>
        </div>
        <Button className="h-11 bg-gradient-to-r from-purple-600 to-blue-600 px-6 text-white" onClick={() => setIsAddCategoryModalOpen(true)}>
          <Plus className="mr-2 h-5 w-5" />
          Thêm danh mục mới
        </Button>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <Stat title="Tổng danh mục" value={stats.total} />
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
              placeholder="Tìm theo tên hoặc mô tả..."
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
                <TableHead>Danh mục</TableHead>
                <TableHead>Đường dẫn</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="py-8 text-center">Đang tải danh mục...</TableCell></TableRow>
              ) : filteredCategories.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-8 text-center">Không có danh mục khớp điều kiện.</TableCell></TableRow>
              ) : (
                pagedCategories.map((category) => (
                  <TableRow key={category.id} className="hover:bg-purple-50/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white">
                          {category.iconUrl ? (
                            <img
                              src={category.iconUrl}
                              alt={category.name}
                              className="h-10 w-10 rounded-lg object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <Package className="h-5 w-5 text-purple-600" />
                          )}
                        </div>
                        <div className="font-bold text-gray-900">{category.name}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-gray-500">{toSlug(category.name)}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-gray-600">{category.description || "Không có mô tả"}</TableCell>
                    <TableCell>
                      {category.status === "ACTIVE" ? (
                        <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-bold text-green-700">Hoạt động</span>
                      ) : (
                        <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-bold text-gray-600">Đã ẩn</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setEditingCategory(category)}><Edit className="h-4 w-4" /></Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Quản lý danh mục con"
                          onClick={() => setManagingSubcategoriesFor(category)}
                        >
                          <Layers className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeletingCategory(category)}><Trash2 className="h-4 w-4" /></Button>
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
          Trang {currentPage}/{totalPages} - {filteredCategories.length} danh mục
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

      {isAddCategoryModalOpen && (
        <AddCategoryModal
          isOpen={isAddCategoryModalOpen}
          onClose={() => setIsAddCategoryModalOpen(false)}
          onSave={handleSaveCategory}
        />
      )}
      {editingCategory && (
        <AddCategoryModal
          isOpen={Boolean(editingCategory)}
          onClose={() => setEditingCategory(null)}
          onSave={handleEditCategory}
          initialData={editingCategory}
          title="Chỉnh sửa danh mục"
          submitLabel="Cập nhật danh mục"
        />
      )}
      {managingSubcategoriesFor && (
        <SubcategoryManagerModal
          isOpen={Boolean(managingSubcategoriesFor)}
          category={managingSubcategoriesFor}
          onClose={() => setManagingSubcategoriesFor(null)}
        />
      )}
      <AlertDialog open={Boolean(deletingCategory)} onOpenChange={(open) => !open && setDeletingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận ẩn danh mục?</AlertDialogTitle>
            <AlertDialogDescription>
              Danh mục "{deletingCategory?.name}" sẽ chuyển sang trạng thái đã ẩn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300 text-gray-700 hover:bg-gray-100">Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCategory} className="bg-red-600 text-white hover:bg-red-700">
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
