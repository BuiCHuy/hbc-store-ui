import React, { useEffect, useMemo, useState } from "react";
import { Edit, Loader2, Plus, Save, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import {
  createSubcategory,
  deleteSubcategory,
  getSubcategories,
  uploadProductImages,
  updateSubcategory,
} from "../../hooks/useCatalog";
import { getErrorMessageVi } from "../../lib/api";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

export function SubcategoryManagerModal({ isOpen, onClose, category }) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", iconUrl: "" });

  const title = useMemo(() => category?.name || "Danh mục", [category]);

  useEffect(() => {
    if (!isOpen || !category?.id) return;
    let active = true;
    setIsLoading(true);
    getSubcategories(category.id)
      .then((data) => {
        if (!active) return;
        setItems(data || []);
      })
      .catch(() => {
        if (!active) return;
        setItems([]);
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isOpen, category?.id]);

  const resetForm = () => {
    setEditing(null);
    setForm({ name: "", description: "", iconUrl: "" });
  };

  const handleSave = async () => {
    if (!form.name.trim() || !category?.id) return;
    setIsSaving(true);
    try {
      if (editing) {
        const updated = await updateSubcategory(editing.id, {
          name: form.name.trim(),
          description: form.description.trim(),
          iconUrl: form.iconUrl.trim(),
          categoryId: category.id,
          status: editing.status || "ACTIVE",
        });
        setItems((prev) => prev.map((it) => (it.id === updated.id ? { ...it, ...updated } : it)));
        toast.success("Đã cập nhật danh mục con");
      } else {
        const created = await createSubcategory({
          name: form.name.trim(),
          description: form.description.trim(),
          iconUrl: form.iconUrl.trim(),
          categoryId: category.id,
          status: "ACTIVE",
        });
        setItems((prev) => [created, ...prev]);
        toast.success("Đã thêm danh mục con");
      }
      resetForm();
    } catch (error) {
      toast.error("Không thể lưu danh mục con", {
        description: getErrorMessageVi(error, "Không thể lưu danh mục con."),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item) => {
    try {
      await deleteSubcategory(item.id);
      setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, status: "INACTIVE" } : it)));
      toast.success("Đã ẩn danh mục con");
    } catch (error) {
      toast.error("Không thể xóa danh mục con", {
        description: getErrorMessageVi(error, "Không thể xóa danh mục con."),
      });
    }
  };

  const handleIconUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    setIsUploading(true);
    try {
      const [url] = await uploadProductImages([files[0]]);
      if (!url) return;
      setForm((prev) => ({ ...prev, iconUrl: url }));
      toast.success("Đã tải ảnh lên");
    } catch (error) {
      toast.error("Không thể tải ảnh lên", {
        description: getErrorMessageVi(error, "Không thể tải ảnh lên."),
      });
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const startEdit = (item) => {
    setEditing(item);
    setForm({
      name: item.name || "",
      description: item.description || "",
      iconUrl: item.iconUrl || "",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
      <DialogContent className="max-h-[86vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Danh mục con: {title}</DialogTitle>
          <DialogDescription>Quản lý nhóm con ngay trong danh mục đã chọn.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900">{editing ? "Chỉnh sửa" : "Thêm mới"}</h4>
              {editing && (
                <Button variant="outline" size="sm" onClick={resetForm}>
                  <X className="mr-1 h-4 w-4" />
                  Hủy sửa
                </Button>
              )}
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Tên danh mục con</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Ví dụ: Mô hình Anime"
                />
              </div>
              <div className="space-y-1">
                <Label>Mô tả</Label>
                <Textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Mô tả ngắn..."
                />
              </div>
              <div className="space-y-1">
                <Label>URL ảnh danh mục con</Label>
                <Input
                  value={form.iconUrl}
                  onChange={(e) => setForm((p) => ({ ...p, iconUrl: e.target.value }))}
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
              </div>
              <Button className="w-full bg-blue-600 text-white hover:bg-blue-700" onClick={handleSave} disabled={isSaving}>
                {editing ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                {editing ? "Lưu chỉnh sửa" : "Thêm danh mục con"}
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <h4 className="mb-3 text-sm font-semibold text-gray-900">Danh sách hiện có</h4>
            <div className="space-y-2">
              {isLoading ? (
                <p className="text-sm text-gray-500">Đang tải...</p>
              ) : items.length === 0 ? (
                <p className="text-sm text-gray-500">Chưa có danh mục con.</p>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="rounded-md border border-gray-200 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                        {item.iconUrl ? (
                          <img
                            src={item.iconUrl}
                            alt={item.name}
                            className="mt-2 h-10 w-10 rounded-md border border-gray-200 object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : null}
                        <p className="mt-1 text-xs text-gray-500">{item.description || "Không có mô tả"}</p>
                        <p className="mt-1 text-[11px] font-medium text-gray-500">
                          Trạng thái: {item.status === "ACTIVE" ? "Hoạt động" : "Đã ẩn"}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => startEdit(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(item)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
