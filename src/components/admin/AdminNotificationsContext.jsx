import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  getAdminNotifications,
  getAdminOrders,
  getAdminRefundRequests,
  markAllAdminNotificationsAsRead,
} from "../../services/adminApi";

const AdminNotificationsContext = createContext(undefined);
const POLL_INTERVAL_MS = 20000;
const MAX_NOTIFICATIONS = 10;
const REFUND_READ_STORAGE_KEY = "hbc-admin-read-refund-notifications";

function loadReadRefundIds() {
  try {
    const raw = localStorage.getItem(REFUND_READ_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.map((item) => String(item)) : []);
  } catch {
    return new Set();
  }
}

function persistReadRefundIds(ids) {
  try {
    localStorage.setItem(REFUND_READ_STORAGE_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // bỏ qua lỗi localStorage tạm thời
  }
}

function buildRefundNotifications(refunds, readRefundIds) {
  return (refunds || [])
    .filter((item) => item.status === "PENDING")
    .map((item) => ({
      id: `refund-${item.id}`,
      title: "Yêu cầu hoàn tiền mới",
      message: item.order_code
        ? `Đơn ${item.order_code} vừa gửi yêu cầu hoàn tiền.`
        : "Có một yêu cầu hoàn tiền mới cần xử lý.",
      createdAt: item.created_at,
      readAt: readRefundIds.has(String(item.id)) ? item.created_at || new Date().toISOString() : null,
      link: "/admin/orders",
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function AdminNotificationsProvider({ children }) {
  const [backendNotifications, setBackendNotifications] = useState([]);
  const [refundNotifications, setRefundNotifications] = useState([]);
  const [refreshToken, setRefreshToken] = useState(0);
  const [latestOrders, setLatestOrders] = useState([]);
  const knownNotificationIdsRef = useRef(new Set());
  const knownRefundIdsRef = useRef(new Set());
  const readRefundIdsRef = useRef(loadReadRefundIds());
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    let active = true;

    const pollNotifications = async () => {
      try {
        const [notificationData, orders, refunds] = await Promise.all([
          getAdminNotifications(),
          getAdminOrders(),
          getAdminRefundRequests(),
        ]);
        if (!active) return;

        const backendItems = notificationData.notifications || [];
        const refundItems = refunds || [];
        const nextNotificationIds = new Set(backendItems.map((item) => String(item.id)));
        const nextRefundIds = new Set(
          refundItems.filter((item) => item.status === "PENDING").map((item) => String(item.id))
        );

        setLatestOrders(orders);
        setBackendNotifications(backendItems);
        setRefundNotifications(buildRefundNotifications(refundItems, readRefundIdsRef.current));

        if (!bootstrappedRef.current) {
          knownNotificationIdsRef.current = nextNotificationIds;
          knownRefundIdsRef.current = nextRefundIds;
          bootstrappedRef.current = true;
          return;
        }

        const newOrderNotifications = backendItems.filter(
          (item) => !knownNotificationIdsRef.current.has(String(item.id))
        );
        const newRefundNotifications = refundItems.filter(
          (item) => item.status === "PENDING" && !knownRefundIdsRef.current.has(String(item.id))
        );

        if (newOrderNotifications.length > 0 || newRefundNotifications.length > 0) {
          setRefreshToken((value) => value + 1);
        }

        if (newOrderNotifications.length > 0) {
          const latest = newOrderNotifications[0];
          toast.info("Có đơn hàng mới", {
            description: latest.message,
          });
        }

        if (newRefundNotifications.length > 0) {
          const latestRefund = newRefundNotifications[0];
          toast.info("Có yêu cầu hoàn tiền mới", {
            description: latestRefund.order_code
              ? `Đơn ${latestRefund.order_code} đang chờ admin xử lý.`
              : "Có một yêu cầu hoàn tiền mới đang chờ xử lý.",
          });
        }

        knownNotificationIdsRef.current = nextNotificationIds;
        knownRefundIdsRef.current = nextRefundIds;
      } catch {
        // bỏ qua lỗi poll tạm thời
      }
    };

    pollNotifications();
    const intervalId = window.setInterval(pollNotifications, POLL_INTERVAL_MS);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const notifications = useMemo(
    () =>
      [...refundNotifications, ...backendNotifications]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, MAX_NOTIFICATIONS),
    [backendNotifications, refundNotifications]
  );

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.readAt).length,
    [notifications]
  );

  const markAllAsRead = async () => {
    try {
      const data = await markAllAdminNotificationsAsRead();
      setBackendNotifications(data.notifications || []);
    } catch {
      // bỏ qua để không chặn mở dropdown
    }

    const nextReadRefundIds = new Set(readRefundIdsRef.current);
    refundNotifications.forEach((item) => {
      nextReadRefundIds.add(String(item.id).replace("refund-", ""));
    });
    readRefundIdsRef.current = nextReadRefundIds;
    persistReadRefundIds(nextReadRefundIds);
    setRefundNotifications((prev) =>
      prev.map((item) => ({
        ...item,
        readAt: item.readAt || new Date().toISOString(),
      }))
    );
  };

  return (
    <AdminNotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        markAllAsRead,
        refreshToken,
        latestOrders,
      }}
    >
      {children}
    </AdminNotificationsContext.Provider>
  );
}

export function useAdminNotifications() {
  const context = useContext(AdminNotificationsContext);
  if (context === undefined) {
    throw new Error("useAdminNotifications must be used within AdminNotificationsProvider");
  }
  return context;
}
