import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, Minus, Plus, ShoppingBag, ShieldCheck, Ticket, ChevronRight, Home } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Checkbox } from "../components/ui/checkbox";
import { toast } from "sonner";
import { deleteCartItem, getCartItems, updateCartItemQuantity } from "../services/cartStorage";
import {
  createOrder,
  createPayOSPayment,
  getOrderById,
  quoteOrder,
  syncPayOSPaymentStatus,
} from "../services/adminApi";
import { useAuth } from "../contexts/AuthContext";
import { GuestCheckoutModal } from "../components/GuestCheckoutModal";
import { OrderConfirmationModal } from "../components/OrderConfirmationModal";
import { OrderSuccessModal } from "../components/OrderSuccessModal";
import { PaymentQrModal } from "../components/PaymentQrModal";
import { parseShippingAddress } from "../lib/shipping";

function buildCheckoutSnapshot(checkoutData, user, voucherCode = "") {
  return {
    fullName: checkoutData?.fullName || user?.name || "",
    phoneNumber: checkoutData?.phoneNumber || user?.phoneNumber || "",
    email: checkoutData?.email || user?.email || "",
    address: checkoutData?.address || user?.address || "",
    province: checkoutData?.province || "",
    district: checkoutData?.district || "",
    ward: checkoutData?.ward || "",
    detailAddress: checkoutData?.detailAddress || "",
    voucherCode: String(checkoutData?.voucherCode || voucherCode || "").trim().toUpperCase(),
    paymentMethod: checkoutData?.paymentMethod || "COD",
  };
}

