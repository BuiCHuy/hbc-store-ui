import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { User, Phone, MapPin, Wallet, Banknote, Package, Truck, CheckCircle2, Edit3, Loader2 } from "lucide-react";

export function OrderConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  onEdit,
  checkoutData,
  cartItems,
  subtotal,
  shipping,
  discount,
  appliedVoucher,
  isSubmitting = false,
}) {
  const total = subtotal + shipping - discount;

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  const paymentText =
    checkoutData?.paymentMethod === "COD"
      ? "Thanh toán khi nhận hàng (COD)"
      : "Chuyển khoản ngân hàng";

  if (!checkoutData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={isSubmitting ? undefined : onClose}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto p-0">
        <DialogDescription className="sr-only">
          Xác nhận đơn hàng với {cartItems.length} sản phẩm, tổng giá trị {formatPrice(total)}
        </DialogDescription>

        <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 text-white shadow-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-white">
              <CheckCircle2 className="h-7 w-7" />
              Xác nhận đặt hàng
            </DialogTitle>
            <p className="mt-1 text-sm text-blue-100">Vui lòng kiểm tra thông tin trước khi xác nhận</p>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6">
          <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-5">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
              <Truck className="h-5 w-5 text-blue-600" />
              Thông tin giao hàng
            </h3>
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-gray-500">Người nhận</p>
                  <p className="font-semibold text-gray-900">{checkoutData.fullName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-gray-500">Số điện thoại</p>
                  <p className="font-semibold text-gray-900">{checkoutData.phoneNumber}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 sm:col-span-2">
                <MapPin className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-gray-500">Địa chỉ nhận hàng</p>
                  <p className="font-semibold text-gray-900">{checkoutData.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 sm:col-span-2">
                {checkoutData.paymentMethod === "COD" ? (
                  <Wallet className="h-5 w-5 text-blue-600" />
                ) : (
                  <Banknote className="h-5 w-5 text-green-600" />
                )}
                <div>
                  <p className="text-gray-500">Phương thức thanh toán</p>
                  <p className="font-semibold text-gray-900">{paymentText}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
              <Package className="h-5 w-5 text-blue-600" />
              Sản phẩm đã chọn ({cartItems.length})
            </h3>
            <div className="divide-y rounded-xl border border-gray-200 bg-white">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4">
                  <img src={item.image} alt={item.name} className="h-16 w-16 rounded-lg bg-gray-100 object-cover" />
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-semibold text-gray-900">{item.name}</h4>
                    <p className="text-xs text-gray-500">{item.brand}</p>
                    <p className="text-xs text-gray-600">Số lượng: x{item.quantity}</p>
                  </div>
                  <p className="text-sm font-bold text-blue-600">{formatPrice(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-3 rounded-xl border-2 border-blue-200 bg-blue-50 p-5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tạm tính</span>
              <span className="font-semibold">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Phí vận chuyển</span>
              <span className="font-semibold">{formatPrice(shipping)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-700">
                <span>Mã giảm giá {appliedVoucher && `(${appliedVoucher})`}</span>
                <span className="font-bold">-{formatPrice(discount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-blue-200 pt-3">
              <span className="text-base font-bold text-gray-900">Tổng tiền cuối cùng</span>
              <span className="text-3xl font-extrabold text-blue-700">{formatPrice(total)}</span>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3 border-t border-gray-200 pt-6">
            <Button type="button" variant="outline" onClick={onEdit} disabled={isSubmitting} className="h-12 px-6">
              <Edit3 className="mr-2 h-4 w-4" />
              Chỉnh sửa thông tin
            </Button>
            <Button type="button" onClick={onConfirm} disabled={isSubmitting} className="h-12 bg-blue-600 px-8 font-bold text-white hover:bg-blue-700">
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
              {isSubmitting ? "Đang xử lý..." : "Tôi xác nhận đặt đơn hàng này"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

