import React, { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

export function SuccessToast({
  isOpen,
  onClose,
  message = "Thêm vào giỏ hàng thành công",
  duration = 3000,
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);

      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); 
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isOpen, onClose, duration]);

  if (!isOpen && !isVisible) return null;

  return (
    <div
      className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ${
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-4"
      }`}
    >
      <div className="bg-white rounded-xl shadow-2xl shadow-gray-900/20 border border-gray-100 px-6 py-4 flex items-center gap-3 min-w-[320px]">
        <div className="flex-shrink-0 w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-green-500" />
        </div>

        <p className="flex-1 font-medium text-gray-900">{message}</p>

        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>
    </div>
  );
}