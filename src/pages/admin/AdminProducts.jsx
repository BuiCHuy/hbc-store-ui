import React, { useEffect, useMemo, useState } from "react";
import { Edit, Eye, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import AddProductModal from "../../components/admin/AddProductModal";
import {
  createProduct,
  deleteProduct,
  getBrands,
  getCategories,
  getProducts,
  updateProduct,
} from "../../hooks/useCatalog";

const getStatusBadge = (stock, status) => {
  if (status === "INACTIVE") {
    return (
      <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-bold text-gray-600">
        Đã ẩn
      </span>
    );
  }
  if (stock === 0) {
    return (
      <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
        Hết hàng
      </span>
    );
  }
  if (stock <= 10) {
    return (
      <span className="inline-flex items-center rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-bold text-yellow-700">
        Sắp hết
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
      Còn hàng
    </span>
  );
};

const getStatusFilterKey = (product) => {
  const stock = product.stockQuantity ?? product.stock ?? 0;
  if (product.status === "INACTIVE") return "inactive";
  if (stock === 0) return "out";
  if (stock <= 10) return "low";
  return "active";
};

export function AdminProducts() {
  const PAGE_SIZE = 10;
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let isMounted = true;

    async function loadCatalog() {
      setIsLoading(true);
      try {
        const [productData, categoryData, brandData] = await Promise.all([
          getProducts(),
          getCategories(),
          getBrands(),
        ]);

        if (!isMounted) return;
        setProducts(productData);
        setCategories(categoryData);
        setBrands(brandData);
      } catch (error) {
        console.error("Lỗi tải catalog quản trị:", error);
        if (isMounted) setProducts([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  const categoryOptions = useMemo(
    () => categories.filter((category) => category.status !== "INACTIVE"),
    [categories]
  );

  const brandOptions = useMemo(
    () => brands.filter((brand) => brand.status !== "INACTIVE"),
    [brands]
  );

  const filteredProducts = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return products.filter((product) => {
      const idText = String(product.id || "");
      const nameText = (product.name || "").toLowerCase();
      const brandText = (product.brand || "").toLowerCase();
      const categoryId = String(product.category_id ?? product.categoryId ?? "");
      const statusKey = getStatusFilterKey(product);

      const matchSearch =
        !keyword ||
        nameText.includes(keyword) ||
        idText.includes(keyword) ||
        brandText.includes(keyword);
      const matchCategory =
        selectedCategoryFilter === "all" || categoryId === selectedCategoryFilter;
      const matchStatus =
        selectedStatusFilter === "all" || statusKey === selectedStatusFilter;

      return matchSearch && matchCategory && matchStatus;
    }).sort((a, b) => {
      const aTime = new Date(a.created_at || a.createdAt || 0).getTime();
      const bTime = new Date(b.created_at || b.createdAt || 0).getTime();
      if (aTime && bTime && aTime !== bTime) return bTime - aTime;
      return Number(b.id || 0) - Number(a.id || 0);
    });
  }, [products, searchTerm, selectedCategoryFilter, selectedStatusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const pagedProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategoryFilter, selectedStatusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const stats = useMemo(() => {
    const total = products.length;
    const inactive = products.filter((product) => product.status === "INACTIVE").length;
    const active = total - inactive;
    const outOfStock = products.filter(
      (product) => (product.stockQuantity ?? product.stock ?? 0) === 0
    ).length;
    return { total, active, inactive, outOfStock };
  }, [products]);

  const formatPrice = (value) =>
    typeof value === "number"
      ? new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(value)
      : value;

  const handleAddProduct = async (formData) => {
    try {
      const savedProduct = await createProduct(formData);
      setProducts((current) => [savedProduct, ...current]);
      toast.success("Sản phẩm đã được thêm thành công", {
        description: `"${savedProduct.name}" đã sẵn sàng cho khách hàng.`,
        duration: 4000,
      });
      setIsAddProductModalOpen(false);
      return savedProduct;
    } catch (error) {
      toast.error("Không thể thêm sản phẩm", { description: error.message });
      throw error;
    }
  };

  const handleEditProduct = async (formData) => {
    if (!editingProduct) return null;
    try {
      const savedProduct = await updateProduct(editingProduct.id, formData);
      setProducts((current) =>
        current.map((product) =>
          product.id === editingProduct.id ? savedProduct : product
        )
      );
      toast.success("Cập nhật sản phẩm thành công");
      setEditingProduct(null);
      return savedProduct;
    } catch (error) {
      toast.error("Không thể cập nhật sản phẩm", { description: error.message });
      throw error;
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await deleteProduct(id);
      setProducts((current) =>
        current.map((product) =>
          product.id === id ? { ...product, status: "INACTIVE" } : product
        )
      );
      toast.success("Đã ẩn sản phẩm");
    } catch (error) {
      toast.error("Không thể xóa sản phẩm", { description: error.message });
    }
  };

  return (
    <main className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sản phẩm</h1>
          <p className="mt-1 text-gray-600">Quản lý kho mô hình của bạn</p>
        </div>
        <Button
          className="h-11 bg-gradient-to-r from-purple-600 to-blue-600 px-6 font-medium text-white shadow-lg shadow-purple-500/30 hover:from-purple-700 hover:to-blue-700"
          onClick={() => setIsAddProductModalOpen(true)}
        >
          <Plus className="mr-2 h-5 w-5" />
          Thêm sản phẩm mới
        </Button>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Tổng sản phẩm</p>
          <p className="text-2xl font-black text-gray-900">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Đang bán</p>
          <p className="text-2xl font-black text-gray-900">{stats.active}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Hết hàng</p>
          <p className="text-2xl font-black text-gray-900">{stats.outOfStock}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Đã ẩn</p>
          <p className="text-2xl font-black text-gray-900">{stats.inactive}</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tìm kiếm theo tên, thương hiệu hoặc ID..."
              className="h-11 bg-gray-50 pl-11 transition-colors focus:bg-white"
            />
          </div>
          <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả danh mục</SelectItem>
              {categoryOptions.map((category) => (
                <SelectItem key={category.id} value={String(category.id)}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="active">Còn hàng</SelectItem>
              <SelectItem value="low">Sắp hết</SelectItem>
              <SelectItem value="out">Hết hàng</SelectItem>
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
                <TableHead className="font-semibold text-gray-700">Sản phẩm</TableHead>
                <TableHead className="font-semibold text-gray-700">Thương hiệu</TableHead>
                <TableHead className="font-semibold text-gray-700">Danh mục</TableHead>
                <TableHead className="font-semibold text-gray-700">Giá</TableHead>
                <TableHead className="font-semibold text-gray-700">Tồn kho</TableHead>
                <TableHead className="font-semibold text-gray-700">Trạng thái</TableHead>
                <TableHead className="text-right font-semibold text-gray-700">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-gray-500">
                    Đang tải sản phẩm...
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-gray-500">
                    Không có sản phẩm khớp điều kiện tìm kiếm/lọc.
                  </TableCell>
                </TableRow>
              ) : (
                pagedProducts.map((product) => {
                  const stock = product.stockQuantity ?? product.stock ?? 0;
                  return (
                    <TableRow key={product.id} className="transition-colors hover:bg-purple-50/50">
                      <TableCell>
                        <div className="flex items-center gap-4">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-12 w-12 rounded-lg border border-gray-200 object-cover shadow-sm"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-gray-200 bg-gray-100 text-[10px] font-medium text-gray-400">
                              No image
                            </div>
                          )}
                          <div>
                            <div className="max-w-[200px] truncate font-bold text-gray-900" title={product.name}>
                              {product.name}
                            </div>
                            <div className="mt-0.5 font-mono text-xs text-gray-500">
                              ID: #{product.id}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-gray-600">{product.brand}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                          {product.category}
                        </span>
                      </TableCell>
                      <TableCell className="font-bold text-gray-900">{formatPrice(product.price)}</TableCell>
                      <TableCell className="font-medium text-gray-700">{stock} sp</TableCell>
                      <TableCell>{getStatusBadge(stock, product.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                            onClick={() => setViewingProduct(product)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:bg-purple-50 hover:text-purple-600"
                            onClick={() => setEditingProduct(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:bg-red-50 hover:text-red-600"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-6 py-4">
        <span className="text-sm font-medium text-gray-600">
          Trang {currentPage}/{totalPages} - {filteredProducts.length} sản phẩm
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

      {isAddProductModalOpen && (
        <AddProductModal
          isOpen={isAddProductModalOpen}
          onClose={() => setIsAddProductModalOpen(false)}
          onSave={handleAddProduct}
          categories={categoryOptions}
          brands={brandOptions}
        />
      )}

      {editingProduct && (
        <AddProductModal
          isOpen={Boolean(editingProduct)}
          onClose={() => setEditingProduct(null)}
          onSave={handleEditProduct}
          categories={categoryOptions}
          brands={brandOptions}
          initialData={editingProduct}
          title="Chỉnh sửa sản phẩm"
          submitLabel="Cập nhật sản phẩm"
        />
      )}

      <Dialog open={Boolean(viewingProduct)} onOpenChange={() => setViewingProduct(null)}>
        <DialogContent className="max-h-[88vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              Chi tiết sản phẩm
            </DialogTitle>
            <DialogDescription>
              Xem toàn bộ thông tin sản phẩm đã lưu.
            </DialogDescription>
          </DialogHeader>

          {viewingProduct && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <img
                    src={viewingProduct.image || ""}
                    alt={viewingProduct.name}
                    className="h-56 w-full rounded-lg border border-gray-200 object-cover"
                  />
                  <div className="grid grid-cols-4 gap-2">
                    {(viewingProduct.images || []).map((image, index) => (
                      <img
                        key={`${image}-${index}`}
                        src={image}
                        alt={`Gallery ${index + 1}`}
                        className="h-16 w-full rounded-md border border-gray-200 object-cover"
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div><span className="font-semibold">ID:</span> #{viewingProduct.id}</div>
                  <div><span className="font-semibold">Tên:</span> {viewingProduct.name}</div>
                  <div><span className="font-semibold">Giá:</span> {formatPrice(viewingProduct.price)}</div>
                  <div><span className="font-semibold">Tồn kho:</span> {viewingProduct.stockQuantity ?? 0} sản phẩm</div>
                  <div><span className="font-semibold">Thương hiệu:</span> {viewingProduct.brand || "Chưa có"}</div>
                  <div><span className="font-semibold">Danh mục:</span> {viewingProduct.category || "Chưa có"}</div>
                  <div><span className="font-semibold">Trạng thái:</span> {getStatusFilterKey(viewingProduct)}</div>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-gray-900">Mô tả</h3>
                <p className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                  {viewingProduct.description || "Không có mô tả."}
                </p>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-gray-900">Thuộc tính kỹ thuật</h3>
                {Array.isArray(viewingProduct.attributes) && viewingProduct.attributes.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {viewingProduct.attributes.map((attr, index) => (
                      <div
                        key={`${attr.name}-${attr.value}-${index}`}
                        className="rounded-md border border-gray-200 p-3 text-sm"
                      >
                        <div className="font-medium text-gray-800">{attr.name}</div>
                        <div className="text-gray-600">{attr.value}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Chưa có thuộc tính.</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
