import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle, Mail, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { apiPost, getErrorMessageVi } from "../lib/api";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = await apiPost(
        "/auth/forgot-password",
        { email },
        { skipAuth: true }
      );
      setSubmittedEmail(email.trim());
      setIsSubmitted(true);
      toast.success("Đã gửi yêu cầu", {
        description:
          data?.message || "Nếu email tồn tại, hệ thống đã gửi hướng dẫn đặt lại mật khẩu.",
      });
    } catch (error) {
      toast.error("Không thể gửi yêu cầu quên mật khẩu", {
        description: getErrorMessageVi(
          error,
          "Không thể gửi yêu cầu quên mật khẩu."
        ),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8">
      <div className="w-full max-w-md">
        <div className="rounded-3xl bg-white p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600">
              <ShoppingBag className="h-8 w-8 text-white" />
            </div>

            {!isSubmitted ? (
              <>
                <h1 className="mb-2 text-3xl font-bold text-gray-900">
                  Quên mật khẩu?
                </h1>
                <p className="text-gray-600">
                  Nhập email của bạn, hệ thống sẽ gửi liên kết đặt lại mật khẩu.
                </p>
              </>
            ) : (
              <>
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h1 className="mb-2 text-3xl font-bold text-gray-900">
                  Kiểm tra email của bạn
                </h1>
                <p className="text-gray-600">
                  Nếu email tồn tại, hệ thống đã gửi hướng dẫn đặt lại mật khẩu.
                </p>
              </>
            )}
          </div>

          {!isSubmitted ? (
            <>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Địa chỉ email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 pl-12"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-12 w-full bg-gradient-to-r from-purple-600 to-blue-600 text-base text-white shadow-md shadow-purple-500/20 hover:from-purple-700 hover:to-blue-700"
                >
                  {isSubmitting ? "Đang gửi..." : "Gửi hướng dẫn đặt lại mật khẩu"}
                </Button>
              </form>

              <div className="mt-6">
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 font-medium text-gray-600 transition-colors hover:text-purple-600"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Quay lại đăng nhập
                </Link>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm text-blue-800">
                  <strong>Email đã gửi đến:</strong> {submittedEmail}
                </p>
              </div>

              <div className="space-y-3 text-sm text-gray-600">
                <p>Vui lòng kiểm tra hộp thư đến và nhấn vào liên kết trong email.</p>
                <p>Nếu chưa thấy email, hãy kiểm tra thư mục spam hoặc thử lại sau.</p>
              </div>

              <Button
                type="button"
                variant="outline"
                className="h-12 w-full border-2"
                onClick={() => setIsSubmitted(false)}
              >
                Gửi lại email
              </Button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 font-medium text-gray-600 transition-colors hover:text-purple-600"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Quay lại đăng nhập
                </Link>
              </div>
            </div>
          )}

          <div className="mt-8 border-t border-gray-200 pt-6">
            <p className="text-center text-sm text-gray-600">
              Cần hỗ trợ?{" "}
              <span className="font-medium text-purple-600">Liên hệ chúng tôi</span>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm font-medium text-gray-600">
            Thông tin của bạn được bảo mật và mã hóa an toàn
          </p>
        </div>
      </div>
    </div>
  );
}
