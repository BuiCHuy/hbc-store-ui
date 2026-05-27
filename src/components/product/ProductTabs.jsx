import React, { useEffect, useMemo, useState } from "react";
import { Star, Package, MessageSquare } from "lucide-react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { LoginPromptModal } from "../LoginPromptModal";
import {
  createProductReview,
  getMyProductReview,
  getProductReviews,
  replyProductReview,
} from "../../hooks/useCatalog";

const tabs = [
  { id: "specifications", label: "Thông số kỹ thuật", icon: Package },
  { id: "reviews", label: "Đánh giá khách hàng", icon: MessageSquare },
];

function formatReviewDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("vi-VN");
}

export function ProductTabs({ product }) {
  const { isLoggedIn, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("specifications");
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [replyingReviewId, setReplyingReviewId] = useState(null);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [adminReplyDraft, setAdminReplyDraft] = useState({});
  const [reviewForm, setReviewForm] = useState({
    rating: "5",
    content: "",
  });

  const loadReviews = async () => {
    if (!product?.id) return;
    const data = await getProductReviews(product.id);
    setReviews(data);
  };

  const loadMyReview = async () => {
    if (!product?.id || !isLoggedIn) {
      setMyReview(null);
      return;
    }
    const data = await getMyProductReview(product.id);
    setMyReview(data);
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!product?.id) return;
      setIsLoadingReviews(true);
      try {
        const [approvedReviews, mine] = await Promise.all([
          getProductReviews(product.id),
          isLoggedIn ? getMyProductReview(product.id) : Promise.resolve(null),
        ]);
        if (!mounted) return;
        setReviews(approvedReviews);
        setMyReview(mine);
      } catch {
        if (!mounted) return;
        setReviews([]);
        setMyReview(null);
      } finally {
        if (mounted) setIsLoadingReviews(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [product?.id, isLoggedIn]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, item) => acc + Number(item.rating || 0), 0);
    return Number((sum / reviews.length).toFixed(1));
  }, [reviews]);

  const openEditReview = () => {
    if (!myReview) return;
    setReviewForm({
      rating: String(myReview.rating || 5),
      content: myReview.comment || "",
    });
    setIsEditingReview(true);
  };

  const handleSubmitReview = async () => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }

    if (myReview && !isEditingReview) {
      toast.info("Bạn đã viết đánh giá cho sản phẩm này rồi. Nếu chưa hiển thị vui lòng chờ admin duyệt");
      return;
    }

    const content = reviewForm.content.trim();
    if (!content) {
      toast.error("Vui lòng nhập nội dung đánh giá");
      return;
    }

    setIsSubmittingReview(true);
    try {
      await createProductReview(product.id, {
        rating: Number(reviewForm.rating),
        content,
      });
      toast.success(isEditingReview ? "Đã gửi cập nhật đánh giá" : "Đã gửi đánh giá", {
        description: "Đánh giá của bạn đang chờ admin duyệt.",
      });
      setReviewForm({ rating: "5", content: "" });
      setIsEditingReview(false);
      await Promise.all([loadReviews(), loadMyReview()]);
    } catch (error) {
      toast.error("Không thể gửi đánh giá", {
        description: error.message,
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleAdminReply = async (reviewId) => {
    const reply = (adminReplyDraft[reviewId] || "").trim();
    if (!reply) {
      toast.error("Vui lòng nhập phản hồi");
      return;
    }
    setReplyingReviewId(reviewId);
    try {
      await replyProductReview(reviewId, reply);
      toast.success("Đã gửi phản hồi");
      await loadReviews();
    } catch (error) {
      toast.error("Không thể gửi phản hồi", {
        description: error.message,
      });
    } finally {
      setReplyingReviewId(null);
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="overflow-x-auto border-b border-gray-200">
        <div className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-3 text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-b-2 border-purple-600 bg-purple-50/50 text-purple-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-5">
        {activeTab === "specifications" && (
          <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              ["Thương hiệu", product?.brand || "Chưa có"],
              ["Xuất xứ", product?.brandCountry || "Chưa có"],
              ["Danh mục", product?.category || "Chưa có"],
              ["Tồn kho", `${product?.stockQuantity ?? 0} sản phẩm`],
              ["Trạng thái", product?.status || "Chưa có"],
              ...(product?.attributes || [])
                .filter((attr) => attr?.name && attr?.value)
                .map((attr) => [attr.name, attr.value]),
            ].map(([label, value]) => (
              <div key={`${label}-${value}`}>
                <dt className="mb-1 text-xs font-semibold text-gray-600">{label}</dt>
                <dd className="text-sm font-medium text-gray-900">{value}</dd>
              </div>
            ))}
          </dl>
        )}

        {activeTab === "reviews" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Đánh giá khách hàng</h3>
              <div className="text-sm font-semibold text-gray-700">
                {reviews.length > 0 ? `${averageRating}/5 (${reviews.length})` : "Chưa có đánh giá"}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <p className="mb-2 text-sm font-semibold text-gray-900">Viết đánh giá</p>
              {myReview && !isEditingReview && (
                <div className="mb-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                  Bạn đã viết đánh giá cho sản phẩm này rồi. Nếu chưa hiển thị vui lòng chờ admin duyệt
                </div>
              )}
              <div className="mb-3">
                <label className="mb-1 block text-xs text-gray-600">Số sao</label>
                <select
                  value={reviewForm.rating}
                  onChange={(e) => setReviewForm((prev) => ({ ...prev, rating: e.target.value }))}
                  className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                  disabled={Boolean(myReview) && !isEditingReview}
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
                  value={reviewForm.content}
                  onChange={(e) => setReviewForm((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="Chia sẻ trải nghiệm thực tế về sản phẩm..."
                  className="min-h-[90px] text-sm"
                  disabled={Boolean(myReview) && !isEditingReview}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSubmitReview} disabled={isSubmittingReview} className="h-9 text-xs">
                  {isSubmittingReview ? "Đang gửi..." : isEditingReview ? "Gửi cập nhật" : "Gửi đánh giá"}
                </Button>
                {myReview && !isEditingReview && (
                  <Button variant="outline" onClick={openEditReview} className="h-9 text-xs">
                    Sửa đánh giá của bạn
                  </Button>
                )}
                {isEditingReview && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditingReview(false);
                      setReviewForm({ rating: "5", content: "" });
                    }}
                    className="h-9 text-xs"
                  >
                    Hủy
                  </Button>
                )}
              </div>
            </div>

            {isLoadingReviews ? (
              <p className="text-sm text-gray-500">Đang tải đánh giá...</p>
            ) : reviews.length === 0 ? (
              <p className="text-sm text-gray-500">Chưa có đánh giá đã duyệt cho sản phẩm này.</p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-100 pb-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{review.author}</p>
                      <p className="text-xs text-gray-500">{formatReviewDate(review.createdAt)}</p>
                    </div>
                    <div className="flex">
                      {[...Array(5)].map((_, index) => (
                        <Star
                          key={index}
                          className={`h-3.5 w-3.5 ${
                            index < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{review.comment}</p>
                  {review.adminReply && (
                    <div className="mt-2 rounded-md border border-blue-200 bg-blue-50 p-2">
                      <p className="text-xs font-semibold text-blue-800">Phản hồi từ cửa hàng</p>
                      <p className="text-sm text-blue-900">{review.adminReply}</p>
                    </div>
                  )}
                  {isAdmin && (
                    <div className="mt-2 space-y-2 rounded-md border border-gray-200 bg-gray-50 p-2">
                      <p className="text-xs font-semibold text-gray-700">Phản hồi với vai trò admin</p>
                      <Textarea
                        value={adminReplyDraft[review.id] ?? review.adminReply ?? ""}
                        onChange={(e) =>
                          setAdminReplyDraft((prev) => ({ ...prev, [review.id]: e.target.value }))
                        }
                        placeholder="Nhập phản hồi cho đánh giá này..."
                        className="min-h-[76px] bg-white text-sm"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={replyingReviewId === review.id}
                        onClick={() => handleAdminReply(review.id)}
                      >
                        {replyingReviewId === review.id ? "Đang gửi..." : "Gửi phản hồi"}
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <LoginPromptModal isOpen={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} />
    </div>
  );
}
