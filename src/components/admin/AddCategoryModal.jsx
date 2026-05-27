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
import { FolderOpen, FileText, Save, X } from "lucide-react";

export function AddCategoryModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  title = "Thêm danh mục mới",
  submitLabel = "Lưu danh mục",
}) {
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    setFormData({
      name: initialData?.name || "",
      description: initialData?.description || "",
    });
    setErrors({});
  }, [isOpen, initialData]);

  const handleClose = () => {
    setFormData({ name: "", description: "" });
    setErrors({});
    onClose();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!formData.name.trim()) {
      setErrors({ name: "Vui lòng nhập tên danh mục" });
      return;
    }
    onSave(formData);
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl max-h-[86vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-blue-600" />
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
                <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  className={`pl-10 h-10 ${errors.name ? "border-red-500" : ""}`}
                  placeholder="Ví dụ: Action Figure"
                />
              </div>
              {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Mô tả</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, description: e.target.value }))
                  }
                  rows={4}
                  className="pl-10 resize-none"
                  placeholder="Mô tả ngắn cho danh mục..."
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={handleClose} className="h-10 px-5">
              <X className="w-4 h-4 mr-2" />
              Hủy
            </Button>
            <Button type="submit" className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white">
              <Save className="w-4 h-4 mr-2" />
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
