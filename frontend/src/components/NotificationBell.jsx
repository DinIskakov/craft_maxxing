import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, UserPlus, Swords, Check, X, Trophy, TrendingUp, Link as LinkIcon } from 'lucide-react'
import { notificationsApi, friendsApi, challengeApi } from '../lib/api'
import { broadcastNotificationUpdate } from '../lib/notification-sync'

const ICON_MAP = {
    friend_request: UserPlus,
    friend_accepted: Check,
    challenge_received: Swords,
    challenge_accepted: Trophy,
    challenge_declined: X,
    challenge_link_accepted: LinkIcon,
    opponent_progress: TrendingUp,
}

const COLOR_MAP = {
    friend_request: 'bg-blue-100 text-blue-600',
    friend_accepted: 'bg-green-100 text-green-600',
    challenge_received: 'bg-amber-100 text-amber-600',
    challenge_accepted: 'bg-green-100 text-green-600',
    challenge_declined: 'bg-red-100 text-red-600',
    challenge_link_accepted: 'bg-purple-100 text-purple-600',
    opponent_progress: 'bg-indigo-100 text-indigo-600',
}

const ACTIONABLE_TYPES = ['friend_request', 'challenge_received']

export default function NotificationBell() {
    const [unreadCount, setUnreadCount] = useState(0)
    const [notifications, setNotifications] = useState([])
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [actionLoading, setActionLoading] = useState(null)
    const [actedOn, setActedOn] = useState({})
    const dropdownRef = useRef(null)
    const navigate = useNavigate()

    // Poll for unread count every 15 seconds
    useEffect(() => {
        fetchUnreadCount()
        const interval = setInterval(fetchUnreadCount, 15000)
        return () => clearInterval(interval)
    }, [])

    // Listen for broadcast events from other components (SetupPage, ChallengesPage, FriendsPage)
    useEffect(() => {
        const handler = () => {
            fetchUnreadCount()
            // If dropdown is open, also refresh the list
            if (open) {
                fetchNotifications()
            }
        }
        window.addEventListener('notifications-updated', handler)
        return () => window.removeEventListener('notifications-updated', handler)
    }, [open])

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const fetchUnreadCount = async () => {
        try {
            const data = await notificationsApi.getUnreadCount()
            setUnreadCount(data.unread)
        } catch {
            // silently fail
        }
    }

    const fetchNotifications = async () => {
        setLoading(true)
        try {
            const data = await notificationsApi.getNotifications(20)
            setNotifications(data)
        } catch {
            // silently fail
        }
        setLoading(false)
    }

    const handleToggle = () => {
        if (!open) {
            fetchNotifications()
        }
        setOpen(!open)
    }

    const handleMarkAllRead = async () => {
        try {
            await notificationsApi.markAllAsRead()
            setUnreadCount(0)
            setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        } catch {
            // silently fail
        }
    }

    const markReadAndUpdate = async (notificationId) => {
        try {
            await notificationsApi.markAsRead(notificationId)
        } catch {
            // best effort
        }
        setUnreadCount(prev => Math.max(0, prev - 1))
        setNotifications(prev =>
            prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        )
    }

    const handleNotificationClick = async (notification) => {
        if (!notification.read) {
            await markReadAndUpdate(notification.id)
        }

        switch (notification.type) {
            case 'friend_request':
                navigate('/friends?tab=requests')
                break
            case 'friend_accepted':
                navigate('/friends')
                break
            case 'challenge_received':
            case 'challenge_accepted':
            case 'challenge_declined':
            case 'challenge_link_accepted':
            case 'opponent_progress':
                navigate('/challenges')
                break
            default:
                break
        }
        setOpen(false)
    }

    const handleAcceptFriendRequest = async (e, notification) => {
        e.stopPropagation()
        setActionLoading(notification.id + '-accept')
        try {
            const requesterId = notification.data?.requester_id
            const requests = await friendsApi.getFriendRequests()
            const req = requests.find(r => r.id === requesterId)
            if (req) {
                await friendsApi.respondToRequest(req.friendship_id, true)
                setActedOn(prev => ({ ...prev, [notification.id]: 'accepted' }))
                await markReadAndUpdate(notification.id)
                broadcastNotificationUpdate()
            }
        } catch (err) {
            console.error('Failed to accept friend request:', err)
        }
        setActionLoading(null)
    }

    const handleDeclineFriendRequest = async (e, notification) => {
        e.stopPropagation()
        setActionLoading(notification.id + '-decline')
        try {
            const requesterId = notification.data?.requester_id
            const requests = await friendsApi.getFriendRequests()
            const req = requests.find(r => r.id === requesterId)
            if (req) {
                await friendsApi.respondToRequest(req.friendship_id, false)
                setActedOn(prev => ({ ...prev, [notification.id]: 'declined' }))
                await markReadAndUpdate(notification.id)
                broadcastNotificationUpdate()
            }
        } catch (err) {
            console.error('Failed to decline friend request:', err)
        }
        setActionLoading(null)
    }

    const handleAcceptChallenge = async (e, notification) => {
        e.stopPropagation()
        setActionLoading(notification.id + '-accept')
        try {
            const challengeId = notification.data?.challenge_id
            if (challengeId) {
                await challengeApi.respondToChallenge(challengeId, true)
                setActedOn(prev => ({ ...prev, [notification.id]: 'accepted' }))
                await markReadAndUpdate(notification.id)
                broadcastNotificationUpdate()
            }
        } catch (err) {
            console.error('Failed to accept challenge:', err)
        }
        setActionLoading(null)
    }

    const handleDeclineChallenge = async (e, notification) => {
        e.stopPropagation()
        setActionLoading(notification.id + '-decline')
        try {
            const challengeId = notification.data?.challenge_id
            if (challengeId) {
                await challengeApi.respondToChallenge(challengeId, false)
                setActedOn(prev => ({ ...prev, [notification.id]: 'declined' }))
                await markReadAndUpdate(notification.id)
                broadcastNotificationUpdate()
            }
        } catch (err) {
            console.error('Failed to decline challenge:', err)
        }
        setActionLoading(null)
    }

    const formatTime = (dateStr) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diffMs = now - date
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'just now'
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
        return date.toLocaleDateString()
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleToggle}
                className="relative p-2 hover:bg-stone-100 rounded-full transition-colors"
            >
                <Bell className="w-5 h-5 text-stone-600" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 ring-2 ring-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
                        <h3 className="font-semibold text-stone-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-stone-500 hover:text-stone-900 font-medium transition-colors"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-stone-900" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center py-8 px-4">
                                <Bell className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                                <p className="text-sm text-stone-400">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((n) => {
                                const IconComp = ICON_MAP[n.type] || Bell
                                const colorClass = COLOR_MAP[n.type] || 'bg-stone-100 text-stone-600'
                                const action = actedOn[n.id]
                                const isActionable = ACTIONABLE_TYPES.includes(n.type) && !action

                                return (
                                    <div
                                        key={n.id}
                                        onClick={() => handleNotificationClick(n)}
                                        className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-stone-50 transition-colors border-b border-stone-50 last:border-b-0 ${!n.read ? 'bg-blue-50/40' : ''}`}
                                    >
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                                            <IconComp className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm ${!n.read ? 'font-semibold text-stone-900' : 'font-medium text-stone-700'}`}>
                                                {n.title}
                                            </p>
                                            {n.message && (
                                                <p className="text-xs text-stone-500 mt-0.5 truncate">{n.message}</p>
                                            )}
                                            <p className="text-[10px] text-stone-400 mt-1">{formatTime(n.created_at)}</p>

                                            {isActionable && (
                                                <div className="flex gap-2 mt-2">
                                                    <button
                                                        onClick={(e) =>
                                                            n.type === 'friend_request'
                                                                ? handleAcceptFriendRequest(e, n)
                                                                : handleAcceptChallenge(e, n)
                                                        }
                                                        disabled={!!actionLoading}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-medium hover:bg-stone-800 transition-colors disabled:opacity-50"
                                                    >
                                                        {actionLoading === n.id + '-accept' ? (
                                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                                                        ) : (
                                                            <Check className="w-3 h-3" />
                                                        )}
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={(e) =>
                                                            n.type === 'friend_request'
                                                                ? handleDeclineFriendRequest(e, n)
                                                                : handleDeclineChallenge(e, n)
                                                        }
                                                        disabled={!!actionLoading}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-stone-100 text-stone-600 rounded-lg text-xs font-medium hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                                                    >
                                                        {actionLoading === n.id + '-decline' ? (
                                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-stone-400" />
                                                        ) : (
                                                            <X className="w-3 h-3" />
                                                        )}
                                                        Decline
                                                    </button>
                                                </div>
                                            )}

                                            {action === 'accepted' && (
                                                <span className="inline-flex items-center gap-1 mt-2 text-xs text-green-600 font-medium">
                                                    <Check className="w-3 h-3" /> Accepted
                                                </span>
                                            )}
                                            {action === 'declined' && (
                                                <span className="inline-flex items-center gap-1 mt-2 text-xs text-red-500 font-medium">
                                                    <X className="w-3 h-3" /> Declined
                                                </span>
                                            )}
                                        </div>
                                        {!n.read && (
                                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
