import { apiDelete, apiGet, apiPost } from "../lib/api";

export async function getMyCart() {
  const data = await apiGet("/cart");
  return data?.items || [];
}

export async function upsertCartItem(productId, quantity) {
  const data = await apiPost("/cart/items", { productId, quantity });
  return data?.items || [];
}

export async function removeCartItem(productId) {
  const data = await apiDelete(`/cart/items/${productId}`);
  return data?.items || [];
}

export async function clearMyCart() {
  const data = await apiDelete("/cart");
  return data?.items || [];
}
