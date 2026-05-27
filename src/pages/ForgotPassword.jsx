import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, ShoppingBag, CheckCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Password reset requested for:", email);
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
              <ShoppingBag className="w-8 h-8 text-white" />
            </div>

            {!isSubmitted ? (
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Quên mật khẩu?
                </h1>
                <p className="text-gray-600">
                  Đừng lo lắng! Nhập email của bạn và chúng tôi sẽ gửi hướng
                  dẫn khôi phục mật khẩu.
                </p>
              </>
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Kiểm tra email của bạn
                </h1>
                <p className="text-gray-600">
                  Chúng tôi đã gửi hướng dẫn khôi phục mật khẩu đến email của
                  bạn.
                </p>
              </>
            )}
          </div>

          {!isSubmitted ? (
            <>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Địa chỉ Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
                  className="w-full h-12 text-base bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md shadow-purple-500/20"
                >
                  Gửi hướng dẫn khôi phục
                </Button>
              </form>

              <div className="mt-6">
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 text-gray-600 hover:text-purple-600 font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Quay lại đăng nhập
                </Link>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Email đã gửi đến:</strong> {email}
                </p>
              </div>

              <div className="space-y-3 text-sm text-gray-600">
                <p>
                  Vui lòng kiểm tra hộp thư đến của bạn và làm theo hướng dẫn
                  để đặt lại mật khẩu.
                </p>
                <p>
                  Nếu bạn không nhận được email trong vài phút, hãy kiểm tra thư
                  mục spam hoặc thử lại.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-2"
                onClick={() => setIsSubmitted(false)}
              >
                Gửi lại email
              </Button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 text-gray-600 hover:text-purple-600 font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Quay lại đăng nhập
                </Link>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600">
              Cần hỗ trợ?{" "}
              <Link
                to="#"
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                Liên hệ chúng tôi
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 font-medium">
            Thông tin của bạn được bảo mật và mã hóa an toàn
          </p>
        </div>
      </div>
    </div>
  );
}
