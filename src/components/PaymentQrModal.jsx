import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { ExternalLink, Loader2 } from "lucide-react";

function formatVnd(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatRemaining(totalSeconds) {
  if (totalSeconds <= 0) return "00:00";
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function PaymentQrModal({
  isOpen,
  onClose,
  orderCode,
  amount,
  payUrl,
  isCheckingPayment,
  paymentStatus,
  paymentExpiredAt,
}) {
  const expiryTimestamp = useMemo(
    () => (paymentExpiredAt ? new Date(paymentExpiredAt).getTime() : null),
    [paymentExpiredAt]
  );
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    if (!isOpen || !expiryTimestamp || paymentStatus === "PAID") return undefined;

    const updateCountdown = () => {
      const remaining = Math.max(0, Math.floor((expiryTimestamp - Date.now()) / 1000));
      setRemainingSeconds(remaining);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [isOpen, expiryTimestamp, paymentStatus]);

  const isExpired = paymentStatus !== "PAID" && expiryTimestamp ? expiryTimestamp <= Date.now() : false;

  const handleOpenPayOS = () => {
    if (!payUrl) return;
    const win = window.open(payUrl, "_blank", "noopener,noreferrer");
    if (!win) {
      window.location.href = payUrl;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Thanh toán PayOS</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
            <p className="text-gray-600">
              Mã đơn: <span className="font-semibold text-gray-900">{orderCode}</span>
            </p>
            <p className="text-gray-600">
              Số tiền: <span className="font-semibold text-gray-900">{formatVnd(amount)}</span>
            </p>
          </div>

          <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-600">
            Bấm nút bên dưới để mở cổng thanh toán PayOS và hoàn tất giao dịch.
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
            Trạng thái thanh toán:{" "}
            <span className="font-semibold">{paymentStatus === "PAID" ? "Đã thanh toán" : "Chờ thanh toán"}</span>
          </div>

          {paymentStatus !== "PAID" && paymentExpiredAt ? (
            <div
              className={`rounded-lg border p-3 text-xs ${
                isExpired ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-700"
              }`}
            >
              {isExpired ? (
                "Đơn đã hết hạn thanh toán và sẽ bị hủy tự động."
              ) : (
                <>
                  <p>
                    Đếm ngược tự hủy đơn: <span className="font-semibold">{formatRemaining(remainingSeconds)}</span>
                  </p>
                  <p className="mt-1">Hạn thanh toán: {new Date(paymentExpiredAt).toLocaleString("vi-VN")}</p>
                </>
              )}
            </div>
          ) : null}

          <div className="flex gap-2">
            {payUrl ? (
              <Button className="flex-1 bg-purple-600 text-white hover:bg-purple-700" onClick={handleOpenPayOS}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Mở cổng PayOS
              </Button>
            ) : null}
            <Button variant="outline" onClick={onClose} className={payUrl ? "flex-1" : "w-full"}>
              Đóng
            </Button>
          </div>

          {isCheckingPayment ? (
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Đang kiểm tra trạng thái thanh toán...
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
