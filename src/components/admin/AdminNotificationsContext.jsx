import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { getAdminNotifications, getAdminOrders, markAllAdminNotificationsAsRead } from "../../services/adminApi";

const AdminNotificationsContext = createContext(undefined);
const POLL_INTERVAL_MS = 20000;
const MAX_NOTIFICATIONS = 10;

export function AdminNotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [refreshToken, setRefreshToken] = useState(0);
  const [latestOrders, setLatestOrders] = useState([]);
  const knownNotificationIdsRef = useRef(new Set());
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    let active = true;

    const pollOrders = async () => {
      try {
        const [notificationData, orders] = await Promise.all([
          getAdminNotifications(),
          getAdminOrders(),
        ]);
        if (!active) return;

        setLatestOrders(orders);
        setNotifications(notificationData.notifications || []);
        const nextIds = new Set((notificationData.notifications || []).map((item) => String(item.id)));

        if (!bootstrappedRef.current) {
          knownNotificationIdsRef.current = nextIds;
          bootstrappedRef.current = true;
          return;
        }

        const newNotifications = (notificationData.notifications || []).filter(
          (item) => !knownNotificationIdsRef.current.has(String(item.id))
        );
        if (newNotifications.length > 0) {
          setRefreshToken((value) => value + 1);
          const latest = newNotifications[0];
          toast.info("Có đơn hàng mới", {
            description: latest.message,
          });
        }

        knownNotificationIdsRef.current = nextIds;
      } catch {
        // bỏ qua lỗi poll tạm thời
      }
    };

    pollOrders();
    const intervalId = window.setInterval(pollOrders, POLL_INTERVAL_MS);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.readAt).length,
    [notifications]
  );

  const markAllAsRead = async () => {
    try {
      const data = await markAllAdminNotificationsAsRead();
      setNotifications(data.notifications || []);
    } catch {
      // bỏ qua để không chặn mở dropdown
    }
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
