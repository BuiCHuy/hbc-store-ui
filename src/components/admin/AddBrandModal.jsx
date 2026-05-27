import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Building2, Globe, FileText, Image, Save, X } from "lucide-react";
import { uploadProductImages } from "../../hooks/useCatalog";

export function AddBrandModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  title = "Thêm hãng mới",
  submitLabel = "Lưu hãng",
}) {
  const [formData, setFormData] = useState({
    name: "",
    logoUrl: "",
    country: "",
    description: "",
  });
  const [errors, setErrors] = useState({});
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setFormData({
      name: initialData?.name || "",
      logoUrl: initialData?.logoUrl || "",
      country: initialData?.country || "",
      description: initialData?.description || "",
    });
    setErrors({});
  }, [isOpen, initialData]);

  const handleClose = () => {
    setFormData({ name: "", logoUrl: "", country: "", description: "" });
    setErrors({});
    onClose();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!formData.name.trim()) {
      setErrors({ name: "Vui lòng nhập tên hãng" });
      return;
    }
    onSave(formData);
    handleClose();
  };

  const handleLogoFile = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    setIsUploadingLogo(true);
    try {
      const [url] = await uploadProductImages([files[0]]);
      if (url) setFormData((prev) => ({ ...prev, logoUrl: url }));
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        logoUrl: error.message || "Không thể tải logo",
      }));
    } finally {
      setIsUploadingLogo(false);
      event.target.value = "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[86vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <Building2 className="h-5 w-5 text-blue-600" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">Điền thông tin hãng sản xuất.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Tên hãng *</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  className={`h-10 pl-10 ${errors.name ? "border-red-500" : ""}`}
                  placeholder="Ví dụ: Bandai"
                />
              </div>
              {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Logo URL</Label>
              <div className="relative">
                <Image className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={formData.logoUrl}
                  onChange={(e) => setFormData((p) => ({ ...p, logoUrl: e.target.value }))}
                  className="h-10 pl-10"
                  placeholder="https://..."
                />
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoFile}
                  disabled={isUploadingLogo}
                  className="h-10 cursor-pointer"
                />
                {isUploadingLogo && <span className="whitespace-nowrap text-xs text-gray-500">Đang tải...</span>}
              </div>
              {formData.logoUrl && (
                <div className="flex h-14 w-32 items-center justify-center rounded-md border border-gray-200 bg-white p-2">
                  <img src={formData.logoUrl} alt="Xem trước logo hãng" className="max-h-10 max-w-full object-contain" />
                </div>
              )}
              {errors.logoUrl && <p className="text-xs text-red-600">{errors.logoUrl}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Quốc gia</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData((p) => ({ ...p, country: e.target.value }))}
                  className="h-10 pl-10"
                  placeholder="Ví dụ: Nhật Bản"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Mô tả</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  rows={4}
                  className="resize-none pl-10"
                  placeholder="Mô tả ngắn về hãng..."
                />
              </div>
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
    </Dialog>
  );
}
