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
import {
  getProductAttributeSuggestions,
  getSubcategories,
  uploadProductImages,
} from "../../hooks/useCatalog";
import { ImagePreview } from "./ImagePreview";

function isValidUrl(value) {
  if (!value) return true;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

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
    subcategoryId: "",
    brandId: "",
    description: "",
  });
  const [errors, setErrors] = useState({});
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [uploadingGalleryIndex, setUploadingGalleryIndex] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [attributeSuggestions, setAttributeSuggestions] = useState({});
  const [subcategoryOptions, setSubcategoryOptions] = useState([]);

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
        subcategoryId: "",
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
        attributes:
          initialAttributes.length > 0 ? initialAttributes : [{ name: "", value: "" }],
        categoryId: String(initialData.category_id ?? initialData.categoryId ?? ""),
        subcategoryId: String(initialData.subcategory_id ?? initialData.subcategoryId ?? ""),
        brandId: String(initialData.brand_id ?? initialData.brandId ?? ""),
        description: initialData.description || "",
      });
    }
    setErrors({});
    setShowConfirmDialog(false);
    setAttributeSuggestions({});
    setSubcategoryOptions([]);
  }, [isOpen, initialData]);

  useEffect(() => {
    if (!isOpen) return;
    const categoryId = String(formData.categoryId || "").trim();
    if (!categoryId) {
      setAttributeSuggestions({});
      return;
    }
    let active = true;
    getProductAttributeSuggestions(categoryId)
      .then((data) => {
        if (!active) return;
        setAttributeSuggestions(data || {});
      })
      .catch(() => {
        if (!active) return;
        setAttributeSuggestions({});
      });
    return () => {
      active = false;
    };
  }, [isOpen, formData.categoryId]);

  useEffect(() => {
    if (!isOpen) return;
    const categoryId = String(formData.categoryId || "").trim();
    if (!categoryId) {
      setSubcategoryOptions([]);
      setFormData((prev) => ({ ...prev, subcategoryId: "" }));
      return;
    }
    let active = true;
    getSubcategories(categoryId)
      .then((items) => {
        if (!active) return;
        const options = items.filter((item) => item.status !== "INACTIVE");
        setSubcategoryOptions(options);
        setFormData((prev) => {
          if (!prev.subcategoryId) return prev;
          const exists = options.some((item) => String(item.id) === String(prev.subcategoryId));
          return exists ? prev : { ...prev, subcategoryId: "" };
        });
      })
      .catch(() => {
        if (!active) return;
        setSubcategoryOptions([]);
      });
    return () => {
      active = false;
    };
  }, [isOpen, formData.categoryId]);

  const validate = () => {
    const next = {};
    const trimmedName = formData.name.trim();
    const trimmedImageUrl = formData.imageUrl.trim();
    const trimmedDescription = formData.description.trim();
    const price = Number(formData.price);
    const stock = Number(formData.stock);
    const normalizedGallery = formData.galleryUrls.map((url) => url.trim()).filter(Boolean);

    if (!trimmedName) next.name = "Vui lòng nhập tên sản phẩm";
    else if (trimmedName.length < 2) next.name = "Tên sản phẩm phải có ít nhất 2 ký tự";
    else if (trimmedName.length > 180) next.name = "Tên sản phẩm không được vượt quá 180 ký tự";

    if (!formData.price || Number.isNaN(price) || price <= 0) {
      next.price = "Giá bán phải lớn hơn 0";
    }
    if (formData.stock === "" || Number.isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
      next.stock = "Số lượng tồn kho không hợp lệ";
    }
    if (!formData.categoryId) next.categoryId = "Vui lòng chọn danh mục";
    if (!formData.brandId) next.brandId = "Vui lòng chọn hãng";
    if (trimmedImageUrl && !isValidUrl(trimmedImageUrl)) next.imageUrl = "URL ảnh đại diện không hợp lệ";
    if (normalizedGallery.some((url) => !isValidUrl(url))) next.galleryUrls = "Có URL ảnh bổ sung không hợp lệ";
    if (trimmedDescription.length > 2000) next.description = "Mô tả không được vượt quá 2000 ký tự";
    if (
      formData.attributes.some((item) => {
        const name = String(item?.name || "").trim();
        const value = String(item?.value || "").trim();
        return (name && !value) || (!name && value);
      })
    ) {
      next.attributes = "Thuộc tính riêng phải nhập đủ cả tên và giá trị";
    }
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
        return {
          ...prev,
          imageUrl: url,
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

  const suggestionKeys = Object.keys(attributeSuggestions || {});
  const GRADE_SUBCATEGORY_KEYWORDS = ["HG", "RG", "MG", "PG", "SD", "MGEX", "RE/100", "FM"];
  const extractGradeFromSubcategory = (name) => {
    const normalized = String(name || "").trim().toUpperCase();
    if (!normalized) return null;
    return (
      GRADE_SUBCATEGORY_KEYWORDS.find(
        (keyword) =>
          normalized === keyword ||
          normalized.startsWith(`${keyword} `) ||
          normalized.includes(` ${keyword} `)
      ) || null
    );
  };
  const getSuggestedValues = (name) => {
    const direct = attributeSuggestions[name];
    if (Array.isArray(direct)) return direct;
    const normalized = String(name || "").trim().toLowerCase();
    const matchedKey = suggestionKeys.find((key) => key.trim().toLowerCase() === normalized);
    return matchedKey ? attributeSuggestions[matchedKey] || [] : [];
  };

  const removeAttributeRow = (index) => {
    setFormData((prev) => {
      if (prev.attributes.length === 1) {
        return { ...prev, attributes: [{ name: "", value: "" }] };
      }
      return { ...prev, attributes: prev.attributes.filter((_, i) => i !== index) };
    });
  };

  const buildPayload = () => {
    const normalizedGallery = formData.galleryUrls.map((url) => url.trim()).filter(Boolean);
    const thumbnail = formData.imageUrl.trim();
    const imageUrls = normalizedGallery.filter((url) => !thumbnail || url !== thumbnail);
    let attributes = formData.attributes
      .map((item) => ({
        name: (item.name || "").trim(),
        value: (item.value || "").trim(),
      }))
      .filter((item) => item.name && item.value);

    const selectedSubcategory = subcategoryOptions.find(
      (item) => String(item.id) === String(formData.subcategoryId || "")
    );
    const detectedGrade = selectedSubcategory
      ? extractGradeFromSubcategory(selectedSubcategory.name)
      : null;
    if (detectedGrade) {
      const gradeValue = detectedGrade;
      const gradeIdx = attributes.findIndex(
        (item) => String(item.name || "").trim().toLowerCase() === "grade"
      );
      if (gradeIdx >= 0) {
        attributes[gradeIdx] = { ...attributes[gradeIdx], value: gradeValue };
      } else {
        attributes = [{ name: "Grade", value: gradeValue }, ...attributes];
      }
    }

    return {
      ...formData,
      price: String(formData.price),
      stock: String(formData.stock),
      imageUrls,
      attributes,
      subcategoryId: formData.subcategoryId || "",
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
                {errors.categoryId && (
                  <p className="text-xs text-red-600">{errors.categoryId}</p>
                )}
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
                <Label className="text-sm font-semibold">Danh mục con</Label>
                <select
                  value={formData.subcategoryId}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, subcategoryId: e.target.value }))
                  }
                  className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-purple-500 focus:ring-[3px] focus:ring-purple-500/20"
                >
                  <option value="">Không chọn</option>
                  {subcategoryOptions.map((item) => (
                    <option key={item.id} value={String(item.id)}>
                      {item.name}
                    </option>
                  ))}
                </select>
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
                    <span className="whitespace-nowrap text-xs text-gray-500">
                      Đang tải...
                    </span>
                  )}
                </div>
                <ImagePreview
                  src={formData.imageUrl}
                  alt="Xem trước ảnh đại diện"
                  className="h-44 w-full max-w-sm p-2"
                />
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
                          <span className="whitespace-nowrap text-xs text-gray-500">
                            Đang tải...
                          </span>
                        )}
                      </div>
                      <ImagePreview
                        src={url}
                        alt={`Xem trước ảnh chi tiết ${index + 1}`}
                        className="mt-3 h-36 w-full max-w-sm p-2"
                      />
                    </div>
                  ))}
                </div>
                {errors.galleryUrls && (
                  <p className="text-xs text-red-600">{errors.galleryUrls}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Thuộc tính sản phẩm</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addAttributeRow}>
                    <Plus className="mr-1 h-4 w-4" />
                    Thêm thuộc tính
                  </Button>
                </div>
                {suggestionKeys.length > 0 && (
                  <p className="text-xs text-gray-500">
                    Gợi ý theo danh mục: {suggestionKeys.join(", ")}
                  </p>
                )}
                <div className="space-y-2">
                  {formData.attributes.map((attr, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 gap-2 rounded-md border border-gray-200 p-3 md:grid-cols-[1fr_1fr_auto]"
                    >
                      <Input
                        value={attr.name}
                        onChange={(e) => updateAttribute(index, "name", e.target.value)}
                        placeholder="Tên thuộc tính (VD: Tỷ lệ)"
                        list={`attr-name-suggest-${index}`}
                      />
                      <datalist id={`attr-name-suggest-${index}`}>
                        {suggestionKeys.map((key) => (
                          <option key={key} value={key} />
                        ))}
                      </datalist>
                      <Input
                        value={attr.value}
                        onChange={(e) => updateAttribute(index, "value", e.target.value)}
                        placeholder="Giá trị (VD: 1/6)"
                        list={`attr-value-suggest-${index}`}
                      />
                      <datalist id={`attr-value-suggest-${index}`}>
                        {getSuggestedValues(attr.name).map((value) => (
                          <option key={`${attr.name}-${value}`} value={value} />
                        ))}
                      </datalist>
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
                {errors.attributes && (
                  <p className="text-xs text-red-600">{errors.attributes}</p>
                )}
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
                {errors.description && (
                  <p className="text-xs text-red-600">{errors.description}</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 border-t border-gray-100 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={resetAndClose}
              disabled={isSubmitting}
              className="h-10 px-5"
            >
              <X className="mr-2 h-4 w-4" />
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 bg-blue-600 px-6 text-white hover:bg-blue-700"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
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
