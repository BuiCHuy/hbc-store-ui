import React, { useState } from "react";
import {
  AlertCircle,
  Home,
  Lock,
  Mail,
  Phone,
  Save,
  Shield,
  User,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const initialFormData = {
  full_name: "",
  email: "",
  phone_number: "",
  address: "",
  password: "",
  role: "CUSTOMER",
};

export function AddUserModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.full_name.trim()) {
      nextErrors.full_name = "Vui lòng nhập họ và tên";
    }

    if (!formData.email.trim()) {
      nextErrors.email = "Vui lòng nhập email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = "Email không hợp lệ";
    }

    if (!formData.phone_number.trim()) {
      nextErrors.phone_number = "Vui lòng nhập số điện thoại";
    } else if (!/^(0|\+84)[0-9\s]{9,13}$/.test(formData.phone_number.trim())) {
      nextErrors.phone_number = "Số điện thoại không hợp lệ";
    }

    if (!formData.password.trim()) {
      nextErrors.password = "Vui lòng nhập mật khẩu";
    } else if (formData.password.length < 6) {
      nextErrors.password = "Mật khẩu tối thiểu 6 ký tự";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    onSave({
      ...formData,
      address: formData.address.trim() || "Chưa cập nhật",
    });
    handleClose();
  };

  const handleClose = () => {
    setFormData(initialFormData);
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[86vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <User className="h-6 w-6 text-purple-600" />
            Thêm người dùng mới
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Tạo tài khoản khách hàng hoặc quản trị viên trong hệ thống.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-5 py-4 md:grid-cols-2">
            <Field
              id="full_name"
              label="Họ và tên"
              required
              icon={User}
              error={errors.full_name}
            >
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(event) => updateField("full_name", event.target.value)}
                placeholder="Ví dụ: Nguyễn Văn An"
                className={`h-11 pl-11 ${errors.full_name ? "border-red-500" : ""}`}
              />
            </Field>

            <Field id="email" label="Email" required icon={Mail} error={errors.email}>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="user@email.com"
                className={`h-11 pl-11 ${errors.email ? "border-red-500" : ""}`}
              />
            </Field>

            <Field
              id="phone_number"
              label="Số điện thoại"
              required
              icon={Phone}
              error={errors.phone_number}
            >
              <Input
                id="phone_number"
                value={formData.phone_number}
                onChange={(event) => updateField("phone_number", event.target.value)}
                placeholder="0912345678"
                className={`h-11 pl-11 ${
                  errors.phone_number ? "border-red-500" : ""
                }`}
              />
            </Field>

            <Field
              id="password"
              label="Mật khẩu"
              required
              icon={Lock}
              error={errors.password}
            >
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(event) => updateField("password", event.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className={`h-11 pl-11 ${errors.password ? "border-red-500" : ""}`}
              />
            </Field>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-sm font-semibold text-gray-700">Vai trò</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => updateField("role", value)}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CUSTOMER">Khách hàng</SelectItem>
                  <SelectItem value="ADMIN">Quản trị viên</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label
                htmlFor="address"
                className="flex items-center gap-1 text-sm font-semibold text-gray-700"
              >
                Địa chỉ
                <span className="text-xs font-normal text-gray-400">(Tùy chọn)</span>
              </Label>
              <div className="relative">
                <Home className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(event) => updateField("address", event.target.value)}
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                  className="min-h-[90px] resize-none pl-11 pt-3"
                />
              </div>
            </div>
          </div>

          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
              <p className="text-sm text-amber-800">
                Tài khoản tạo từ màn hình admin sẽ dùng được ngay. Khi kết nối
                backend, mật khẩu cần được mã hóa ở server trước khi lưu cơ sở dữ liệu.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 border-t border-gray-100 pt-5 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="h-11 px-6"
            >
              <X className="mr-2 h-4 w-4" />
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              className="h-11 px-6 bg-gradient-to-r from-purple-600 to-blue-600 font-semibold text-white shadow-lg shadow-purple-500/30 hover:from-purple-700 hover:to-blue-700"
            >
              <Save className="mr-2 h-4 w-4" />
              Lưu người dùng
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ id, label, required, icon: Icon, error, children }) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor={id}
        className="flex items-center gap-1 text-sm font-semibold text-gray-700"
      >
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        {children}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
