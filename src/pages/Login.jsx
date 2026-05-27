import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ShoppingBag } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import backgroundImage from "../image/hinh-nen-gundam-3.jpg";

export function Login() {
  const navigate = useNavigate();
  const { loginCustomer, loginWithGoogle } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
            toast.error("Đăng nhập Google thất bại");
            return;
          }
          const success = await loginWithGoogle(token);
          if (success) {
            toast.success("Đăng nhập Google thành công!");
            setTimeout(() => navigate("/"), 300);
          } else {
            toast.error("Đăng nhập Google thất bại");
          }
        },
      });

      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: "standard",
        shape: "rectangular",
        theme: "outline",
        text: "signin_with",
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
    setIsSubmitting(true);
    const success = await loginCustomer(email, password);
    setIsSubmitting(false);

    if (success) {
      toast.success("Đăng nhập thành công!", {
        description: "Chào mừng bạn quay trở lại!",
      });
      setTimeout(() => navigate("/"), 400);
      return;
    }

    toast.error("Đăng nhập thất bại!", {
      description: "Email hoặc mật khẩu không đúng.",
    });
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
              <ShoppingBag className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Đăng nhập</h1>
            <p className="text-gray-600">Trang đăng nhập dành cho khách hàng</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked)}
                />
                <label htmlFor="remember" className="text-sm text-gray-700 cursor-pointer">
                  Ghi nhớ đăng nhập
                </label>
              </div>
              <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Quên mật khẩu?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md shadow-purple-500/20 hover:from-blue-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>

            {googleClientId ? (
              <div>
                <div className="mb-2 text-center text-sm text-gray-500">Hoặc đăng nhập với Google</div>
                <div ref={googleButtonRef} className="flex justify-center" />
              </div>
            ) : null}
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-gray-600">
              Chưa có tài khoản?{" "}
              <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 relative">
        <div className="absolute inset-0 bg-black/20"></div>
        <img
          src={backgroundImage}
          alt="Toy Models"
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay"
        />
      </div>
    </div>
  );
}
