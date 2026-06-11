import React, { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, KeyRound, Lock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { apiPost, getErrorMessageVi } from "../lib/api";

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const hasToken = token.trim().length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasToken) {
      toast.error("Thiếu token đặt lại mật khẩu");
      return;
    }
    if (password.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await apiPost(
        "/auth/reset-password",
        { token, password },
        { skipAuth: true }
      );
      setIsSuccess(true);
      toast.success("Đặt lại mật khẩu thành công", {
        description:
          data?.message || "Bạn có thể đăng nhập ngay bây giờ.",
      });
      setTimeout(() => navigate("/login"), 1200);
    } catch (error) {
      toast.error("Không thể đặt lại mật khẩu", {
        description: getErrorMessageVi(
          error,
          "Không thể đặt lại mật khẩu."
        ),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        {isSuccess ? (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
            <h1 className="mt-4 text-center text-2xl font-bold text-gray-900">
              Đặt lại mật khẩu thành công
            </h1>
            <p className="mt-2 text-center text-sm text-gray-600">
              Bạn sẽ được chuyển về trang đăng nhập.
            </p>
          </>
        ) : !hasToken ? (
          <>
            <XCircle className="mx-auto h-12 w-12 text-red-600" />
            <h1 className="mt-4 text-center text-2xl font-bold text-gray-900">
              Liên kết không hợp lệ
            </h1>
            <p className="mt-2 text-center text-sm text-gray-600">
              Thiếu token đặt lại mật khẩu. Vui lòng yêu cầu lại email quên mật khẩu.
            </p>
            <Link
              to="/forgot-password"
              className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
            >
              Yêu cầu lại liên kết
            </Link>
          </>
        ) : (
          <>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-100">
                <KeyRound className="h-7 w-7 text-purple-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Đặt lại mật khẩu</h1>
              <p className="mt-2 text-sm text-gray-600">
                Nhập mật khẩu mới cho tài khoản của bạn.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu mới</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới"
                    required
                    className="h-12 pl-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    required
                    className="h-12 pl-12"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 w-full bg-purple-600 text-white hover:bg-purple-700"
              >
                {isSubmitting ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
              </Button>
            </form>

            <Link
              to="/login"
              className="mt-6 flex items-center justify-center gap-2 font-medium text-gray-600 transition-colors hover:text-purple-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại đăng nhập
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
