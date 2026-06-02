import React, { useEffect, useRef, useState } from "react";
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
  const { registerCustomer, loginWithGoogle } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyTargetEmail, setVerifyTargetEmail] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const googleButtonRef = useRef(null);

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) return;

    const initGoogle = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          const token = response?.credential;
          if (!token) {
            toast.error("Đăng ký Google thất bại");
            return;
          }
          const success = await loginWithGoogle(token);
          if (success) {
            toast.success("Đăng ký Google thành công!");
            setTimeout(() => navigate("/"), 300);
          } else {
            toast.error("Đăng ký Google thất bại");
          }
        },
      });

      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: "standard",
        shape: "rectangular",
        theme: "outline",
        text: "signup_with",
        size: "large",
        width: 320,
      });
    };

    if (window.google?.accounts?.id) {
      initGoogle();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [googleClientId, loginWithGoogle, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Lỗi đăng ký!", {
        description: "Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.",
      });
      return;
    }

    setIsSubmitting(true);
    const result = await registerCustomer({
      email: formData.email,
      password: formData.password,
      fullName: formData.fullName,
    });
    setIsSubmitting(false);

    if (!result?.success) {
      toast.error("Đăng ký thất bại!", {
        description: result?.message || "Thông tin đăng ký không hợp lệ.",
      });
      return;
    }

    setVerifyTargetEmail(formData.email);
    setVerifyModalOpen(true);
  };

  const passwordRequirements = [
    { met: formData.password.length >= 8, text: "Ít nhất 8 ký tự" },
    { met: /[A-Z]/.test(formData.password), text: "Một chữ hoa" },
    { met: /[0-9]/.test(formData.password), text: "Một số" },
  ];

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden flex-1 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 lg:flex">
        <div className="absolute inset-0 bg-black/20" />
        <img
          src="https://images.unsplash.com/photo-1755962270071-d8e353c7ca97?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xvcmZ1bCUyMGFjdGlvbiUyMGZpZ3VyZXMlMjBkaXNwbGF5fGVufDF8fHx8MTc3NDQxMTQwM3ww&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Colorful Toy Models"
          className="absolute inset-0 h-full w-full object-cover mix-blend-overlay"
        />
        <div className="relative z-10 flex flex-col items-center justify-center p-12 text-center text-white">
          <h2 className="mb-4 text-4xl font-bold">Gia nhập cộng đồng</h2>
          <p className="max-w-md text-xl opacity-90">
            Tham gia cùng hàng ngàn người yêu thích mô hình để khám phá, chia sẻ và sưu tầm.
          </p>
          <div className="mt-12 max-w-md space-y-6">
            {[
              ["Miễn phí vận chuyển", "Cho đơn hàng từ 500.000đ"],
              ["Ưu đãi độc quyền", "Giảm giá đặc biệt cho thành viên"],
              ["Truy cập sớm", "Mua trước các mô hình mới nhất"],
            ].map(([title, desc]) => (
              <div key={title} className="flex items-start gap-4 text-left">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
                  <Check className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="mb-1 font-semibold">{title}</h3>
                  <p className="text-sm opacity-90">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-y-auto bg-white p-8">
        <div className="my-8 w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-orange-500">
              <ShoppingBag className="h-8 w-8 text-white" />
            </div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900">Tạo tài khoản</h1>
            <p className="text-gray-600">Bắt đầu hành trình sưu tầm của bạn</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fullName">Họ và tên</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Nguyễn Văn A"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="h-12 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {formData.password && (
                <div className="mt-2 space-y-1">
                  {passwordRequirements.map((req, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 text-sm ${req.met ? "text-green-600" : "text-gray-500"}`}
                    >
                      <Check className={`h-4 w-4 ${req.met ? "opacity-100" : "opacity-30"}`} />
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
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  className="h-12 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={formData.agreeToTerms}
                onCheckedChange={(checked) => setFormData({ ...formData, agreeToTerms: checked })}
                className="mt-1"
              />
              <label htmlFor="terms" className="cursor-pointer text-sm text-gray-700">
                Tôi đồng ý với{" "}
                <a href="#terms" className="font-medium text-blue-600 hover:text-blue-700">
                  Điều khoản dịch vụ
                </a>{" "}
                và{" "}
                <a href="#privacy" className="font-medium text-blue-600 hover:text-blue-700">
                  Chính sách bảo mật
                </a>
              </label>
            </div>

            <Button
              type="submit"
              className="h-12 w-full bg-gradient-to-r from-purple-600 to-orange-500 text-base text-white shadow-md shadow-purple-500/20 hover:from-purple-700 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={!formData.agreeToTerms || isSubmitting}
            >
              {isSubmitting ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Đã có tài khoản?{" "}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700">
                Đăng nhập
              </Link>
            </p>
          </div>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-gray-500">Hoặc đăng ký với</span>
              </div>
            </div>

            {googleClientId ? (
              <div className="mt-6 flex justify-center">
                <div ref={googleButtonRef} />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {verifyModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900">Đăng ký thành công</h3>
            <p className="mt-2 text-sm text-gray-600">
              Một email xác nhận đã được gửi đến <span className="font-medium">{verifyTargetEmail}</span>. Vui lòng mở
              email và bấm link để kích hoạt tài khoản trong vòng 30 phút. Nếu quá thời gian này mà chưa xác thực, tài
              khoản sẽ tự động bị xóa.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setVerifyModalOpen(false)}>
                Đóng
              </Button>
              <Button
                onClick={() => {
                  setVerifyModalOpen(false);
                  navigate("/login");
                }}
              >
                Về đăng nhập
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
