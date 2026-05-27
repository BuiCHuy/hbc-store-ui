import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ShoppingBag, Check } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";

export function Register() {
  const navigate = useNavigate();
  const { registerCustomer } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Lỗi đăng ký!", {
        description: "Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.",
      });
      return;
    }

    setIsSubmitting(true);
    const success = await registerCustomer({
      email: formData.email,
      password: formData.password,
      fullName: formData.fullName,
    });
    setIsSubmitting(false);

    if (!success) {
      toast.error("Đăng ký thất bại!", {
        description: "Email đã tồn tại hoặc thông tin không hợp lệ.",
      });
      return;
    }

    toast.success("Đăng ký thành công!", {
      description: "Chào mừng bạn đã gia nhập cộng đồng HBC Store.",
    });

    setTimeout(() => navigate("/"), 500);
  };

  const passwordRequirements = [
    { met: formData.password.length >= 8, text: "Ít nhất 8 ký tự" },
    { met: /[A-Z]/.test(formData.password), text: "Một chữ hoa" },
    { met: /[0-9]/.test(formData.password), text: "Một số" },
  ];

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500">
        <div className="absolute inset-0 bg-black/20"></div>
        <img
          src="https://images.unsplash.com/photo-1755962270071-d8e353c7ca97?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xvcmZ1bCUyMGFjdGlvbiUyMGZpZ3VyZXMlMjBkaXNwbGF5fGVufDF8fHx8MTc3NDQxMTQwM3ww&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Colorful Toy Models"
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay"
        />
        <div className="relative z-10 flex flex-col items-center justify-center p-12 text-white text-center">
          <h2 className="text-4xl font-bold mb-4">Gia nhập cộng đồng</h2>
          <p className="text-xl max-w-md opacity-90">
            Tham gia cùng hàng ngàn người yêu thích mô hình để khám phá, chia sẻ
            và sưu tầm
          </p>
          <div className="mt-12 space-y-6 max-w-md">
            {[
              ["Miễn phí vận chuyển", "Cho đơn hàng từ 500.000đ"],
              ["Ưu đãi độc quyền", "Giảm giá đặc biệt cho thành viên"],
              ["Truy cập sớm", "Mua trước các mô hình mới nhất"],
            ].map(([title, desc]) => (
              <div key={title} className="flex items-start gap-4 text-left">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{title}</h3>
                  <p className="text-sm opacity-90">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-md my-8">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-orange-500 rounded-2xl mb-4">
              <ShoppingBag className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Tạo tài khoản
            </h1>
            <p className="text-gray-600">
              Bắt đầu hành trình sưu tầm của bạn
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fullName">Họ và tên</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Nguyễn Văn A"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Tạo mật khẩu mạnh"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  className="h-12 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {formData.password && (
                <div className="mt-2 space-y-1">
                  {passwordRequirements.map((req, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 text-sm ${
                        req.met ? "text-green-600" : "text-gray-500"
                      }`}
                    >
                      <Check
                        className={`w-4 h-4 ${
                          req.met ? "opacity-100" : "opacity-30"
                        }`}
                      />
                      <span>{req.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Nhập lại mật khẩu"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  required
                  className="h-12 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={formData.agreeToTerms}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, agreeToTerms: checked })
                }
                className="mt-1"
              />
              <label
                htmlFor="terms"
                className="text-sm text-gray-700 cursor-pointer"
              >
                Tôi đồng ý với{" "}
                <a
                  href="#terms"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Điều khoản dịch vụ
                </a>{" "}
                và{" "}
                <a
                  href="#privacy"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Chính sách bảo mật
                </a>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base bg-gradient-to-r from-purple-600 to-orange-500 text-white shadow-md shadow-purple-500/20 hover:from-purple-700 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={!formData.agreeToTerms || isSubmitting}
            >
              {isSubmitting ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Đã có tài khoản?{" "}
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Đăng nhập
              </Link>
            </p>
          </div>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">
                  Hoặc đăng ký với
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <Button type="button" variant="outline" className="h-12">
                Google
              </Button>
              <Button type="button" variant="outline" className="h-12">
                Facebook
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