export function ShoppingCart() {
  const navigate = useNavigate();
  const { isAdmin, isLoggedIn, user } = useAuth();
  const previousProfileRef = useRef({
    fullName: "",
    phoneNumber: "",
    email: "",
    address: "",
  });

  const [cartItems, setCartItems] = useState(() => getCartItems());
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedVoucher, setAppliedVoucher] = useState("");
  const [appliedCouponId, setAppliedCouponId] = useState(null);
  const [selectedItems, setSelectedItems] = useState(() => getCartItems().map((item) => item.id));
  const [quotedItems, setQuotedItems] = useState([]);

  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isOrderConfirmationModalOpen, setIsOrderConfirmationModalOpen] = useState(false);
  const [isOrderSuccessModalOpen, setIsOrderSuccessModalOpen] = useState(false);
  const [isMomoPaymentModalOpen, setIsMomoPaymentModalOpen] = useState(false);
  const [checkoutData, setCheckoutData] = useState(null);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [momoPayment, setMomoPayment] = useState(null);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [pendingCheckoutItemIds, setPendingCheckoutItemIds] = useState([]);
  const [shippingFee, setShippingFee] = useState(0);

  const formatPrice = (price) => new Intl.NumberFormat("vi-VN").format(price);

  useEffect(() => {
    const latestItems = getCartItems();
    setCartItems(latestItems);
    setSelectedItems(latestItems.map((item) => item.id));
  }, [user?.id, user?.email]);

  useEffect(() => {
    const currentProfile = {
      fullName: user?.name || "",
      phoneNumber: user?.phoneNumber || "",
      email: user?.email || "",
      address: user?.address || "",
    };

    setCheckoutData((prev) => {
      if (!prev) {
        previousProfileRef.current = currentProfile;
        return prev;
      }

      const oldProfile = previousProfileRef.current;
      const oldParsedAddress = parseShippingAddress(oldProfile.address);
      const newParsedAddress = parseShippingAddress(currentProfile.address);
      const next = { ...prev };

      if (!prev.fullName || prev.fullName === oldProfile.fullName) next.fullName = currentProfile.fullName;
      if (!prev.phoneNumber || prev.phoneNumber === oldProfile.phoneNumber) next.phoneNumber = currentProfile.phoneNumber;
      if (!prev.email || prev.email === oldProfile.email) next.email = currentProfile.email;
      if (!prev.address || prev.address === oldProfile.address) next.address = currentProfile.address;
      if (!prev.province || prev.province === oldParsedAddress.province) next.province = newParsedAddress.province;
      if (!prev.district || prev.district === oldParsedAddress.district) next.district = newParsedAddress.district;
      if (!prev.ward || prev.ward === oldParsedAddress.ward) next.ward = newParsedAddress.ward;
      if (!prev.detailAddress || prev.detailAddress === oldParsedAddress.detailAddress) {
        next.detailAddress = newParsedAddress.detailAddress;
      }

      previousProfileRef.current = currentProfile;
      return next;
    });

    if (!checkoutData) {
      previousProfileRef.current = currentProfile;
    }
  }, [user?.name, user?.phoneNumber, user?.email, user?.address]);

  useEffect(() => {
    if (!isMomoPaymentModalOpen || !createdOrder?.id) return undefined;
    let active = true;

    const interval = setInterval(async () => {
      if (!active) return;
      setIsCheckingPayment(true);
      try {
        if (momoPayment) {
          await syncPayOSPaymentStatus(momoPayment);
        }
        const latestOrder = await getOrderById(createdOrder.id);
        if (!active) return;
        if (latestOrder.status === "CANCELLED") {
          setCreatedOrder(latestOrder);
          setIsMomoPaymentModalOpen(false);
          toast.error("Đơn đã bị hủy do quá hạn thanh toán");
          return;
        }
        if (latestOrder.payment_status === "PAID") {
          if (pendingCheckoutItemIds.length > 0) {
            await Promise.all(pendingCheckoutItemIds.map((itemId) => deleteCartItem(itemId)));
            const latestItems = getCartItems();
            setCartItems(latestItems);
            setSelectedItems(latestItems.map((item) => item.id));
            setPendingCheckoutItemIds([]);
          }
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
  }, [isMomoPaymentModalOpen, createdOrder?.id, momoPayment, pendingCheckoutItemIds]);

  const selectedCartItems = useMemo(
    () => cartItems.filter((item) => selectedItems.includes(item.id)),
    [cartItems, selectedItems]
  );

  useEffect(() => {
    let mounted = true;

    async function refreshQuote() {
      if (!isLoggedIn || isAdmin || selectedCartItems.length === 0) {
        if (!mounted) return;
        setQuotedItems([]);
        setShippingFee(0);
        setDiscount(0);
        setAppliedVoucher("");
        setAppliedCouponId(null);
        return;
      }

      try {
        const quote = await quoteOrder({
          checkoutData: buildCheckoutSnapshot(checkoutData, user, promoCode),
          cartItems: selectedCartItems,
          couponCode: checkoutData?.voucherCode || promoCode,
        });

        if (!mounted) return;
        setShippingFee(quote.shippingFee);
        setDiscount(quote.discountAmount);
        setAppliedVoucher(quote.couponCode || "");
        setAppliedCouponId(quote.couponId ?? null);
        setQuotedItems(
          selectedCartItems.map((item) => {
            const matched = quote.items.find((quoted) => String(quoted.productId) === String(item.id));
            return matched ? { ...item, price: matched.unitPrice, quantity: matched.quantity } : item;
          })
        );
      } catch (error) {
        if (!mounted) return;
        setQuotedItems([]);
        setShippingFee(0);
        setDiscount(0);
        setAppliedVoucher("");
        setAppliedCouponId(null);
        if (checkoutData?.voucherCode || promoCode) {
          toast.error("Không thể áp mã giảm giá", { description: error.message });
        }
      }
    }

    void refreshQuote();
    return () => {
      mounted = false;
    };
  }, [
    isLoggedIn,
    isAdmin,
    selectedCartItems,
    checkoutData?.fullName,
    checkoutData?.phoneNumber,
    checkoutData?.email,
    checkoutData?.address,
    checkoutData?.province,
    checkoutData?.district,
    checkoutData?.ward,
    checkoutData?.detailAddress,
    checkoutData?.voucherCode,
    checkoutData?.paymentMethod,
    promoCode,
    user?.name,
    user?.phoneNumber,
    user?.email,
    user?.address,
  ]);

  const displayCartItems = quotedItems.length ? quotedItems : selectedCartItems;
  const subtotal = displayCartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const total = subtotal + shippingFee - discount;

  const handleSelectAll = (checked) => {
    setSelectedItems(checked ? cartItems.map((item) => item.id) : []);
  };

  const handleSelectItem = (id, checked) => {
    if (checked) setSelectedItems([...selectedItems, id]);
    else setSelectedItems(selectedItems.filter((itemId) => itemId !== id));
  };

  const updateQuantity = async (id, newQuantity) => {
    if (newQuantity < 1) return;
    if (newQuantity > 10) {
      toast.warning("Chỉ được mua tối đa 10 sản phẩm mỗi loại");
      return;
    }
    try {
      await updateCartItemQuantity(id, newQuantity);
      setCartItems(getCartItems());
    } catch (error) {
      setCartItems(getCartItems());
      toast.error("Không thể cập nhật số lượng", { description: error.message });
    }
  };

  const removeItem = async (id) => {
    try {
      await deleteCartItem(id);
      const latestItems = getCartItems();
      setCartItems(latestItems);
      setSelectedItems((prev) => prev.filter((itemId) => itemId !== id));
      toast.success("Đã xóa khỏi giỏ hàng");
    } catch (error) {
      setCartItems(getCartItems());
      toast.error("Không thể xóa sản phẩm", { description: error.message });
    }
  };

  const handleApplyPromo = (event) => {
    event.preventDefault();
    const normalizedCode = String(promoCode || "").trim().toUpperCase();
    setPromoCode(normalizedCode);
    toast.success(normalizedCode ? "Đang kiểm tra mã giảm giá" : "Đã bỏ mã giảm giá");
  };

  const handleCheckout = () => {
    if (!isLoggedIn) {
      toast.error("Vui lòng đăng nhập để mua hàng");
      navigate("/login");
      return;
    }
    if (isAdmin) {
      toast.error("Bạn không thể mua hàng bằng tài khoản admin");
      return;
    }
    if (selectedItems.length === 0) {
      toast.error("Vui lòng chọn ít nhất một sản phẩm để thanh toán");
      return;
    }
    setIsCheckoutModalOpen(true);
  };

  const handleCheckoutSubmit = async (data) => {
    const voucherCode = String(data.voucherCode || "").trim().toUpperCase();
    const nextCheckoutData = {
      ...data,
      voucherCode,
    };

    try {
      const quote = await quoteOrder({
        checkoutData: nextCheckoutData,
        cartItems: selectedCartItems,
        couponCode: voucherCode,
      });

      setCheckoutData(nextCheckoutData);
      setPromoCode(voucherCode);
      setShippingFee(quote.shippingFee);
      setDiscount(quote.discountAmount);
      setAppliedVoucher(quote.couponCode || "");
      setAppliedCouponId(quote.couponId ?? null);
      setQuotedItems(
        selectedCartItems.map((item) => {
          const matched = quote.items.find((quoted) => String(quoted.productId) === String(item.id));
          return matched ? { ...item, price: matched.unitPrice, quantity: matched.quantity } : item;
        })
      );
      setIsCheckoutModalOpen(false);
      setIsOrderConfirmationModalOpen(true);
    } catch (error) {
      toast.error("Không thể tiếp tục đơn hàng", { description: error.message });
      throw error;
    }
  };

  const handleEditOrder = () => {
    setIsOrderConfirmationModalOpen(false);
    setIsCheckoutModalOpen(true);
  };

  const handleOrderConfirm = async () => {
    if (isSubmittingOrder) return;
    setIsSubmittingOrder(true);
    try {
      const checkoutItemIds = [...selectedItems];
      const order = await createOrder({
        checkoutData,
        cartItems: selectedCartItems,
        couponCode: checkoutData?.voucherCode || promoCode,
      });
      setCreatedOrder(order);
      setPendingCheckoutItemIds(checkoutItemIds);
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
        return;
      }

      if (checkoutItemIds.length > 0) {
        await Promise.all(checkoutItemIds.map((itemId) => deleteCartItem(itemId)));
      }
      const latestItems = getCartItems();
      setCartItems(latestItems);
      setSelectedItems(latestItems.map((item) => item.id));
      setPendingCheckoutItemIds([]);
      setIsOrderSuccessModalOpen(true);
    } catch (error) {
      toast.error("Không thể tạo đơn hàng", { description: error.message });
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const checkoutInitialData = {
    fullName: user?.name || "",
    phoneNumber: user?.phoneNumber || "",
    email: user?.email || "",
    address: checkoutData?.address || user?.address || "",
    province: checkoutData?.province || "",
    district: checkoutData?.district || "",
    ward: checkoutData?.ward || "",
    detailAddress: checkoutData?.detailAddress || "",
    voucherCode: checkoutData?.voucherCode || promoCode,
    paymentMethod: checkoutData?.paymentMethod || "COD",
  };

  const successTotalAmount = Number(createdOrder?.totalAmount ?? createdOrder?.total_amount ?? total);
  const successPaymentMethod =
    createdOrder?.paymentMethod ?? createdOrder?.payment_method ?? checkoutData?.paymentMethod;
  const successCustomerEmail = createdOrder?.guestEmail ?? createdOrder?.guest_email ?? checkoutData?.email;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="user-container py-8">
        <nav className="mb-4 flex items-center gap-1.5 text-xs text-gray-500">
          <Link to="/" className="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-purple-600">
            <Home className="h-3.5 w-3.5" />
            Trang chủ
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
          <span className="font-semibold text-gray-900">Giỏ hàng</span>
        </nav>

        <div className="mb-8 flex items-center gap-4">
          <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
            Giỏ hàng của bạn
            <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700">
              {cartItems.length} sản phẩm
            </span>
          </h1>
        </div>

        {cartItems.length === 0 ? (
          <div className="rounded-3xl border border-gray-100 bg-white p-16 text-center shadow-sm">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-purple-50">
              <ShoppingBag className="h-12 w-12 text-purple-300" />
            </div>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">Giỏ hàng đang trống</h2>
            <p className="mx-auto mb-8 max-w-md text-gray-500">
              Có vẻ như bạn chưa thêm sản phẩm nào vào giỏ hàng. Hãy khám phá thế giới mô hình của chúng tôi ngay.
            </p>
            <Button onClick={() => navigate("/")} className="h-12 rounded-full bg-purple-600 px-8 text-white hover:bg-purple-700">
              Tiếp tục mua sắm
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-8 lg:flex-row">
            <div className="w-full space-y-4 lg:w-2/3">
              <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                <Checkbox
                  checked={selectedItems.length === cartItems.length && cartItems.length > 0}
                  onCheckedChange={handleSelectAll}
                  id="select-all"
                  className="h-5 w-5"
                />
                <label htmlFor="select-all" className="cursor-pointer select-none font-semibold text-gray-700">
                  Chọn tất cả ({cartItems.length} sản phẩm)
                </label>
              </div>

              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md sm:p-5"
                  >
                    <div className="pt-2">
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onCheckedChange={(checked) => handleSelectItem(item.id, checked)}
                        className="h-5 w-5 flex-shrink-0"
                      />
                    </div>
                    <div
                      className="h-24 w-24 flex-shrink-0 cursor-pointer overflow-hidden rounded-xl border border-gray-100 bg-white sm:h-28 sm:w-28"
                      onClick={() => navigate(`/product/${item.id}`)}
                    >
                      <img src={item.image} alt={item.name} className="h-full w-full object-contain transition-transform hover:scale-105" />
                    </div>
                    <div className="flex flex-1 flex-col justify-between py-1">
                      <div>
                        <Link to={`/product/${item.id}`} className="line-clamp-2 pr-6 text-base font-semibold text-gray-900 hover:text-purple-600 sm:text-lg">
                          {item.name}
                        </Link>
                        <p className="mt-1 text-sm text-gray-500">
                          {item.brand} / {item.category}
                        </p>
                        <p className="text-sm text-gray-500">{item.scale}</p>
                      </div>
                      <div className="mt-4 inline-flex w-fit items-center rounded-lg border border-gray-200 bg-white">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="flex h-8 w-8 items-center justify-center rounded-l-lg text-gray-500 hover:bg-gray-50 hover:text-gray-800 sm:h-9 sm:w-9">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <input type="text" readOnly value={item.quantity} className="h-8 w-10 border-x border-gray-200 text-center text-sm font-semibold text-gray-900 outline-none sm:h-9 sm:w-12" />
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="flex h-8 w-8 items-center justify-center rounded-r-lg text-gray-500 hover:bg-gray-50 hover:text-gray-800 sm:h-9 sm:w-9">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="min-w-[100px] py-1 sm:min-w-[120px]">
                      <div className="flex h-full flex-col items-end justify-between">
                        <button onClick={() => removeItem(item.id)} className="rounded-md p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500">
                          <Trash2 className="h-5 w-5" />
                        </button>
                        <div className="mt-auto text-right">
                          <div className="mb-0.5 text-[13px] text-gray-500">Thành tiền</div>
                          <div className="text-lg font-bold tracking-tight text-blue-600 sm:text-xl">
                            {formatPrice(item.price * item.quantity)} đ
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full lg:w-1/3">
              <div className="sticky top-28 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="mb-6 text-xl font-bold text-gray-900">Tóm tắt đơn hàng</h2>

                <form onSubmit={handleApplyPromo} className="mb-6 flex gap-2 border-b border-gray-100 pb-6">
                  <div className="relative flex-1">
                    <Ticket className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Mã giảm giá (HBC50K...)"
                      className="h-11 pl-10 uppercase"
                    />
                  </div>
                  <Button type="submit" variant="outline" className="h-11 border-2 px-6 font-semibold">
                    Áp dụng
                  </Button>
                </form>

                <div className="mb-6 space-y-4 text-gray-600">
                  <div className="flex justify-between">
                    <span>Tạm tính ({selectedItems.length} mục)</span>
                    <span className="font-medium text-gray-900">{formatPrice(subtotal)} đ</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phí giao hàng</span>
                    {shippingFee === 0 ? (
                      <span className="font-bold text-green-600">Miễn phí</span>
                    ) : (
                      <span className="font-medium text-gray-900">{formatPrice(shippingFee)} đ</span>
                    )}
                  </div>
                  {discount > 0 ? (
                    <div className="flex justify-between text-green-600">
                      <span>Giảm giá voucher</span>
                      <span className="font-bold">-{formatPrice(discount)} đ</span>
                    </div>
                  ) : null}
                </div>

                <div className="mb-8 border-t border-gray-100 pt-6">
                  <div className="flex items-end justify-between">
                    <span className="font-bold text-gray-900">Tổng cộng</span>
                    <div className="text-right">
                      <span className="block text-3xl font-bold text-purple-600">{formatPrice(total)} đ</span>
                      <span className="text-xs text-gray-500">(Đã bao gồm VAT nếu có)</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleCheckout}
                  disabled={selectedItems.length === 0 || isAdmin}
                  className="h-14 w-full rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-lg text-white shadow-lg shadow-purple-500/30 hover:from-purple-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {selectedItems.length === 0 ? "Vui lòng chọn sản phẩm" : "Tiến hành thanh toán"}
                </Button>

                <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
                  <ShieldCheck className="h-5 w-5 text-green-500" />
                  <span>Thanh toán an toàn và bảo mật</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <GuestCheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        onSubmit={handleCheckoutSubmit}
        initialData={checkoutInitialData}
        subtotal={subtotal}
      />

      {checkoutData ? (
        <OrderConfirmationModal
          isOpen={isOrderConfirmationModalOpen}
          onClose={() => setIsOrderConfirmationModalOpen(false)}
          onConfirm={handleOrderConfirm}
          onEdit={handleEditOrder}
          checkoutData={checkoutData}
          cartItems={displayCartItems}
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
