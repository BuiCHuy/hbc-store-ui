import { clearMyCart, getMyCart, removeCartItem, upsertCartItem } from "./cartApi";

const CART_CHANGED_EVENT = "hbc-cart-changed";
const STORAGE_KEY = "hbc-cart-by-user";

let currentUserKey = "guest";
let cartByUser = loadAllCarts();

function loadAllCarts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function persistAllCarts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cartByUser));
}

function normalizeItem(item) {
  return {
    id: item.productId ?? item.id,
    image: item.image || item.thumbnailUrl || "",
    name: item.name || item.title || "",
    brand: item.brand || "",
    category: item.category || "",
    scale: item.scale || "Tiêu chuẩn",
    price: Number(item.price || 0),
    quantity: Number(item.quantity || 1),
  };
}

function getUserCart() {
  return cartByUser[currentUserKey] || [];
}

function setUserCart(items) {
  cartByUser[currentUserKey] = items;
  persistAllCarts();
}

function emitChanged(items) {
  window.dispatchEvent(new CustomEvent(CART_CHANGED_EVENT, { detail: items }));
}

function isLoggedInUser() {
  return currentUserKey !== "guest";
}

function toServerItems(serverItems) {
  return (serverItems || []).map((item) =>
    normalizeItem({
      ...item,
      id: item.productId,
    })
  );
}

async function syncFromServer() {
  if (!isLoggedInUser()) return;
  try {
    const serverItems = await getMyCart();
    const normalized = toServerItems(serverItems);
    setUserCart(normalized);
    emitChanged(normalized);
  } catch {
    // keep local fallback
  }
}

export function setCartUserKey(userKey) {
  currentUserKey = userKey || "guest";
  if (!isLoggedInUser()) {
    setUserCart([]);
    emitChanged([]);
    return;
  }
  if (!cartByUser[currentUserKey]) {
    setUserCart([]);
  }
  emitChanged(getUserCart());
  void syncFromServer();
}

export function getCartItems() {
  if (!isLoggedInUser()) return [];
  return getUserCart();
}

export function saveCartItems(items) {
  if (!isLoggedInUser()) return;
  setUserCart(items);
  emitChanged(items);
}

export async function addCartItem(product, quantity = 1) {
  if (!isLoggedInUser()) return [];
  const currentItems = getUserCart();
  const normalizedProduct = normalizeItem(product);
  normalizedProduct.quantity = quantity;

  const existingItem = currentItems.find(
    (item) => String(item.id) === String(normalizedProduct.id) && item.scale === normalizedProduct.scale
  );
  const nextItems = existingItem
    ? currentItems.map((item) =>
        item === existingItem ? { ...item, quantity: Math.min(item.quantity + quantity, 10) } : item
      )
    : [...currentItems, normalizedProduct];

  saveCartItems(nextItems);

  if (isLoggedInUser()) {
    try {
      const serverItems = await upsertCartItem(Number(normalizedProduct.id), existingItem ? existingItem.quantity + quantity : quantity);
      saveCartItems(toServerItems(serverItems));
    } catch {
      // keep optimistic local state
    }
  }
  return getUserCart();
}

export async function updateCartItemQuantity(productId, quantity) {
  if (!isLoggedInUser()) return;
  const currentItems = getUserCart();
  const nextItems = currentItems.map((item) =>
    String(item.id) === String(productId) ? { ...item, quantity } : item
  );
  saveCartItems(nextItems);
  if (isLoggedInUser()) {
    try {
      const serverItems = await upsertCartItem(Number(productId), quantity);
      saveCartItems(toServerItems(serverItems));
    } catch {
      // keep optimistic local state
    }
  }
}

export async function deleteCartItem(productId) {
  if (!isLoggedInUser()) return;
  const nextItems = getUserCart().filter((item) => String(item.id) !== String(productId));
  saveCartItems(nextItems);
  if (isLoggedInUser()) {
    try {
      const serverItems = await removeCartItem(Number(productId));
      saveCartItems(toServerItems(serverItems));
    } catch {
      // keep optimistic local state
    }
  }
}

export async function clearCartItems() {
  if (!isLoggedInUser()) return;
  saveCartItems([]);
  if (isLoggedInUser()) {
    try {
      const serverItems = await clearMyCart();
      saveCartItems(toServerItems(serverItems));
    } catch {
      // keep local empty
    }
  }
}

export function getCartItemCount() {
  return getUserCart().length;
}

export { CART_CHANGED_EVENT };
