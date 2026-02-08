import { notificationsApi } from './api'

/**
 * Shared notification sync utilities.
 *
 * When any component accepts/declines a challenge or friend request,
 * it should call these helpers to:
 *   1. Mark the related notification as read
 *   2. Broadcast a refresh event so NotificationBell updates its badge
 */

/** Dispatch a custom event that NotificationBell listens for. */
export function broadcastNotificationUpdate() {
    window.dispatchEvent(new Event('notifications-updated'))
}

/**
 * Find the notification matching a challenge action and mark it as read.
 * Then broadcast so the bell badge updates.
 */
export async function markChallengeNotificationRead(challengeId) {
    try {
        const notifications = await notificationsApi.getNotifications(50)
        const match = notifications.find(
            (n) =>
                n.type === 'challenge_received' &&
                n.data?.challenge_id === challengeId &&
                !n.read
        )
        if (match) {
            await notificationsApi.markAsRead(match.id)
        }
    } catch {
        // best-effort
    }
    broadcastNotificationUpdate()
}

/**
 * Find the notification matching a friend request action and mark it as read.
 * Then broadcast so the bell badge updates.
 */
export async function markFriendNotificationRead(requesterId) {
    try {
        const notifications = await notificationsApi.getNotifications(50)
        const match = notifications.find(
            (n) =>
                n.type === 'friend_request' &&
                n.data?.requester_id === requesterId &&
                !n.read
        )
        if (match) {
            await notificationsApi.markAsRead(match.id)
        }
    } catch {
        // best-effort
    }
    broadcastNotificationUpdate()
}
