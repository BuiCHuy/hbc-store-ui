import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  Calendar,
  ChevronRight,
  CreditCard,
  Home,
  Mail,
  MapPin,
  Package,
  Phone,
  Star,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { getErrorMessageVi } from "../lib/api";
import { PaymentQrModal } from "../components/PaymentQrModal";
import {
  cancelMyOrder,
  createPayOSPayment,
  createRefundRequest,
  getMyRefundRequests,
  getOrderById,
  syncPayOSPaymentStatus,
} from "../services/adminApi";
import { createProductReview, getMyProductReview } from "../hooks/useCatalog";

const statusLabels = {
  PENDING: "Đang xử lý",
  CONFIRMED: "Đã xác nhận",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã hủy",
};

const statusBadgeStyles = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  CONFIRMED: "border-indigo-200 bg-indigo-50 text-indigo-700",
  SHIPPING: "border-blue-200 bg-blue-50 text-blue-700",
  DELIVERED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CANCELLED: "border-red-200 bg-red-50 text-red-700",
};

const paymentLabels = {
  COD: "Thanh toán khi nhận hàng",
  BANK_TRANSFER: "Chuyển khoản ngân hàng",
};

const paymentStatusLabels = {
  UNPAID: "Chưa thanh toán",
  PAID: "Đã thanh toán",
  FAILED: "Thanh toán lỗi",
  REFUNDED: "Đã hoàn tiền",
};

const paymentBadgeStyles = {
  UNPAID: "border-amber-200 bg-amber-50 text-amber-700",
  PAID: "border-emerald-200 bg-emerald-50 text-emerald-700",
  FAILED: "border-red-200 bg-red-50 text-red-700",
  REFUNDED: "border-slate-200 bg-slate-50 text-slate-700",
};

const refundStatusLabels = {
  PENDING: "Đang chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  COMPLETED: "Đã hoàn tiền",
};

