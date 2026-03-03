import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';

function timeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

export default function NotificationCenter() {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const {
        notifications,
        unreadCount,
        fetchNotifications,
        fetchUnreadCount,
        markNotificationRead,
        markAllNotificationsRead,
    } = useProjectStore();

    // Fetch on mount and poll every 30s
    useEffect(() => {
        fetchUnreadCount();
        fetchNotifications();
        const interval = setInterval(() => {
            fetchUnreadCount();
        }, 30000);
        return () => clearInterval(interval);
    }, [fetchUnreadCount, fetchNotifications]);

    // Close on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        if (open) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    const handleNotifClick = (notif: { id: string; is_read: boolean; link?: string }) => {
        if (!notif.is_read) markNotificationRead(notif.id);
        if (notif.link) {
            navigate(notif.link);
            setOpen(false);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => {
                    setOpen((v) => !v);
                    if (!open) fetchNotifications();
                }}
                className="relative btn-ghost p-2"
                title="Notifications"
            >
                <Bell size={18} className="text-slate-300" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 top-full mt-2 w-80 max-h-[480px] bg-surface-800 border border-surface-600 rounded-xl shadow-2xl shadow-black/60 z-50 flex flex-col overflow-hidden animate-slide-up">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-surface-600 bg-surface-800/80 backdrop-blur-sm">
                        <h3 className="text-sm font-semibold text-slate-100">Notifications</h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => markAllNotificationsRead()}
                                    className="text-[11px] text-brand-400 hover:text-brand-300 flex items-center gap-1"
                                    title="Mark all as read"
                                >
                                    <CheckCheck size={13} /> Mark all read
                                </button>
                            )}
                            <button onClick={() => setOpen(false)} className="btn-ghost p-1">
                                <X size={14} />
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                                <Bell size={28} className="mb-2 text-slate-600" />
                                <p className="text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <button
                                    key={notif.id}
                                    onClick={() => handleNotifClick(notif)}
                                    className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-surface-700/50 transition-colors border-b border-surface-700/50 ${!notif.is_read ? 'bg-brand-500/5' : ''}`}
                                >
                                    {/* Unread dot */}
                                    <div className="mt-1.5 flex-shrink-0">
                                        {!notif.is_read ? (
                                            <div className="w-2 h-2 rounded-full bg-brand-500" />
                                        ) : (
                                            <div className="w-2 h-2 rounded-full bg-transparent" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm ${!notif.is_read ? 'text-slate-100 font-medium' : 'text-slate-300'}`}>
                                            {notif.message}
                                        </p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">{timeAgo(notif.created_at)}</p>
                                    </div>
                                    {!notif.is_read && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                markNotificationRead(notif.id);
                                            }}
                                            className="btn-ghost p-1 mt-0.5 flex-shrink-0"
                                            title="Mark as read"
                                        >
                                            <Check size={12} className="text-slate-400" />
                                        </button>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
