const CART_CHANGED_EVENT = "hbc-cart-changed";

let currentUserKey = "guest";
const cartByUser = new Map();

function getUserCart() {
  return cartByUser.get(currentUserKey) || [];
}

function setUserCart(items) {
  cartByUser.set(currentUserKey, items);
}

export function setCartUserKey(userKey) {
  currentUserKey = userKey || "guest";
  window.dispatchEvent(new CustomEvent(CART_CHANGED_EVENT, { detail: getUserCart() }));
}

export function getCartItems() {
  return getUserCart();
}

export function saveCartItems(items) {
  setUserCart(items);
  window.dispatchEvent(new CustomEvent(CART_CHANGED_EVENT, { detail: items }));
}

export function addCartItem(product, quantity = 1) {
  const currentItems = getUserCart();
  const normalizedProduct = {
    id: product.id,
    image: product.image,
    name: product.name || product.title,
    brand: product.brand,
    category: product.category,
    scale: product.scale || "Tiêu chuẩn",
    price: Number(product.price || 0),
    quantity,
  };

  const existingItem = currentItems.find(
    (item) =>
      String(item.id) === String(normalizedProduct.id) &&
      item.scale === normalizedProduct.scale
  );

  const nextItems = existingItem
    ? currentItems.map((item) =>
        item === existingItem
          ? { ...item, quantity: Math.min(item.quantity + quantity, 10) }
          : item
      )
    : [...currentItems, normalizedProduct];

  saveCartItems(nextItems);
  return nextItems;
}

export function getCartItemCount() {
  return getUserCart().length;
}

export { CART_CHANGED_EVENT };
