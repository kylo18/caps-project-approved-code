import { useEffect, useMemo, useState } from "react";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notificationService";
import { getSupportRequests } from "../services/adminSupportService";

// Render the notification panel component.
const NotificationPanel = ({ isOpen, onClose, navigate, roleId }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    if (roleId === 1) {
      // Student View: Standard notifications.
      getNotifications().then((response) => {
        setNotifications(response.data || []);
        setUnreadCount(response.meta?.unread_count || 0);
      });
    } else {
      // Staff/Admin View (2, 3, 4): Student Support Messages.
      getSupportRequests().then((response) => {
        const mapped = (response.data || []).map((req) => ({
          id: req.id,
          title: `From: ${req.student?.name || "Student"}`,
          message: req.subject,
          type: "support_request",
          is_read: req.status === "resolved",
          created_at: req.created_at,
          action_url: "/admin/support",
        }));
        setNotifications(mapped);
        setUnreadCount(mapped.filter((n) => !n.is_read).length);
      });
    }
  }, [isOpen, roleId]);

  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const sortedNotifications = useMemo(
    () =>
      [...notifications].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      ),
    [notifications],
  );

  // Handle notification click.
  const handleNotificationClick = async (notification) => {
    // The read state is updated optimistically to keep the panel responsive;
    // the service can later be swapped to a real PATCH endpoint.
    if (!notification.is_read) {
      await markNotificationRead(notification.id);
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, is_read: true } : item,
        ),
      );
      setUnreadCount((current) => Math.max(current - 1, 0));
    }

    if (notification.action_url) {
      onClose();
      navigate(notification.action_url);
    }
  };

  // Handle mark all.
  const handleMarkAll = async () => {
    await markAllNotificationsRead();
    setNotifications((current) =>
      current.map((item) => ({ ...item, is_read: true })),
    );
    setUnreadCount(0);
  };

  if (!isOpen) return null;

  return (
    <div className="lightbox-bg fixed inset-0 z-[170] flex items-end justify-center bg-black/40 min-[448px]:items-center">
      <div className="h-screen w-screen overflow-hidden rounded-t-3xl bg-gray-50 shadow-2xl min-[448px]:rounded-3xl dark:bg-black">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-white/10">
          <div>
            <h2 className="text-[18px] font-semibold text-gray-900 dark:text-white">
              Notifications
            </h2>
            <p className="mt-1 text-[12px] text-gray-500 dark:text-gray-300">
              {unreadCount} unread update{unreadCount === 1 ? "" : "s"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleMarkAll}
              className="rounded-full border border-gray-200 px-3 py-1 text-[12px] font-medium text-gray-600 transition hover:bg-gray-100 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
            >
              Mark all as read
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-white/10"
            >
              <i className="bx bx-x text-2xl"></i>
            </button>
          </div>
        </div>

        <div className="space-y-3 overflow-y-auto px-5 py-5">
          {sortedNotifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => handleNotificationClick(notification)}
              className={`w-full rounded-2xl border px-4 py-4 text-left transition ${notification.is_read
                ? "border-gray-200 bg-white dark:border-white/10 dark:bg-[var(--color-bg-secondary)]"
                : "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20"
                }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[14px] font-semibold text-gray-800 dark:text-white">
                    {notification.title}
                  </div>
                  <div className="mt-1 text-[13px] leading-6 text-gray-600 dark:text-gray-300">
                    {notification.message}
                  </div>
                </div>
                {!notification.is_read && (
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-orange-500"></span>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] tracking-wide text-gray-400 uppercase">
                <span>{notification.type.replace("_", " ")}</span>
                <span>
                  {new Date(notification.created_at).toLocaleDateString()}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;
