import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, Minus, Plus, ShoppingCart } from "lucide-react";
import { Button } from "./ui/button";

export function AddToCartModal({
  isOpen,
  onClose,
  onConfirm,
  product,
}) {
  const [quantity, setQuantity] = useState(1);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleIncrease = () => {
    setQuantity(quantity + 1);
  };

  const handleConfirm = () => {
    onConfirm(quantity);
    setQuantity(1);
  };

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const subtotal = product.price * quantity;

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 transition-opacity duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Chọn số lượng
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex gap-4 mb-6">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {discountPercent > 0 && (
                  <div className="absolute top-1.5 left-1.5 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    -{discountPercent}%
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="inline-block bg-purple-50 text-purple-700 text-xs font-semibold px-2.5 py-1 rounded-full mb-2">
                {product.brand}
              </div>
              
              <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
                {product.name}
              </h3>
              
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-gray-900">
                  {formatPrice(product.price)} đ
                </span>
                {product.originalPrice && (
                  <span className="text-sm text-gray-400 line-through">
                    {formatPrice(product.originalPrice)} đ
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Số lượng:
            </label>
            <div className="flex items-center justify-center">
              <div className="inline-flex items-center bg-white border-2 border-gray-300 rounded-xl overflow-hidden">
                <button
                  onClick={handleDecrease}
                  disabled={quantity <= 1}
                  className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:bg-gray-100"
                >
                  <Minus className="w-5 h-5 text-gray-600" />
                </button>
                
                <div className="w-20 h-12 flex items-center justify-center border-x-2 border-gray-300">
                  <span className="text-xl font-bold text-gray-900">
                    {quantity}
                  </span>
                </div>
                
                <button
                  onClick={handleIncrease}
                  className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 transition-colors active:bg-gray-100"
                >
                  <Plus className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 mb-6 border border-purple-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Tổng tạm tính:
              </span>
              <div className="text-right">
                <div className="text-2xl font-bold text-transparent bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text">
                  {formatPrice(subtotal)} đ
                </div>
                <div className="text-xs text-gray-500">
                  ({quantity} sản phẩm)
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={onClose}
              className="flex-1 h-12 border-2 border-gray-300 hover:bg-gray-50 font-semibold"
            >
              Hủy
            </Button>
            <Button
              size="lg"
              onClick={handleConfirm}
              className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold shadow-lg shadow-purple-500/30"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Thêm vào giỏ
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}