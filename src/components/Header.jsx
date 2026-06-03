import React, { useEffect, useRef, useState } from "react";
import {
  ShoppingCart,
  User,
  Sparkles,
  LogOut,
  Settings,
  Package,
  UserCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { LoginPromptModal } from "./LoginPromptModal";
import { useAuth } from "../contexts/AuthContext";
import logoImage from "../image/Container.png";
import { CART_CHANGED_EVENT, getCartItemCount } from "../services/cartStorage";
import { searchProducts } from "../hooks/useCatalog";

export function Header() {
  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchBoxRef = useRef(null);

  useEffect(() => {
    const syncCartCount = () => {
      setCartItemCount(isLoggedIn ? getCartItemCount() : 0);
    };

    syncCartCount();
    window.addEventListener(CART_CHANGED_EVENT, syncCartCount);
    window.addEventListener("storage", syncCartCount);

    return () => {
      window.removeEventListener(CART_CHANGED_EVENT, syncCartCount);
      window.removeEventListener("storage", syncCartCount);
    };
  }, [isLoggedIn]);

  useEffect(() => {
    const keyword = searchTerm.trim();
    if (!keyword) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const products = await searchProducts(keyword, 6);
        if (!active) return;
        setSuggestions(products);
      } catch {
        if (!active) return;
        setSuggestions([]);
      } finally {
        if (active) setIsSearching(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!searchBoxRef.current) return;
      if (!searchBoxRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCartClick = (e) => {
    if (!isLoggedIn) {
      e.preventDefault();
      setShowLoginPrompt(true);
      return;
    }
    if (user?.role === "admin") {
      e.preventDefault();
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchTerm.trim();
    if (!query) {
      navigate("/search");
      return;
    }
    setShowSuggestions(false);
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleSelectSuggestion = (productId) => {
    setShowSuggestions(false);
    navigate(`/product/${productId}`);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="user-container py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-6 lg:gap-10">
            <Link to="/" className="flex flex-shrink-0 items-center gap-2 transition-opacity hover:opacity-80">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-white shadow-md">
                <img src={logoImage} alt="HBC Store" className="h-full w-full object-contain" />
              </div>
              <div className="hidden text-left lg:block">
                <div className="text-lg font-bold leading-tight text-gray-900">HBC Store</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Mô Hình Cao Cấp</div>
              </div>
            </Link>

            <div className="hidden w-full max-w-xl md:block" ref={searchBoxRef}>
              <form className="group relative" onSubmit={handleSearchSubmit}>
                <Sparkles className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-purple-500 transition-colors group-focus-within:text-purple-600" />
                <Input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Tìm sản phẩm theo tên, hãng, danh mục..."
                  className="h-12 w-full rounded-full border-gray-200 bg-gray-50/80 pl-12 pr-24 shadow-sm transition-all focus:bg-white"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm"
                >
                  Tìm
                </button>
              </form>

              {showSuggestions && searchTerm.trim() ? (
                <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                  {isSearching ? (
                    <div className="px-4 py-3 text-sm text-gray-500">Đang tìm...</div>
                  ) : suggestions.length > 0 ? (
                    <ul className="max-h-96 overflow-y-auto">
                      {suggestions.map((item) => (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => handleSelectSuggestion(item.id)}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
                          >
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-10 w-10 rounded-md border border-gray-200 object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-gray-900">{item.name}</p>
                              <p className="truncate text-xs text-gray-500">
                                {item.brand} • {item.category}
                              </p>
                            </div>
                            <p className="text-xs font-bold text-purple-600">
                              {Number(item.price || 0).toLocaleString("vi-VN")} đ
                            </p>
                          </button>
                        </li>
                      ))}
                      <li className="border-t border-gray-100">
                        <button
                          type="button"
                          onClick={(e) => handleSearchSubmit(e)}
                          className="w-full px-4 py-2 text-left text-xs font-semibold text-purple-600 hover:bg-purple-50"
                        >
                          Xem tất cả kết quả cho "{searchTerm.trim()}"
                        </button>
                      </li>
                    </ul>
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500">Không có sản phẩm phù hợp.</div>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            {isLoggedIn ? (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-10 w-10 rounded-full hover:bg-gray-100"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  onBlur={() => setTimeout(() => setShowUserMenu(false), 200)}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-600 shadow-sm">
                    <User className="h-5 w-5 text-white" />
                  </div>
                </Button>

                {showUserMenu ? (
                  <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
                    <div className="border-b border-gray-100 bg-gradient-to-br from-purple-50 to-blue-50 px-4 py-4">
                      <p className="text-sm font-bold text-gray-900">{user?.name}</p>
                      <p className="mt-0.5 truncate text-xs text-gray-600">{user?.email}</p>
                      <span className="mt-2 inline-block rounded-full bg-purple-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-700">
                        {user?.role === "admin" ? "Quản trị viên" : "Khách hàng"}
                      </span>
                    </div>

                    <div className="py-2">
                      {user?.role !== "admin" ? (
                        <Link
                          to="/profile"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          <UserCircle className="h-4 w-4 text-gray-500" />
                          Quản lý hồ sơ
                        </Link>
                      ) : null}
                      {user?.role === "admin" ? (
                        <Link
                          to="/admin/dashboard"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          <Settings className="h-4 w-4 text-gray-500" />
                          Trang quản trị
                        </Link>
                      ) : null}
                      {user?.role !== "admin" ? (
                        <Link
                          to="/orders"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          <Package className="h-4 w-4 text-gray-500" />
                          Đơn hàng của tôi
                        </Link>
                      ) : null}
                      <div className="my-1 h-px bg-gray-100" />
                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link to="/login">
                <Button className="hidden h-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-5 font-medium text-white shadow-md shadow-purple-500/20 transition-all hover:from-purple-700 hover:to-blue-700 md:flex">
                  <User className="mr-2 h-4 w-4" />
                  Đăng nhập
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100 md:hidden">
                  <User className="h-5 w-5 text-gray-700" />
                </Button>
              </Link>
            )}

            <Link to="/cart" onClick={handleCartClick}>
              <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full hover:bg-gray-100">
                <ShoppingCart className="h-5 w-5 text-gray-700" />
                {cartItemCount > 0 && user?.role !== "admin" ? (
                  <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-bold text-white">
                    {cartItemCount > 99 ? "99+" : cartItemCount}
                  </span>
                ) : null}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <LoginPromptModal isOpen={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} />
    </header>
  );
}
