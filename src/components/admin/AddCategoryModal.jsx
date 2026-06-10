import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { FolderOpen, FileText, Loader2, Save, Upload, X } from "lucide-react";
import { uploadProductImages } from "../../hooks/useCatalog";
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

export function AddCategoryModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  title = "Thêm danh mục mới",
  submitLabel = "Lưu danh mục",
}) {
  const [formData, setFormData] = useState({ name: "", description: "", iconUrl: "" });
  const [errors, setErrors] = useState({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setFormData({
      name: initialData?.name || "",
      description: initialData?.description || "",
      iconUrl: initialData?.iconUrl || "",
    });
    setErrors({});
    setShowConfirmDialog(false);
  }, [isOpen, initialData]);

  const handleClose = () => {
    setFormData({ name: "", description: "", iconUrl: "" });
    setErrors({});
    setShowConfirmDialog(false);
    onClose();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = {};
    const trimmedName = formData.name.trim();
    const trimmedDescription = formData.description.trim();
    const trimmedIconUrl = formData.iconUrl.trim();

    if (!trimmedName) nextErrors.name = "Vui lòng nhập tên danh mục";
    else if (trimmedName.length < 2) nextErrors.name = "Tên danh mục phải có ít nhất 2 ký tự";
    else if (trimmedName.length > 120) nextErrors.name = "Tên danh mục không được vượt quá 120 ký tự";

    if (trimmedDescription.length > 500) nextErrors.description = "Mô tả không được vượt quá 500 ký tự";
    if (trimmedIconUrl && !isValidUrl(trimmedIconUrl)) nextErrors.iconUrl = "URL ảnh danh mục không hợp lệ";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setShowConfirmDialog(true);
  };

  const handleIconUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    setIsUploading(true);
    try {
      const [url] = await uploadProductImages([files[0]]);
      if (!url) return;
      setFormData((prev) => ({ ...prev, iconUrl: url }));
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        iconUrl: error?.message || "Không thể tải ảnh lên",
      }));
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleConfirmSave = () => {
    onSave({
      ...formData,
      name: formData.name.trim(),
      description: formData.description.trim(),
      iconUrl: formData.iconUrl.trim(),
    });
    setShowConfirmDialog(false);
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[86vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <FolderOpen className="h-5 w-5 text-blue-600" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Điền thông tin danh mục.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Tên danh mục *</Label>
              <div className="relative">
                <FolderOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  className={`h-10 pl-10 ${errors.name ? "border-red-500" : ""}`}
                  placeholder="Ví dụ: Action Figure"
                />
              </div>
              {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Mô tả</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, description: e.target.value }))
                  }
                  rows={4}
                  className="resize-none pl-10"
                  placeholder="Mô tả ngắn cho danh mục..."
                />
              </div>
              {errors.description && <p className="text-xs text-red-600">{errors.description}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">URL ảnh danh mục</Label>
              <Input
                value={formData.iconUrl}
                onChange={(e) => setFormData((p) => ({ ...p, iconUrl: e.target.value }))}
                className="h-10"
                placeholder="https://... hoặc để trống"
              />
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleIconUpload}
                  disabled={isUploading}
                  className="h-10 cursor-pointer"
                />
                {isUploading ? (
                  <span className="inline-flex items-center text-xs text-gray-500">
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                    Đang tải
                  </span>
                ) : (
                  <span className="inline-flex items-center text-xs text-gray-500">
                    <Upload className="mr-1 h-3.5 w-3.5" />
                    Chọn ảnh từ máy
                  </span>
                )}
              </div>
              <ImagePreview
                src={formData.iconUrl}
                alt="Xem trước ảnh danh mục"
                className="h-32 w-full max-w-xs p-2"
              />
              {errors.iconUrl && <p className="text-xs text-red-600">{errors.iconUrl}</p>}
            </div>
          </div>

          <DialogFooter className="gap-2 border-t border-gray-100 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="h-10 px-5">
              <X className="mr-2 h-4 w-4" />
              Hủy
            </Button>
            <Button type="submit" className="h-10 bg-blue-600 px-6 text-white hover:bg-blue-700">
              <Save className="mr-2 h-4 w-4" />
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận lưu danh mục</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn muốn lưu danh mục <strong>{formData.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300 text-gray-700 hover:bg-gray-100">Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave} className="bg-blue-600 text-white hover:bg-blue-700">
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
