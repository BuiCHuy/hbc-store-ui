import React, { useEffect, useState } from "react";
import { ShoppingCart, Shield, Star, Truck, Zap } from "lucide-react";
import { Button } from "../ui/button";
import { LoginPromptModal } from "../LoginPromptModal";
import { useAuth } from "../../contexts/AuthContext";
import { GuestCheckoutModal } from "../GuestCheckoutModal";
import { OrderConfirmationModal } from "../OrderConfirmationModal";
import { OrderSuccessModal } from "../OrderSuccessModal";
import { PaymentQrModal } from "../PaymentQrModal";
import { addCartItem } from "../../services/cartStorage";
import { toast } from "sonner";
import {
  createOrder,
  createPayOSPayment,
  getCoupons,
  getOrderById,
} from "../../services/adminApi";

export function ProductInfo({
  id,
  image,
  brand,
  category,
  title,
  price,
  originalPrice,
  rating,
  reviewCount,
  description,
  inStock,
}) {
  const { isLoggedIn, isAdmin, user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isOrderConfirmationModalOpen, setIsOrderConfirmationModalOpen] = useState(false);
  const [isOrderSuccessModalOpen, setIsOrderSuccessModalOpen] = useState(false);
  const [isMomoPaymentModalOpen, setIsMomoPaymentModalOpen] = useState(false);
  const [checkoutData, setCheckoutData] = useState(null);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [momoPayment, setMomoPayment] = useState(null);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [appliedVoucher, setAppliedVoucher] = useState("");
  const [appliedCouponId, setAppliedCouponId] = useState(null);

  useEffect(() => {
    let mounted = true;
    getCoupons()
      .then((data) => {
        if (mounted) setAvailableCoupons(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (mounted) setAvailableCoupons([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isMomoPaymentModalOpen || !createdOrder?.id) return undefined;
    let active = true;

    const interval = setInterval(async () => {
      if (!active) return;
      setIsCheckingPayment(true);
      try {
        const latestOrder = await getOrderById(createdOrder.id);
        if (!active) return;
        if (latestOrder.status === "CANCELLED") {
          setCreatedOrder(latestOrder);
          setIsMomoPaymentModalOpen(false);
          toast.error("Đơn đã bị hủy do quá hạn thanh toán");
          return;
        }
        if (latestOrder.payment_status === "PAID") {
          setCreatedOrder(latestOrder);
          setIsMomoPaymentModalOpen(false);
          setIsOrderSuccessModalOpen(true);
          toast.success("Đã xác nhận thanh toán thành công");
        }
      } catch {
        // silent retry
      } finally {
        if (active) setIsCheckingPayment(false);
      }
    }, 4000);

    return () => {
      active = false;
      clearInterval(interval);
      setIsCheckingPayment(false);
    };
  }, [isMomoPaymentModalOpen, createdOrder?.id]);

  const formatPrice = (value) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);

  const discountPercent = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  const decreaseQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const increaseQuantity = () => {
    if (quantity < 10) setQuantity(quantity + 1);
  };

  const buyNowItem = {
    id: id ?? 1,
    image,
    name: title,
    brand,
    category,
    price,
    quantity,
  };

  const subtotal = price * quantity;
  const shippingFee = subtotal > 1000000 ? 0 : 35000;
  const total = subtotal + shippingFee - discount;
  const checkoutInitialData = {
    fullName: user?.name || "",
    phoneNumber: user?.phoneNumber || "",
    email: user?.email || "",
    address: user?.address || "",
    voucherCode: checkoutData?.voucherCode || appliedVoucher,
    paymentMethod: checkoutData?.paymentMethod || "COD",
  };
  const successTotalAmount = Number(createdOrder?.totalAmount ?? createdOrder?.total_amount ?? total);
  const successPaymentMethod =
    createdOrder?.paymentMethod ?? createdOrder?.payment_method ?? checkoutData?.paymentMethod;
  const successCustomerEmail = createdOrder?.guestEmail ?? createdOrder?.guest_email ?? checkoutData?.email;

  const applyCouponCode = (rawCode) => {
    const code = String(rawCode || "").trim().toUpperCase();

    if (!code) {
      setDiscount(0);
      setAppliedVoucher("");
      setAppliedCouponId(null);
      return { ok: true, discountAmount: 0, code: "", couponId: null };
    }

    const coupon = availableCoupons.find((item) => String(item.code || "").toUpperCase() === code);
    if (!coupon) return { ok: false, message: "Mã giảm giá không hợp lệ" };

    const now = new Date();
    const startOk = !coupon.start_date || new Date(coupon.start_date) <= now;
    const endOk = !coupon.end_date || new Date(coupon.end_date) >= now;
    const isActive = String(coupon.status || "").toLowerCase() === "active";
    const usageLimit = Number(coupon.usage_limit || 0);
    const usageCount = Number(coupon.usage_count || 0);
    const usageOk = usageLimit <= 0 || usageCount < usageLimit;
    const minOrderValue = Number(coupon.min_order_value || 0);

    if (!isActive || !startOk || !endOk || !usageOk) {
      return { ok: false, message: "Mã giảm giá đã hết hạn hoặc chưa khả dụng" };
    }

    if (subtotal < minOrderValue) {
      return {
        ok: false,
        message: `Đơn hàng cần tối thiểu ${new Intl.NumberFormat("vi-VN").format(minOrderValue)} đ để áp mã`,
      };
    }

    let computedDiscount = 0;
    if (coupon.discount_type === "PERCENTAGE") {
      computedDiscount = (subtotal * Number(coupon.discount_value || 0)) / 100;
      const maxDiscount = Number(coupon.max_discount_amount || 0);
      if (maxDiscount > 0) computedDiscount = Math.min(computedDiscount, maxDiscount);
    } else {
      computedDiscount = Number(coupon.discount_value || 0);
    }

    computedDiscount = Math.min(Math.max(Math.floor(computedDiscount), 0), subtotal);
    setDiscount(computedDiscount);
    setAppliedVoucher(code);
    setAppliedCouponId(coupon.id ?? null);
    return { ok: true, discountAmount: computedDiscount, code, couponId: coupon.id ?? null };
  };

  const handleBuyNow = () => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }
    if (isAdmin) {
      toast.error("Tài khoản admin không thể mua hàng");
      return;
    }
    setIsCheckoutModalOpen(true);
  };

  const handleCheckoutSubmit = (data) => {
    const result = applyCouponCode(data.voucherCode || "");
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    setCheckoutData({ ...data, voucherCode: result.code });
    setIsCheckoutModalOpen(false);
    setIsOrderConfirmationModalOpen(true);
  };

  const handleEditOrder = () => {
    setIsOrderConfirmationModalOpen(false);
    setIsCheckoutModalOpen(true);
  };

  const handleOrderConfirm = async () => {
    if (isSubmittingOrder) return;
    setIsSubmittingOrder(true);
    try {
      const order = await createOrder({
        checkoutData,
        cartItems: [buyNowItem],
        couponId: appliedCouponId,
        shippingFee,
        discountAmount: discount,
      });
      setCreatedOrder(order);
      setIsOrderConfirmationModalOpen(false);

      if (checkoutData?.paymentMethod === "BANK_TRANSFER") {
        try {
          const momo = await createPayOSPayment(order.id);
          setMomoPayment(momo);
          setIsMomoPaymentModalOpen(true);
        } catch (paymentError) {
          setMomoPayment(null);
          setIsMomoPaymentModalOpen(true);
          toast.warning("Đã tạo đơn hàng. Chưa tạo được link PayOS, vui lòng thử lại trong trang đơn hàng.", {
            description: paymentError.message,
          });
        }
      } else {
        setIsOrderSuccessModalOpen(true);
      }
    } catch (error) {
      toast.error("Không thể tạo đơn hàng", {
        description: error.message,
      });
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="inline-block rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700">{brand}</div>

      <h1 className="text-2xl font-bold leading-tight text-gray-900 md:text-3xl">{title}</h1>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`}
              />
            ))}
          </div>
          <span className="text-xs font-medium text-gray-900">{rating}</span>
          <span className="text-xs text-gray-500">({reviewCount} đánh giá)</span>
        </div>
        <div className="h-4 w-px bg-gray-300" />
        <span className={`text-xs font-medium ${inStock ? "text-green-600" : "text-red-600"}`}>
          {inStock ? "Còn hàng" : "Hết hàng"}
        </span>
      </div>

      <div className="flex flex-wrap items-baseline gap-2">
        <span className="text-2xl font-bold text-gray-900 md:text-3xl">{formatPrice(price)}</span>
        {originalPrice ? (
          <>
            <span className="text-base text-gray-400 line-through">{formatPrice(originalPrice)}</span>
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">-{discountPercent}%</span>
          </>
        ) : null}
      </div>

      <p className="text-sm leading-relaxed text-gray-700">{description}</p>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex items-center gap-1.5 text-xs text-gray-700">
          <Shield className="h-4 w-4 text-purple-600" />
          <span>100% Chính hãng</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-700">
          <Truck className="h-4 w-4 text-purple-600" />
          <span>Miễn phí vận chuyển</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-700">
          <Zap className="h-4 w-4 text-purple-600" />
          <span>Giao hàng nhanh</span>
        </div>
      </div>

      <div className="space-y-3 border-t border-gray-200 pt-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-gray-900">Số lượng</label>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-md border border-gray-200">
              <button
                type="button"
                onClick={decreaseQuantity}
                className="flex h-9 w-9 items-center justify-center transition-colors hover:bg-gray-100"
              >
                <span className="text-base font-semibold text-gray-600">-</span>
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (val >= 1 && val <= 10) setQuantity(val);
                }}
                className="h-9 w-12 border-x border-gray-200 text-center text-sm font-semibold text-gray-900"
              />
              <button
                type="button"
                onClick={increaseQuantity}
                className="flex h-9 w-9 items-center justify-center transition-colors hover:bg-gray-100"
              >
                <span className="text-base font-semibold text-gray-600">+</span>
              </button>
            </div>
            <span className="text-xs text-gray-500">Tối đa 10 sản phẩm/đơn</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            className="h-10 flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-xs text-white shadow-md shadow-purple-500/20 hover:from-purple-700 hover:to-blue-700"
            disabled={!inStock || isAdmin}
            onClick={() => {
              if (!isLoggedIn) {
                setShowLoginPrompt(true);
                return;
              }
              if (isAdmin) {
                toast.error("Tài khoản admin không thể mua hàng");
                return;
              }
              addCartItem(buyNowItem, quantity);
              toast.success("Đã thêm vào giỏ hàng");
            }}
          >
            <ShoppingCart className="mr-1.5 h-4 w-4" />
            Thêm vào giỏ
          </Button>
          <Button
            variant="outline"
            className="h-10 flex-1 border border-purple-600 text-xs text-purple-600 hover:bg-purple-50"
            disabled={!inStock || isAdmin}
            onClick={handleBuyNow}
          >
            <Zap className="mr-1.5 h-4 w-4" />
            Mua ngay
          </Button>
        </div>

        <div className="rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 p-3">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="mb-1 font-semibold text-gray-900">Thanh toán an toàn</p>
              <p className="text-gray-600">Mã hóa SSL</p>
            </div>
            <div>
              <p className="mb-1 font-semibold text-gray-900">Đổi trả 30 ngày</p>
              <p className="text-gray-600">Hoàn tiền 100%</p>
            </div>
          </div>
        </div>
      </div>

      <LoginPromptModal isOpen={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} />

      <GuestCheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        onSubmit={handleCheckoutSubmit}
        initialData={checkoutInitialData}
      />

      {checkoutData ? (
        <OrderConfirmationModal
          isOpen={isOrderConfirmationModalOpen}
          onClose={() => setIsOrderConfirmationModalOpen(false)}
          onConfirm={handleOrderConfirm}
          onEdit={handleEditOrder}
          checkoutData={checkoutData}
          cartItems={[buyNowItem]}
          subtotal={subtotal}
          shipping={shippingFee}
          discount={discount}
          appliedVoucher={appliedVoucher}
          isSubmitting={isSubmittingOrder}
        />
      ) : null}

      {checkoutData ? (
        <OrderSuccessModal
          isOpen={isOrderSuccessModalOpen}
          onClose={() => setIsOrderSuccessModalOpen(false)}
          orderNumber={createdOrder?.code || "#HBC" + Date.now().toString().slice(-6)}
          totalAmount={successTotalAmount}
          paymentMethod={successPaymentMethod}
          customerEmail={successCustomerEmail}
        />
      ) : null}

      <PaymentQrModal
        isOpen={isMomoPaymentModalOpen}
        onClose={() => setIsMomoPaymentModalOpen(false)}
        orderCode={createdOrder?.code}
        amount={successTotalAmount}
        qrCodeUrl={momoPayment?.qrCodeUrl || momoPayment?.qrCodeURL || ""}
        payUrl={momoPayment?.payUrl || ""}
        isCheckingPayment={isCheckingPayment}
        paymentStatus={createdOrder?.payment_status}
        paymentExpiredAt={createdOrder?.payment_expired_at}
      />
    </div>
  );
}
