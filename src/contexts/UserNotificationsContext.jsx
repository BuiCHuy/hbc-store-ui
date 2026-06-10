import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";
import { getMyNotifications, markAllMyNotificationsAsRead } from "../services/adminApi";

const UserNotificationsContext = createContext(undefined);
const POLL_INTERVAL_MS = 10000;

export function UserNotificationsProvider({ children }) {
  const { user, isLoggedIn, isAdmin, isAuthReady } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const knownNotificationIdsRef = useRef(new Set());
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    if (!isAuthReady) return undefined;
    if (!isLoggedIn || isAdmin || !user?.id) {
      setNotifications([]);
      knownNotificationIdsRef.current = new Set();
      bootstrappedRef.current = false;
      return undefined;
    }

    let active = true;

    const pollNotifications = async () => {
      try {
        const data = await getMyNotifications();
        if (!active) return;

        const items = data?.notifications || [];
        setNotifications(items);
        const nextIds = new Set(items.map((item) => String(item.id)));

        if (!bootstrappedRef.current) {
          knownNotificationIdsRef.current = nextIds;
          bootstrappedRef.current = true;
          return;
        }

        const newNotifications = items.filter(
          (item) => !knownNotificationIdsRef.current.has(String(item.id))
        );

        newNotifications.forEach((item) => {
          toast.info(item.title, {
            description: item.message,
          });
        });

        knownNotificationIdsRef.current = nextIds;
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
  }, [isAdmin, isAuthReady, isLoggedIn, user?.id]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.readAt).length,
    [notifications]
  );

  const markAllAsRead = async () => {
    try {
      const data = await markAllMyNotificationsAsRead();
      setNotifications(data?.notifications || []);
      knownNotificationIdsRef.current = new Set((data?.notifications || []).map((item) => String(item.id)));
    } catch {
      // bỏ qua để không chặn mở dropdown
    }
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
