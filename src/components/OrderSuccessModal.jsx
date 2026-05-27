import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { CheckCircle2, Mail, ShoppingBag, Search } from "lucide-react";
import { Link } from "react-router-dom";
import confetti from "canvas-confetti";

export function OrderSuccessModal({
  isOpen,
  onClose,
  orderNumber,
  totalAmount,
  paymentMethod,
  customerEmail,
}) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const duration = 2000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 25, spread: 360, ticks: 50, zIndex: 9999 };

      function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }
        const particleCount = 40 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.2, 0.4), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.6, 0.8), y: Math.random() - 0.2 },
        });
      }, 200);

      setTimeout(() => setShowContent(true), 100);

      return () => {
        clearInterval(interval);
        setShowContent(false);
      };
    }
  }, [isOpen]);

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md overflow-hidden rounded-3xl border-none p-0 shadow-2xl">
        <DialogTitle className="sr-only">Đặt hàng thành công</DialogTitle>
        <DialogDescription className="sr-only">Đơn hàng của bạn đã được đặt thành công.</DialogDescription>

        <div className={`transition-all duration-500 ${showContent ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
          <div className="relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 py-6 text-center">
            <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px]" />
            <div className="relative z-10">
              <div className="mb-3 inline-flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg animate-bounce-once">
                <CheckCircle2 className="h-10 w-10 text-green-500" strokeWidth={3} />
              </div>
              <h1 className="mb-1 text-2xl font-bold text-white">Thành công!</h1>
              <p className="text-sm text-green-50 opacity-90">Cảm ơn bạn đã mua hàng</p>
            </div>
          </div>

          <div className="space-y-5 px-6 py-6">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Mã đơn hàng</span>
                <span className="rounded bg-blue-50 px-2 py-0.5 text-sm font-bold text-blue-600">{orderNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Tổng thanh toán</span>
                <span className="text-lg font-bold text-green-600">{formatPrice(totalAmount)}</span>
              </div>
            </div>

            {customerEmail && (
              <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <p>
                  Xác nhận đã gửi tới: <span className="font-semibold">{customerEmail}</span>
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-2">
              <Link to="/" onClick={onClose}>
                <Button className="h-11 w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 font-bold text-white shadow-md transition-all hover:from-blue-700 hover:to-blue-800 active:scale-95">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Tiếp tục mua sắm
                </Button>
              </Link>
              <Link to="/orders" onClick={onClose}>
                <Button variant="ghost" className="h-11 w-full text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700">
                  <Search className="mr-2 h-4 w-4" />
                  Theo dõi đơn hàng
                </Button>
              </Link>
            </div>

            <p className="text-center text-[10px] text-gray-400">
              Mọi thắc mắc vui lòng liên hệ hotline: <span className="font-semibold">1900 1234</span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