export function OrderDetail() {
  const { isLoggedIn, isAuthReady } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refunds, setRefunds] = useState([]);
  const [refundReason, setRefundReason] = useState("");
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);
  const [isCancellingOrder, setIsCancellingOrder] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isMomoPaymentModalOpen, setIsMomoPaymentModalOpen] = useState(false);
  const [momoPayment, setMomoPayment] = useState(null);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [reviewEligibility, setReviewEligibility] = useState({});
  const [myReviews, setMyReviews] = useState({});
  const [reviewForms, setReviewForms] = useState({});
  const [submittingReviewId, setSubmittingReviewId] = useState(null);

  useEffect(() => {
    if (!isAuthReady) return;
    if (!isLoggedIn) navigate("/login");
  }, [isAuthReady, isLoggedIn, navigate]);

  useEffect(() => {
    if (!isAuthReady || !isLoggedIn || !id) return;
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      try {
        const orderData = await getOrderById(id);
        const refundsData = await getMyRefundRequests().catch(() => []);
        if (!isMounted) return;
        setOrder(orderData);
        setRefunds(refundsData.filter((item) => String(item.order_id) === String(id)));
      } catch (error) {
        toast.error("Không thể tải chi tiết đơn hàng", {
          description: getErrorMessageVi(error, "Không thể tải chi tiết đơn hàng."),
        });
        if (isMounted) setOrder(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [id, isAuthReady, isLoggedIn]);

  useEffect(() => {
    if (!isMomoPaymentModalOpen || !order?.id) return undefined;
    let active = true;

    const interval = setInterval(async () => {
      if (!active) return;
      setIsCheckingPayment(true);
      try {
        if (momoPayment) {
          await syncPayOSPaymentStatus(momoPayment);
        }
        const latestOrder = await getOrderById(order.id);
        if (!active) return;
        setOrder(latestOrder);
        if (latestOrder.status === "CANCELLED") {
          setIsMomoPaymentModalOpen(false);
          toast.error("Đơn đã bị hủy do quá hạn thanh toán");
        } else if (latestOrder.payment_status === "PAID") {
          setIsMomoPaymentModalOpen(false);
          toast.success("Đã xác nhận thanh toán thành công");
        }
      } catch {
        // ignore and retry
      } finally {
        if (active) setIsCheckingPayment(false);
      }
    }, 4000);

    return () => {
      active = false;
      clearInterval(interval);
      setIsCheckingPayment(false);
    };
  }, [isMomoPaymentModalOpen, order?.id, momoPayment]);

  useEffect(() => {
    if (!order?.items?.length || order.status !== "DELIVERED") {
      setReviewEligibility({});
      setMyReviews({});
      setReviewForms({});
      return;
    }

    let mounted = true;

    async function loadReviewState() {
      try {
        const entries = await Promise.all(
          order.items.map(async (item) => {
            const myReview = await getMyProductReview(item.product_id);
            return [item.product_id, { myReview }];
          })
        );

        if (!mounted) return;

        const nextEligibility = {};
        const nextMyReviews = {};
        const nextForms = {};

        entries.forEach(([productId, state]) => {
          nextEligibility[productId] = true;
          nextMyReviews[productId] = state.myReview || null;
          nextForms[productId] = {
            rating: String(state.myReview?.rating || 5),
            content: state.myReview?.comment || "",
          };
        });

        setReviewEligibility(nextEligibility);
        setMyReviews(nextMyReviews);
        setReviewForms(nextForms);
      } catch {
        if (!mounted) return;
        setReviewEligibility({});
        setMyReviews({});
        setReviewForms({});
      }
    }

    loadReviewState();
    return () => {
      mounted = false;
    };
  }, [order?.id, order?.status, order?.items]);

  const latestRefund = useMemo(() => {
    if (!refunds.length) return null;
    return [...refunds].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
  }, [refunds]);

  const canRequestRefund =
    order?.status === "DELIVERED" &&
    order?.payment_status === "PAID" &&
    (!latestRefund || latestRefund.status === "REJECTED");
  const canCancelOrder = order?.status === "PENDING";
  const paymentExpired =
    order?.payment_status === "UNPAID" &&
    order?.payment_expired_at &&
    new Date(order.payment_expired_at).getTime() < Date.now();
  const canRepayByMomo =
    order?.payment_method === "BANK_TRANSFER" &&
    order?.payment_status === "UNPAID" &&
    order?.status !== "CANCELLED";

  const handleReviewFieldChange = (productId, field, value) => {
    setReviewForms((prev) => ({
      ...prev,
      [productId]: {
        rating: prev[productId]?.rating || "5",
        content: prev[productId]?.content || "",
        [field]: value,
      },
    }));
  };

  const handleSubmitReview = async (productId) => {
    if (order?.status !== "DELIVERED") {
      toast.info("Chỉ có thể đánh giá sản phẩm từ đơn hàng đã giao thành công");
      return;
    }

    const form = reviewForms[productId] || { rating: "5", content: "" };
    const content = String(form.content || "").trim();
    if (!content) {
      toast.error("Vui lòng nhập nội dung đánh giá");
      return;
    }

    setSubmittingReviewId(productId);
    try {
      await createProductReview(productId, {
        rating: Number(form.rating || 5),
        content,
      });
      const latestReview = await getMyProductReview(productId);
      setMyReviews((prev) => ({ ...prev, [productId]: latestReview }));
      setReviewForms((prev) => ({
        ...prev,
        [productId]: {
          rating: String(latestReview?.rating || form.rating || 5),
          content: latestReview?.comment || content,
        },
      }));
      toast.success("Đã gửi đánh giá", {
        description: "Đánh giá của bạn đang chờ admin duyệt.",
      });
    } catch (error) {
      toast.error("Không thể gửi đánh giá", {
        description: getErrorMessageVi(error, "Không thể gửi đánh giá lúc này."),
      });
    } finally {
      setSubmittingReviewId(null);
    }
  };

  const handleSubmitRefund = async () => {
    const reason = refundReason.trim();
    if (!reason) {
      toast.error("Vui lòng nhập lý do hoàn tiền");
      return;
    }
    setIsSubmittingRefund(true);
    try {
      const created = await createRefundRequest({ orderId: Number(order.id), reason });
      setRefunds((prev) => [created, ...prev]);
      setRefundReason("");
      toast.success("Đã gửi yêu cầu hoàn tiền");
    } catch (error) {
      toast.error("Không thể gửi yêu cầu hoàn tiền", {
        description: getErrorMessageVi(error, "Không thể gửi yêu cầu hoàn tiền."),
      });
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order?.id || !canCancelOrder) return;
    setIsCancellingOrder(true);
    try {
      const updatedOrder = await cancelMyOrder(order.id);
      setOrder(updatedOrder);
      setIsCancelDialogOpen(false);
      toast.success("Đã hủy đơn hàng");
    } catch (error) {
      toast.error("Không thể hủy đơn hàng", {
        description: getErrorMessageVi(error, "Không thể hủy đơn hàng này."),
      });
    } finally {
      setIsCancellingOrder(false);
    }
  };

  const handleRepay = async () => {
    if (!order?.id || isCreatingPayment) return;
    const isCurrentPaymentExpired =
      order?.payment_expired_at && new Date(order.payment_expired_at).getTime() < Date.now();
    if (momoPayment?.payUrl && !isCurrentPaymentExpired) {
      setIsMomoPaymentModalOpen(true);
      return;
    }
    setIsCreatingPayment(true);
    try {
      const payment = await createPayOSPayment(order.id);
      setMomoPayment(payment);
      setIsMomoPaymentModalOpen(true);
      const latestOrder = await getOrderById(order.id);
      setOrder(latestOrder);
    } catch (error) {
      toast.error("Không thể tạo lại mã thanh toán", {
        description: getErrorMessageVi(error, "Không thể tạo lại mã thanh toán."),
      });
    } finally {
      setIsCreatingPayment(false);
    }
  };

  if (!isAuthReady || !isLoggedIn) return null;
  if (isLoading || !order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">Đang tải thông tin đơn hàng...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 pb-12">
      <main className="user-container py-8">
        <nav className="mb-4 flex min-w-0 items-center gap-1.5 text-xs text-gray-500">
          <Link to="/" className="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-purple-600">
            <Home className="h-3.5 w-3.5" />
            Trang chủ
          </Link>
          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
          <Link to="/orders" className="font-medium text-gray-600 hover:text-purple-600">
            Đơn hàng của tôi
          </Link>
          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
          <span className="truncate font-semibold text-gray-900">{order.code}</span>
        </nav>

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-blue-600">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{order.code}</h1>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  Đặt ngày {new Date(order.order_date).toLocaleDateString("vi-VN")}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span
                className={`rounded-lg border px-4 py-2 text-center text-sm font-medium ${
                  statusBadgeStyles[order.status] || "border-slate-200 bg-slate-50 text-slate-700"
                }`}
              >
                {statusLabels[order.status]}
              </span>
              <span
                className={`rounded-lg border px-4 py-2 text-center text-sm font-medium ${
                  paymentBadgeStyles[order.payment_status] || "border-slate-200 bg-slate-50 text-slate-700"
                }`}
              >
                {paymentStatusLabels[order.payment_status]}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-6 text-lg font-bold text-gray-900">Sản phẩm ({order.items.length} món)</h2>
              <div className="space-y-4">
                {order.items.map((product) => (
                  <div key={product.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                    <div className="flex items-center justify-between">
                      <Link
                        to={`/product/${product.product_id}`}
                        className="flex items-center gap-3 rounded-md transition hover:text-purple-600"
                      >
                        {product.product_image ? (
                          <img
                            src={product.product_image}
                            alt={product.product_name}
                            className="h-14 w-14 rounded-md border border-gray-200 object-cover"
                          />
                        ) : null}
                        <div>
                          <p className="font-semibold text-gray-900 transition-colors hover:text-purple-600">
                            {product.product_name}
                          </p>
                          <p className="text-sm text-gray-600">Số lượng: {product.quantity}</p>
                        </div>
                      </Link>
                      <p className="font-bold text-blue-600">{product.total_price.toLocaleString("vi-VN")} đ</p>
                    </div>

                    {order.status === "DELIVERED" && reviewEligibility[product.product_id] ? (
                      <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <p className="mb-2 text-sm font-semibold text-gray-900">
                          {myReviews[product.product_id] ? "Đánh giá của bạn" : "Đánh giá sản phẩm này"}
                        </p>

                        {myReviews[product.product_id] ? (
                          <div className="mb-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                            Bạn đã gửi đánh giá cho sản phẩm này. Nếu chưa hiển thị ở trang sản phẩm, vui lòng chờ admin duyệt.
                          </div>
                        ) : null}

                        <div className="mb-3">
                          <label className="mb-1 block text-xs text-gray-600">Số sao</label>
                          <select
                            value={reviewForms[product.product_id]?.rating || "5"}
                            onChange={(event) =>
                              handleReviewFieldChange(product.product_id, "rating", event.target.value)
                            }
                            className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                          >
                            <option value="5">5 sao</option>
                            <option value="4">4 sao</option>
                            <option value="3">3 sao</option>
                            <option value="2">2 sao</option>
                            <option value="1">1 sao</option>
                          </select>
                        </div>

                        <div className="mb-3">
                          <label className="mb-1 block text-xs text-gray-600">Nội dung</label>
                          <Textarea
                            value={reviewForms[product.product_id]?.content || ""}
                            onChange={(event) =>
                              handleReviewFieldChange(product.product_id, "content", event.target.value)
                            }
                            placeholder="Chia sẻ trải nghiệm thực tế về sản phẩm..."
                            className="min-h-[90px] bg-white text-sm"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleSubmitReview(product.product_id)}
                            disabled={submittingReviewId === product.product_id}
                            className="h-9 text-xs"
                          >
                            {submittingReviewId === product.product_id
                              ? "Đang gửi..."
                              : myReviews[product.product_id]
                                ? "Gửi cập nhật"
                                : "Gửi đánh giá"}
                          </Button>
                          {myReviews[product.product_id]?.rating ? (
                            <div className="inline-flex items-center gap-1 text-xs text-gray-500">
                              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                              <span>{myReviews[product.product_id].rating}/5</span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-bold text-gray-900">Thông tin khách hàng</h2>
              <div className="grid gap-4 text-sm sm:grid-cols-3">
                <Info icon={User} label="Họ tên" value={order.customer_name} />
                <Info icon={Phone} label="Số điện thoại" value={order.customer_phone} />
                <Info icon={Mail} label="Email" value={order.customer_email || "Không có"} />
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-bold text-gray-900">Yêu cầu hoàn tiền</h2>
              {latestRefund ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
                  <p className="font-semibold text-gray-900">
                    Trạng thái: {refundStatusLabels[latestRefund.status] || latestRefund.status}
                  </p>
                  <p className="mt-2 text-gray-700">Lý do: {latestRefund.reason}</p>
                  {latestRefund.admin_note ? (
                    <p className="mt-2 text-gray-700">Ghi chú admin: {latestRefund.admin_note}</p>
                  ) : null}
                </div>
              ) : null}

              {canRequestRefund ? (
                <div className="mt-4 space-y-3">
                  <Textarea
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Nhập lý do hoàn tiền của bạn..."
                    className="min-h-[110px]"
                  />
                  <Button onClick={handleSubmitRefund} disabled={isSubmittingRefund}>
                    {isSubmittingRefund ? "Đang gửi..." : "Gửi yêu cầu hoàn tiền"}
                  </Button>
                </div>
              ) : (
                <p className="mt-3 text-sm text-gray-600">
                  Chỉ đơn đã giao và đã thanh toán mới gửi được yêu cầu hoàn tiền.
                </p>
              )}
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-bold text-gray-900">Địa chỉ giao hàng</h2>
              <div className="flex gap-3 text-sm text-gray-700">
                <MapPin className="h-5 w-5 flex-shrink-0 text-purple-600" />
                <p>{order.shipping_address}</p>
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-bold text-gray-900">Phương thức thanh toán</h2>
              <div className="flex gap-3 text-sm text-gray-700">
                <CreditCard className="h-5 w-5 flex-shrink-0 text-purple-600" />
                <div className="space-y-2">
                  <p>{paymentLabels[order.payment_method]}</p>
                  {order.payment_method === "BANK_TRANSFER" && order.payment_status === "UNPAID" ? (
                    <p className={`text-xs ${paymentExpired ? "text-red-600" : "text-amber-600"}`}>
                      {paymentExpired
                        ? "Phiên thanh toán đã hết hạn, vui lòng thanh toán lại."
                        : "Đơn đang chờ thanh toán chuyển khoản."}
                    </p>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="space-y-3 text-sm">
                <Row label="Tạm tính" value={`${order.subtotal_amount.toLocaleString("vi-VN")} đ`} />
                <Row label="Phí vận chuyển" value={`${order.shipping_fee.toLocaleString("vi-VN")} đ`} />
                {order.discount_amount > 0 ? (
                  <Row label="Giảm giá" value={`-${order.discount_amount.toLocaleString("vi-VN")} đ`} />
                ) : null}
                <div className="flex justify-between border-t pt-3 text-lg font-bold">
                  <span>Tổng cộng</span>
                  <span className="text-purple-600">{order.total_amount.toLocaleString("vi-VN")} đ</span>
                </div>
              </div>
            </section>

            <Button variant="outline" className="w-full" onClick={() => navigate("/orders")}>
              Quay lại danh sách đơn hàng
            </Button>
            {canCancelOrder ? (
              <Button
                className="w-full bg-red-600 text-white hover:bg-red-700"
                disabled={isCancellingOrder}
                onClick={() => setIsCancelDialogOpen(true)}
              >
                {isCancellingOrder ? "Đang hủy..." : "Hủy đơn hàng"}
              </Button>
            ) : null}
            {canRepayByMomo ? (
              <Button
                className="w-full bg-purple-600 text-white hover:bg-purple-700"
                disabled={isCreatingPayment}
                onClick={handleRepay}
              >
                {isCreatingPayment ? "Đang tạo QR..." : "Thanh toán lại"}
              </Button>
            ) : null}
          </div>
        </div>
      </main>

      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Xác nhận hủy đơn
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Bạn có chắc muốn hủy đơn hàng <span className="font-semibold text-gray-900">{order.code}</span> không?
            Hành động này không thể hoàn tác.
          </p>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)} disabled={isCancellingOrder}>
              Giữ đơn
            </Button>
            <Button className="bg-red-600 text-white hover:bg-red-700" onClick={handleCancelOrder} disabled={isCancellingOrder}>
              {isCancellingOrder ? "Đang hủy..." : "Xác nhận hủy"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <PaymentQrModal
        isOpen={isMomoPaymentModalOpen}
        onClose={() => setIsMomoPaymentModalOpen(false)}
        orderCode={order?.code}
        amount={order?.total_amount || 0}
        qrCodeUrl={momoPayment?.qrCodeUrl || momoPayment?.qrCodeURL || ""}
        payUrl={momoPayment?.payUrl || ""}
        isCheckingPayment={isCheckingPayment}
        paymentStatus={order?.payment_status}
        paymentExpiredAt={order?.payment_expired_at}
      />
    </div>
  );
}

function Info({ icon, label, value }) {
  return (
    <div>
      {React.createElement(icon, { className: "mb-2 h-5 w-5 text-purple-600" })}
      <p className="text-gray-600">{label}</p>
      <p className="font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}
