import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";
import { getMyOrders, getMyRefundRequests } from "../services/adminApi";

const UserNotificationsContext = createContext(undefined);
const POLL_INTERVAL_MS = 10000;
const MAX_NOTIFICATIONS = 20;

const ORDER_STATUS_LABELS = {
  PENDING: "Đang xử lý",
  CONFIRMED: "Đã xác nhận",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã hủy",
};

const REFUND_STATUS_LABELS = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  COMPLETED: "Đã hoàn tiền",
};

function getStorageKey(prefix, userId) {
  return `${prefix}:${userId}`;
}

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // bỏ qua lỗi localStorage tạm thời
  }
}

function buildOrderNotification(order) {
  return {
    id: `order-${order.id}-${order.status}`,
    title: "Đơn hàng được cập nhật",
    message: `${order.code} hiện ở trạng thái ${ORDER_STATUS_LABELS[order.status] || order.status}.`,
    createdAt: new Date().toISOString(),
    readAt: null,
    link: `/orders/${order.id}`,
  };
}

function buildRefundNotification(refund) {
  let title = "Yêu cầu hoàn tiền được cập nhật";
  let message = `${refund.order_code || "Đơn hàng"} có trạng thái hoàn tiền: ${REFUND_STATUS_LABELS[refund.status] || refund.status}.`;

  if (refund.status === "APPROVED") {
    title = "Yêu cầu hoàn tiền đã được duyệt";
    message = `${refund.order_code || "Đơn hàng"} đã được duyệt yêu cầu hoàn tiền.`;
  } else if (refund.status === "COMPLETED") {
    title = "Hoàn tiền đã hoàn tất";
    message = `${refund.order_code || "Đơn hàng"} đã được hoàn tiền thành công.`;
  } else if (refund.status === "REJECTED") {
    title = "Yêu cầu hoàn tiền bị từ chối";
    message = `${refund.order_code || "Đơn hàng"} đã bị từ chối yêu cầu hoàn tiền.`;
  }

  return {
    id: `refund-${refund.id}-${refund.status}`,
    title,
    message,
    createdAt: new Date().toISOString(),
    readAt: null,
    link: refund.order_id ? `/orders/${refund.order_id}` : "/orders",
  };
}

export function UserNotificationsProvider({ children }) {
  const { user, isLoggedIn, isAdmin, isAuthReady } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const knownOrderStatusesRef = useRef({});
  const knownRefundStatusesRef = useRef({});

  useEffect(() => {
    if (!isAuthReady) return undefined;
    if (!isLoggedIn || isAdmin || !user?.id) {
      setNotifications([]);
      knownOrderStatusesRef.current = {};
      knownRefundStatusesRef.current = {};
      return undefined;
    }

    const notificationsKey = getStorageKey("hbc-user-notifications", user.id);
    const orderStatusKey = getStorageKey("hbc-user-order-statuses", user.id);
    const refundStatusKey = getStorageKey("hbc-user-refund-statuses", user.id);

    const storedNotifications = loadJson(notificationsKey, []);
    const storedOrderStatuses = loadJson(orderStatusKey, {});
    const storedRefundStatuses = loadJson(refundStatusKey, {});
    setNotifications(Array.isArray(storedNotifications) ? storedNotifications : []);
    knownOrderStatusesRef.current = storedOrderStatuses && typeof storedOrderStatuses === "object" ? storedOrderStatuses : {};
    knownRefundStatusesRef.current =
      storedRefundStatuses && typeof storedRefundStatuses === "object" ? storedRefundStatuses : {};

    let active = true;

    const pollUserNotifications = async () => {
      try {
        const [orders, refunds] = await Promise.all([getMyOrders(), getMyRefundRequests()]);
        if (!active) return;

        const nextOrderStatuses = {};
        const nextRefundStatuses = {};
        const generatedNotifications = [];

        orders.forEach((order) => {
          const key = String(order.id);
          nextOrderStatuses[key] = order.status;
          const previousStatus = knownOrderStatusesRef.current[key];
          if (previousStatus && previousStatus !== order.status) {
            generatedNotifications.push(buildOrderNotification(order));
          }
        });

        refunds.forEach((refund) => {
          const key = String(refund.id);
          nextRefundStatuses[key] = refund.status;
          const previousStatus = knownRefundStatusesRef.current[key];
          if (previousStatus && previousStatus !== refund.status) {
            generatedNotifications.push(buildRefundNotification(refund));
          }
        });

        knownOrderStatusesRef.current = nextOrderStatuses;
        knownRefundStatusesRef.current = nextRefundStatuses;
        saveJson(orderStatusKey, nextOrderStatuses);
        saveJson(refundStatusKey, nextRefundStatuses);

        if (generatedNotifications.length > 0) {
          setNotifications((prev) => {
            const existing = Array.isArray(prev) ? prev : [];
            const existingIds = new Set(existing.map((item) => item.id));
            const fresh = generatedNotifications.filter((item) => !existingIds.has(item.id));
            const next = [...fresh, ...existing].slice(0, MAX_NOTIFICATIONS);
            saveJson(notificationsKey, next);
            return next;
          });

          generatedNotifications.forEach((item) => {
            toast.info(item.title, {
              description: item.message,
            });
          });
        } else {
          setNotifications((prev) => {
            const normalized = Array.isArray(prev) ? prev.slice(0, MAX_NOTIFICATIONS) : [];
            saveJson(notificationsKey, normalized);
            return normalized;
          });
        }
      } catch {
        // bỏ qua lỗi poll tạm thời
      }
    };

    pollUserNotifications();
    const intervalId = window.setInterval(pollUserNotifications, POLL_INTERVAL_MS);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [isAdmin, isAuthReady, isLoggedIn, user?.id]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.readAt).length,
    [notifications]
  );

  const markAllAsRead = () => {
    if (!user?.id) return;
    const notificationsKey = getStorageKey("hbc-user-notifications", user.id);
    const next = notifications.map((item) => ({
      ...item,
      readAt: item.readAt || new Date().toISOString(),
    }));
    setNotifications(next);
    saveJson(notificationsKey, next);
  };

  return (
    <UserNotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        markAllAsRead,
      }}
    >
      {children}
    </UserNotificationsContext.Provider>
  );
}

export function useUserNotifications() {
  const context = useContext(UserNotificationsContext);
  if (context === undefined) {
    throw new Error("useUserNotifications must be used within UserNotificationsProvider");
  }
  return context;
}
