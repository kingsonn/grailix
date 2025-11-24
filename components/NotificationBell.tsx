"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type Notification = {
  id: number;
  prediction_id: number;
  type: "win" | "loss";
  title: string;
  message: string;
  payout_amount: number;
  read: boolean;
  created_at: string;
  predictions?: {
    id: number;
    prediction_text: string;
    asset: string;
    outcome_value: string;
  };
};

/**
 * NotificationBell - Displays notification bell with unread count and dropdown
 */
export default function NotificationBell() {
  const { address, isConnected } = useAccount();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch unread count
  const fetchUnreadCount = async () => {
    if (!isConnected || !address) return;

    try {
      console.log("🔔 Fetching unread count for wallet:", address);
      const response = await fetch(`/api/notifications/unread-count?wallet_address=${address}`);

      const data = await response.json();
      console.log("📊 Unread count response:", data);
      
      if (data.success) {
        setUnreadCount(data.unread_count);
        console.log(`✅ Unread count: ${data.unread_count}`);
      } else {
        console.error("❌ Failed to fetch unread count:", data.error);
      }
    } catch (error) {
      console.error("❌ Error fetching unread count:", error);
    }
  };

  // Fetch notifications (only unread)
  const fetchNotifications = async () => {
    if (!isConnected || !address) return;

    setIsLoading(true);
    try {
      console.log("📋 Fetching unread notifications for wallet:", address);
      // Fetch only unread notifications for faster loading
      const response = await fetch(`/api/notifications/list?wallet_address=${address}&limit=20&unread_only=true`);

      const data = await response.json();
      console.log("📋 Notifications response:", data);
      
      if (data.success) {
        setNotifications(data.notifications);
        console.log(`✅ Loaded ${data.notifications.length} unread notifications`);
      } else {
        console.error("❌ Failed to fetch notifications:", data.error);
      }
    } catch (error) {
      console.error("❌ Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark notification as read (optimistic update)
  const markAsRead = async (notificationId: number) => {
    if (!address) return;

    // Optimistic update - update UI immediately
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      // Send request in background
      fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          notification_id: notificationId,
          wallet_address: address 
        }),
      }).catch((error) => {
        console.error("Error marking notification as read:", error);
        // Revert on error
        fetchNotifications();
        fetchUnreadCount();
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all as read (optimistic update)
  const markAllAsRead = async () => {
    if (!address) return;

    // Optimistic update - clear UI immediately
    setNotifications([]);
    setUnreadCount(0);
    setIsOpen(false); // Close dropdown

    try {
      // Send request in background
      fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          mark_all: true,
          wallet_address: address 
        }),
      }).catch((error) => {
        console.error("Error marking all as read:", error);
        // Revert on error
        fetchNotifications();
        fetchUnreadCount();
      });
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Fetch unread count on mount and every 30 seconds
  useEffect(() => {
    if (isConnected) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isConnected, address]);

  if (!isConnected) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={toggleDropdown}
        className="relative flex items-center gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2 bg-grail/10 hover:bg-grail/20 text-grail-light border border-grail/30 hover:border-grail/50 rounded-lg transition-all font-mono shadow-lg"
        title="Notifications"
      >
        <div className="relative">
          {/* Bell Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
            />
          </svg>
          
          {/* Unread Badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-loss text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-lg">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
        <span className="hidden sm:inline">ALERTS</span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 mt-2 sm:w-80 md:w-96 max-w-md bg-void-black border border-grail/30 rounded-lg shadow-2xl z-50 max-h-[70vh] sm:max-h-[500px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-void-graphite to-void-graphite/80 border-b border-grail/30 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-grail animate-pulse shadow-lg shadow-grail/50"></div>
              <span className="text-gray-400 text-xs font-mono tracking-wider">NOTIFICATIONS</span>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-grail hover:text-grail-light font-mono transition-colors"
              >
                MARK_ALL_READ
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500 font-mono text-sm">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-grail border-t-transparent mb-2"></div>
                <div>Loading...</div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-gray-400 font-mono text-sm">All caught up!</div>
                <div className="text-gray-600 font-mono text-xs mt-1">No unread notifications</div>
              </div>
            ) : (
              <div className="divide-y divide-grail/20">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => !notif.read && markAsRead(notif.id)}
                    className={`p-4 cursor-pointer transition-colors ${
                      notif.read
                        ? "bg-void-black/50 hover:bg-void-graphite/30"
                        : "bg-grail/5 hover:bg-grail/10"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="text-sm font-bold text-white font-mono">
                            {notif.title}
                          </h4>
                          {!notif.read && (
                            <div className="w-2 h-2 rounded-full bg-grail flex-shrink-0 mt-1"></div>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 font-mono mb-2 line-clamp-2">
                          {notif.message}
                        </p>
                        {notif.type === "win" && notif.payout_amount > 0 && (
                          <div className="text-xs font-bold text-profit font-mono">
                            +{notif.payout_amount.toFixed(2)} credits
                          </div>
                        )}
                        <div className="text-[10px] text-gray-600 font-mono mt-1">
                          {new Date(notif.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
