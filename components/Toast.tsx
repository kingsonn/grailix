"use client";

import { useEffect } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

export default function Toast({ id, type, title, message, duration = 5000, onClose }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const typeStyles = {
    success: "bg-profit/10 border-profit/30 text-profit",
    error: "bg-loss/10 border-loss/30 text-loss",
    info: "bg-grail/10 border-grail/30 text-grail",
    warning: "bg-yellow-500/10 border-yellow-500/30 text-yellow-500",
  };

  const iconMap = {
    success: "✓",
    error: "✕",
    info: "ℹ",
    warning: "⚠",
  };

  return (
    <div
      className={`
        ${typeStyles[type]}
        border rounded-lg p-4 shadow-lg backdrop-blur-sm
        animate-slide-in-right
        min-w-[300px] max-w-[400px]
        font-mono
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center font-bold text-lg">
          {iconMap[type]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm mb-1">{title}</div>
          {message && (
            <div className="text-xs opacity-80 break-words">{message}</div>
          )}
        </div>
        <button
          onClick={() => onClose(id)}
          className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity text-lg leading-none"
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
}
