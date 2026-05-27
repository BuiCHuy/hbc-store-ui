import React from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { ShoppingCart, X } from "lucide-react";
import { Button } from "./ui/button";

export function LoginPromptModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50">
              <ShoppingCart className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Đăng nhập để xem giỏ hàng
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Vui lòng đăng nhập hoặc tạo tài khoản để quản lý giỏ hàng và đặt
                hàng của bạn.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 grid gap-3">
          <Link to="/login" onClick={onClose}>
            <Button className="h-11 w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              Đăng nhập ngay
            </Button>
          </Link>
          <Link to="/register" onClick={onClose}>
            <Button variant="outline" className="h-11 w-full">
              Tạo tài khoản mới
            </Button>
          </Link>
        </div>
      </div>
    </div>,
    document.body
  );
}
