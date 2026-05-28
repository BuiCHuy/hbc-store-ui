import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
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
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Package,
  DollarSign,
  Box,
  FolderOpen,
  Building2,
  Save,
  X,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import { uploadProductImages } from "../../hooks/useCatalog";

function AddProductModal({
  isOpen,
  onClose,
  onSave,
  categories = [],
  brands = [],
  initialData = null,
  title = "Thêm sản phẩm mới",
  submitLabel = "Lưu sản phẩm",
  isSubmitting = false,
}) {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
    imageUrl: "",
    galleryUrls: [""],
    attributes: [{ name: "", value: "" }],
    categoryId: "",
    brandId: "",
    description: "",
  });
  const [errors, setErrors] = useState({});
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [uploadingGalleryIndex, setUploadingGalleryIndex] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (!initialData) {
      setFormData({
        name: "",
        price: "",
        stock: "",
        imageUrl: "",
        galleryUrls: [""],
        attributes: [{ name: "", value: "" }],
        categoryId: "",
        brandId: "",
        description: "",
      });
    } else {
      const initialGallery = Array.isArray(initialData.images)
        ? initialData.images.filter(Boolean)
        : [];
      const initialAttributes = Array.isArray(initialData.attributes)
        ? initialData.attributes
            .map((item) => ({
              name: item?.name || item?.attributeName || "",
              value: item?.value || item?.attributeValue || "",
            }))
            .filter((item) => item.name || item.value)
        : [];

      setFormData({
        name: initialData.name || "",
        price: String(initialData.price ?? ""),
        stock: String(initialData.stockQuantity ?? initialData.stock ?? ""),
        imageUrl: initialData.image || initialData.thumbnailUrl || "",
        galleryUrls: initialGallery.length > 0 ? initialGallery : [""],
        attributes: initialAttributes.length > 0 ? initialAttributes : [{ name: "", value: "" }],
        categoryId: String(initialData.category_id ?? initialData.categoryId ?? ""),
        brandId: String(initialData.brand_id ?? initialData.brandId ?? ""),
        description: initialData.description || "",
      });
    }
    setErrors({});
    setShowConfirmDialog(false);
  }, [isOpen, initialData]);

  const validate = () => {
    const next = {};
    if (!formData.name.trim()) next.name = "Vui lòng nhập tên sản phẩm";
    if (!formData.price || Number(formData.price) <= 0) next.price = "Giá bán phải lớn hơn 0";
    if (formData.stock === "" || Number(formData.stock) < 0) {
      next.stock = "Số lượng tồn kho không hợp lệ";
    }
    if (!formData.categoryId) next.categoryId = "Vui lòng chọn danh mục";
    if (!formData.brandId) next.brandId = "Vui lòng chọn hãng";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const resetAndClose = () => {
    if (isSubmitting) return;
    setErrors({});
    setShowConfirmDialog(false);
    onClose();
  };

  const handleThumbnailFile = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    setIsUploadingThumbnail(true);
    try {
      const [url] = await uploadProductImages([files[0]]);
      setFormData((prev) => {
        if (!url) return prev;
        const hasInGallery = prev.galleryUrls.some((item) => item.trim() === url.trim());
        return {
          ...prev,
          imageUrl: url,
          galleryUrls: hasInGallery ? prev.galleryUrls : [url, ...prev.galleryUrls],
        };
      });
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        imageUrl: error.message || "Không thể tải ảnh đại diện",
      }));
    } finally {
      setIsUploadingThumbnail(false);
      event.target.value = "";
    }
  };

  const handleGalleryFile = async (index, event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    setUploadingGalleryIndex(index);
    try {
      const [url] = await uploadProductImages([files[0]]);
      if (!url) return;
      setFormData((prev) => {
        const next = [...prev.galleryUrls];
        next[index] = url;
        return { ...prev, galleryUrls: next };
      });
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        galleryUrls: error.message || "Không thể tải ảnh chi tiết",
      }));
    } finally {
      setUploadingGalleryIndex(null);
      event.target.value = "";
    }
  };

  const updateGalleryUrl = (index, value) => {
    setFormData((prev) => {
      const next = [...prev.galleryUrls];
      next[index] = value;
      return { ...prev, galleryUrls: next };
    });
  };

  const addGalleryRow = () => {
    setFormData((prev) => ({ ...prev, galleryUrls: [...prev.galleryUrls, ""] }));
  };

  const removeGalleryRow = (index) => {
    setFormData((prev) => {
      if (prev.galleryUrls.length === 1) return { ...prev, galleryUrls: [""] };
      return { ...prev, galleryUrls: prev.galleryUrls.filter((_, i) => i !== index) };
    });
  };

  const updateAttribute = (index, field, value) => {
    setFormData((prev) => {
      const next = [...prev.attributes];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, attributes: next };
    });
  };

  const addAttributeRow = () => {
    setFormData((prev) => ({
      ...prev,
      attributes: [...prev.attributes, { name: "", value: "" }],
    }));
  };

  const removeAttributeRow = (index) => {
    setFormData((prev) => {
      if (prev.attributes.length === 1) return { ...prev, attributes: [{ name: "", value: "" }] };
      return { ...prev, attributes: prev.attributes.filter((_, i) => i !== index) };
    });
  };

  const buildPayload = () => {
    const normalizedGallery = formData.galleryUrls.map((url) => url.trim()).filter(Boolean);
    const thumbnail = formData.imageUrl.trim();
    const imageUrls =
      thumbnail && !normalizedGallery.includes(thumbnail)
        ? [thumbnail, ...normalizedGallery]
        : normalizedGallery;
    const attributes = formData.attributes
      .map((item) => ({
        name: (item.name || "").trim(),
        value: (item.value || "").trim(),
      }))
      .filter((item) => item.name && item.value);

    return {
      ...formData,
      price: String(formData.price),
      stock: String(formData.stock),
      imageUrls,
      attributes,
    };
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate() || isSubmitting) return;
    setShowConfirmDialog(true);
  };

  const handleConfirmSave = async () => {
    try {
      await onSave(buildPayload());
      setShowConfirmDialog(false);
      resetAndClose();
    } catch {
      // error is handled in parent
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <Package className="h-5 w-5 text-blue-600" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Điền thông tin sản phẩm và thuộc tính chi tiết.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 py-3">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label className="text-sm font-semibold">Tên sản phẩm *</Label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    className={`h-10 pl-10 ${errors.name ? "border-red-500" : ""}`}
                    placeholder="Ví dụ: Iron Man Mark 85"
                  />
                </div>
                {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Giá bán *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData((p) => ({ ...p, price: e.target.value }))}
                    className={`h-10 pl-10 ${errors.price ? "border-red-500" : ""}`}
                  />
                </div>
                {errors.price && <p className="text-xs text-red-600">{errors.price}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Tồn kho *</Label>
                <div className="relative">
                  <Box className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData((p) => ({ ...p, stock: e.target.value }))}
                    className={`h-10 pl-10 ${errors.stock ? "border-red-500" : ""}`}
                  />
                </div>
                {errors.stock && <p className="text-xs text-red-600">{errors.stock}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Danh mục *</Label>
                <div className="relative">
                  <FolderOpen className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData((p) => ({ ...p, categoryId: e.target.value }))}
                    className={`h-10 w-full rounded-md border bg-white pl-10 pr-3 text-sm outline-none focus:border-purple-500 focus:ring-[3px] focus:ring-purple-500/20 ${
                      errors.categoryId ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.map((category) => (
                      <option key={category.id} value={String(category.id)}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.categoryId && <p className="text-xs text-red-600">{errors.categoryId}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Hãng *</Label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <select
                    value={formData.brandId}
                    onChange={(e) => setFormData((p) => ({ ...p, brandId: e.target.value }))}
                    className={`h-10 w-full rounded-md border bg-white pl-10 pr-3 text-sm outline-none focus:border-purple-500 focus:ring-[3px] focus:ring-purple-500/20 ${
                      errors.brandId ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Chọn hãng</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={String(brand.id)}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.brandId && <p className="text-xs text-red-600">{errors.brandId}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-sm font-semibold">Ảnh đại diện</Label>
                <Input
                  value={formData.imageUrl}
                  onChange={(e) => setFormData((p) => ({ ...p, imageUrl: e.target.value }))}
                  className="h-10"
                  placeholder="URL ảnh đại diện"
                />
                <div className="flex items-center gap-3">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailFile}
                    disabled={isUploadingThumbnail}
                    className="h-10 cursor-pointer"
                  />
                  {isUploadingThumbnail && (
                    <span className="whitespace-nowrap text-xs text-gray-500">Đang tải...</span>
                  )}
                </div>
                {errors.imageUrl && <p className="text-xs text-red-600">{errors.imageUrl}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Danh sách ảnh chi tiết</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addGalleryRow}>
                    <Plus className="mr-1 h-4 w-4" />
                    Thêm ảnh
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.galleryUrls.map((url, index) => (
                    <div key={index} className="rounded-md border border-gray-200 p-3">
                      <div className="flex gap-2">
                        <Input
                          value={url}
                          onChange={(e) => updateGalleryUrl(index, e.target.value)}
                          placeholder={`URL ảnh #${index + 1}`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeGalleryRow(index)}
                          title="Xóa dòng"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(event) => handleGalleryFile(index, event)}
                          disabled={uploadingGalleryIndex === index}
                          className="h-10 cursor-pointer"
                        />
                        {uploadingGalleryIndex === index && (
                          <span className="whitespace-nowrap text-xs text-gray-500">Đang tải...</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {errors.galleryUrls && <p className="text-xs text-red-600">{errors.galleryUrls}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Thuộc tính sản phẩm</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addAttributeRow}>
                    <Plus className="mr-1 h-4 w-4" />
                    Thêm thuộc tính
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.attributes.map((attr, index) => (
                    <div key={index} className="grid grid-cols-1 gap-2 rounded-md border border-gray-200 p-3 md:grid-cols-[1fr_1fr_auto]">
                      <Input
                        value={attr.name}
                        onChange={(e) => updateAttribute(index, "name", e.target.value)}
                        placeholder="Tên thuộc tính (VD: Tỷ lệ)"
                      />
                      <Input
                        value={attr.value}
                        onChange={(e) => updateAttribute(index, "value", e.target.value)}
                        placeholder="Giá trị (VD: 1/6)"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeAttributeRow(index)}
                        title="Xóa thuộc tính"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-sm font-semibold">Mô tả sản phẩm</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  rows={5}
                  className="resize-y"
                  placeholder="Mô tả sản phẩm..."
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 border-t border-gray-100 pt-4">
            <Button type="button" variant="outline" onClick={resetAndClose} disabled={isSubmitting} className="h-10 px-5">
              <X className="mr-2 h-4 w-4" />
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting} className="h-10 bg-blue-600 px-6 text-white hover:bg-blue-700">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isSubmitting ? "Đang lưu..." : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận lưu sản phẩm</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn muốn lưu sản phẩm <strong>{formData.name || "mới"}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300 text-gray-700 hover:bg-gray-100">
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSave}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

export { AddProductModal };
export default AddProductModal;
