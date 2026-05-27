import React, { useState } from "react";
import { ShoppingCart, Star } from "lucide-react";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import { AddToCartModal } from "./AddToCartModal";
import { SuccessToast } from "./SuccessToast";
import { LoginPromptModal } from "./LoginPromptModal";
import { useAuth } from "../contexts/AuthContext";
import { addCartItem } from "../services/cartStorage";
import { toast } from "sonner";

export function ProductCard({
  id = 1,
  image,
  name,
  brand,
  price,
  originalPrice,
  rating = 4.8,
  reviews = 124,
  badge,
}) {
  const { isLoggedIn, isAdmin } = useAuth();
  const [showAddToCartModal, setShowAddToCartModal] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const formatPrice = (value) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);

  const discountPercent = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const getBadgeStyle = (currentBadge) => {
    if (!currentBadge) return null;
    const styles = {
      Hot: "bg-red-500 text-white",
      New: "bg-green-500 text-white",
      Limited: "bg-purple-500 text-white",
      "Best Seller": "bg-blue-500 text-white",
    };
    return styles[currentBadge] || "bg-gray-500 text-white";
  };

  const getBadgeLabel = (currentBadge) => {
    const labels = {
      Hot: "Nổi bật",
      New: "Mới",
      Limited: "Giới hạn",
      "Best Seller": "Bán chạy",
    };
    return labels[currentBadge] || currentBadge;
  };

  return (
    <div className="group relative bg-white rounded-md border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200">
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
        {discountPercent > 0 && (
          <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
            -{discountPercent}%
          </div>
        )}
        {badge && (
          <div className={`${getBadgeStyle(badge)} text-[10px] font-bold px-2 py-0.5 rounded`}>
            {getBadgeLabel(badge)}
          </div>
        )}
      </div>

      <Link to={`/product/${id}`}>
        <div className="aspect-square bg-gray-50 overflow-hidden">
          {image ? (
            <img src={image} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-medium text-gray-400">
              Chưa có ảnh
            </div>
          )}
        </div>

        <div className="p-2.5">
          <div className="inline-block bg-purple-50 text-purple-700 text-[10px] font-semibold px-2 py-0.5 rounded mb-1.5">
            {brand}
          </div>

          <h3 className="font-medium text-sm text-gray-900 mb-1.5 line-clamp-2 min-h-[2.25rem]">{name}</h3>

          <div className="flex items-center gap-1 mb-1.5">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-medium text-gray-900">{rating}</span>
            <span className="text-xs text-gray-500">({reviews})</span>
          </div>

          <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 mb-2">
            <span className="text-xs font-bold text-gray-900">{formatPrice(price)}</span>
            {originalPrice && (
              <span className="text-[10px] text-gray-400 line-through">{formatPrice(originalPrice)}</span>
            )}
          </div>
        </div>
      </Link>

      <div className="px-2.5 pb-2.5">
        <Button
          onClick={(e) => {
            e.preventDefault();
            if (!isLoggedIn) {
              setShowLoginPrompt(true);
              return;
            }
            if (isAdmin) {
              toast.error("Bạn không thể mua hàng bằng tài khoản admin");
              return;
            }
            setShowAddToCartModal(true);
          }}
          className="w-full h-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-xs font-medium"
        >
          <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
          Thêm vào giỏ
        </Button>
      </div>

      {showAddToCartModal && (
        <AddToCartModal
          isOpen={showAddToCartModal}
          onClose={() => setShowAddToCartModal(false)}
          product={{ image, name, brand, price, originalPrice }}
          onConfirm={(quantity) => {
            if (isAdmin) {
              toast.error("Bạn không thể mua hàng bằng tài khoản admin");
              setShowAddToCartModal(false);
              return;
            }
            addCartItem({ id, image, name, brand, price }, quantity);
            setShowAddToCartModal(false);
            setShowSuccessToast(true);
          }}
        />
      )}

      {showSuccessToast && (
        <SuccessToast isOpen={showSuccessToast} onClose={() => setShowSuccessToast(false)} />
      )}

      <LoginPromptModal
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
      />
    </div>
  );
}
