import { supabase } from './supabase'

const API_BASE = '/api'

/**
 * Make an authenticated API request
 */
async function authFetch(endpoint, options = {}) {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        throw new Error('Not authenticated')
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            ...options.headers,
        },
    })

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }))
        throw new Error(error.detail || 'Request failed')
    }

    return response.json()
}

// ============================================
// Profile API
// ============================================

export const profileApi = {
    async getMyProfile() {
        return authFetch('/profiles/me')
    },

    async createProfile(username, displayName, bio) {
        return authFetch('/profiles', {
            method: 'POST',
            body: JSON.stringify({
                username,
                display_name: displayName,
                bio,
            }),
        })
    },

    async updateProfile(data) {
        return authFetch('/profiles/me', {
            method: 'PATCH',
            body: JSON.stringify(data),
        })
    },

    async searchUsers(query) {
        return authFetch(`/profiles/search?q=${encodeURIComponent(query)}`)
    },

    async checkUsername(username) {
        const response = await fetch(`${API_BASE}/profiles/check/${username}`)
        return response.json()
    },

    async getProfileByUsername(username) {
        return authFetch(`/profiles/${username}`)
    },
}

// ============================================
// Challenges API
// ============================================

export const challengeApi = {
    async getMyChallenges(status = null) {
        const query = status ? `?status=${status}` : ''
        return authFetch(`/challenges${query}`)
    },

    async getChallenge(challengeId) {
        return authFetch(`/challenges/${challengeId}`)
    },

    async createChallenge(opponentUsername, challengerSkill, opponentSkill, deadline, message, responseDays = 3) {
        return authFetch('/challenges', {
            method: 'POST',
            body: JSON.stringify({
                opponent_username: opponentUsername,
                challenger_skill: challengerSkill,
                opponent_skill: opponentSkill,
                deadline: deadline.toISOString(),
                message,
                response_days: responseDays,
            }),
        })
    },

    async withdrawChallenge(challengeId) {
        return authFetch(`/challenges/${challengeId}/withdraw`, {
            method: 'POST',
        })
    },

    async giveUpChallenge(challengeId) {
        return authFetch(`/challenges/${challengeId}/give-up`, {
            method: 'POST',
        })
    },

    async respondToChallenge(challengeId, accept) {
        return authFetch(`/challenges/${challengeId}/respond`, {
            method: 'POST',
            body: JSON.stringify({ accept }),
        })
    },

    async dailyCheckin(challengeId, completed, notes) {
        return authFetch(`/challenges/${challengeId}/checkin`, {
            method: 'POST',
            body: JSON.stringify({ completed, notes }),
        })
    },
}

// ============================================
// Learning Plan API
// ============================================

export const learningPlanApi = {
    async generatePlan(skillName) {
        return authFetch('/learning-plan', {
            method: 'POST',
            body: JSON.stringify({ skill_name: skillName }),
        })
    },
}

// ============================================
// Friends API
// ============================================

export const friendsApi = {
    async getMyFriends() {
        return authFetch('/friends')
    },

    async getFriendRequests() {
        return authFetch('/friends/requests')
    },

    async addFriend(userId) {
        return authFetch('/friends', {
            method: 'POST',
            body: JSON.stringify({ friend_id: userId }),
        })
    },

    async respondToRequest(requestId, accept) {
        return authFetch(`/friends/${requestId}/respond`, {
            method: 'POST',
            body: JSON.stringify({ accept }),
        })
    },

    async removeFriend(friendId) {
        return authFetch(`/friends/${friendId}`, {
            method: 'DELETE',
        })
    },

    async getFriendsActivity() {
        return authFetch('/friends/activity')
    },
}

// ============================================
// Notifications API
// ============================================

export const notificationsApi = {
    async getNotifications(limit = 20) {
        return authFetch(`/notifications?limit=${limit}`)
    },

    async getUnreadCount() {
        return authFetch('/notifications/unread-count')
    },

    async markAsRead(notificationId) {
        return authFetch(`/notifications/${notificationId}/read`, {
            method: 'POST',
        })
    },

    async markAllAsRead() {
        return authFetch('/notifications/read-all', {
            method: 'POST',
        })
    },
}

// ============================================
// AI API
// ============================================

export const aiApi = {
    async suggestSkill() {
        return authFetch('/suggest-skill', {
            method: 'POST',
        })
    },
}

// ============================================
// Extended Profile API (friend profiles)
// ============================================

export const extendedProfileApi = {
    async getFullProfile(username) {
        return authFetch(`/profiles/${username}/full`)
    },
}

// ============================================
// Challenge Links API
// ============================================

export const challengeLinksApi = {
    async createInviteLink(skill, deadline, message) {
        return authFetch('/challenges/invite-link', {
            method: 'POST',
            body: JSON.stringify({
                opponent_username: '_link_', // placeholder, not used for links
                challenger_skill: skill,
                opponent_skill: skill,
                deadline: deadline.toISOString(),
                message,
            }),
        })
    },

    async getInviteLink(code) {
        return authFetch(`/challenges/invite/${code}`)
    },

    async acceptInviteLink(code) {
        return authFetch(`/challenges/invite/${code}/accept`, {
            method: 'POST',
        })
    },
}
