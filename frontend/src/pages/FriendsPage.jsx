import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
    Search, UserPlus, Users, Swords, Check, X, UserMinus,
    Share2, Copy, CheckCheck, Mail
} from 'lucide-react'
import { profileApi, friendsApi, challengeLinksApi } from '../lib/api'
import NotificationBell from '../components/NotificationBell'
import { markFriendNotificationRead } from '../lib/notification-sync'

export default function FriendsPage() {
    const [searchParams, setSearchParams] = useSearchParams()
    const initialTab = searchParams.get('tab') || 'friends'
    const [tab, setTab] = useState(initialTab)
    const [friends, setFriends] = useState([])
    const [requests, setRequests] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [searching, setSearching] = useState(false)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(null)
    const [showInviteModal, setShowInviteModal] = useState(false)
    const [inviteCopied, setInviteCopied] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        loadData()
    }, [])

    useEffect(() => {
        const urlTab = searchParams.get('tab')
        if (urlTab && urlTab !== tab) {
            setTab(urlTab)
        }
    }, [searchParams])

    const loadData = async () => {
        setLoading(true)
        try {
            const [friendsData, requestsData] = await Promise.all([
                friendsApi.getMyFriends(),
                friendsApi.getFriendRequests(),
            ])
            setFriends(friendsData)
            setRequests(requestsData)
        } catch (err) {
            console.error('Failed to load friends data:', err)
        }
        setLoading(false)
    }

    const handleSearch = async (value) => {
        setSearchQuery(value)
        if (value.length < 2) {
            setSearchResults([])
            return
        }
        setSearching(true)
        try {
            const users = await profileApi.searchUsers(value.replace('@', ''))
            setSearchResults(users)
        } catch {
            setSearchResults([])
        }
        setSearching(false)
    }

    const handleAddFriend = async (user) => {
        setActionLoading(user.id)
        try {
            await friendsApi.addFriend(user.id)
            setSearchResults(prev =>
                prev.map(u => u.id === user.id ? { ...u, friendStatus: 'pending' } : u)
            )
        } catch (err) {
            console.error('Failed to add friend:', err)
        }
        setActionLoading(null)
    }

    const handleAcceptRequest = async (request) => {
        setActionLoading(request.friendship_id)
        try {
            await friendsApi.respondToRequest(request.friendship_id, true)
            setRequests(prev => prev.filter(r => r.friendship_id !== request.friendship_id))
            const updatedFriends = await friendsApi.getMyFriends()
            setFriends(updatedFriends)
            // Mark the friend request notification as read and update bell badge
            markFriendNotificationRead(request.id)
        } catch (err) {
            console.error('Failed to accept request:', err)
        }
        setActionLoading(null)
    }

    const handleDeclineRequest = async (request) => {
        setActionLoading(request.friendship_id + '-decline')
        try {
            await friendsApi.respondToRequest(request.friendship_id, false)
            setRequests(prev => prev.filter(r => r.friendship_id !== request.friendship_id))
            // Mark the friend request notification as read and update bell badge
            markFriendNotificationRead(request.id)
        } catch (err) {
            console.error('Failed to decline request:', err)
        }
        setActionLoading(null)
    }

    const handleRemoveFriend = async (friend) => {
        if (!confirm(`Remove @${friend.username} from friends?`)) return
        setActionLoading(friend.friendship_id)
        try {
            await friendsApi.removeFriend(friend.friendship_id)
            setFriends(prev => prev.filter(f => f.friendship_id !== friend.friendship_id))
        } catch (err) {
            console.error('Failed to remove friend:', err)
        }
        setActionLoading(null)
    }

    const handleTabChange = (newTab) => {
        setTab(newTab)
        setSearchParams(newTab === 'friends' ? {} : { tab: newTab })
    }

    const handleCopyInviteLink = () => {
        const link = `${window.location.origin}/signup?ref=friend`
        navigator.clipboard.writeText(link)
        setInviteCopied(true)
        setTimeout(() => setInviteCopied(false), 2000)
    }

    const handleShareInvite = () => {
        const link = `${window.location.origin}/signup?ref=friend`
        const text = `Join me on CraftMaxxing - learn any skill in 30 days with challenges!`
        if (navigator.share) {
            navigator.share({ title: 'Join CraftMaxxing', text, url: link })
        } else {
            handleCopyInviteLink()
        }
    }

    const tabs = [
        { id: 'friends', label: 'Friends', count: friends.length },
        { id: 'requests', label: 'Requests', count: requests.length },
        { id: 'search', label: 'Find People' },
    ]

    return (
        <div className="min-h-screen bg-stone-100 pb-24">
            {/* Header */}
            <header className="bg-white border-b border-stone-200 px-6 py-4 sticky top-0 z-10">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <h1 className="text-xl font-serif text-stone-900">Friends</h1>
                    <div className="flex items-center gap-2">
                        <NotificationBell />
                        <button
                            onClick={() => setShowInviteModal(true)}
                            className="p-2 hover:bg-stone-100 rounded-full transition-colors"
                            title="Invite to app"
                        >
                            <Mail className="w-5 h-5 text-stone-600" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="px-6 py-3 max-w-2xl mx-auto">
                <div className="flex gap-1 bg-stone-200/60 rounded-xl p-1">
                    {tabs.map(t => (
                        <button
                            key={t.id}
                            onClick={() => handleTabChange(t.id)}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                tab === t.id
                                    ? 'bg-white text-stone-900 shadow-sm'
                                    : 'text-stone-500 hover:text-stone-700'
                            }`}
                        >
                            {t.label}
                            {t.count > 0 && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                    tab === t.id
                                        ? t.id === 'requests' ? 'bg-red-100 text-red-600' : 'bg-stone-100 text-stone-600'
                                        : t.id === 'requests' ? 'bg-red-500 text-white' : 'bg-stone-300 text-stone-600'
                                }`}>
                                    {t.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-6 max-w-2xl mx-auto">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900" />
                    </div>
                ) : (
                    <>
                        {/* Friends List Tab */}
                        {tab === 'friends' && (
                            <div>
                                {friends.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-stone-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Users className="w-8 h-8 text-stone-400" />
                                        </div>
                                        <h3 className="text-lg font-medium text-stone-900 mb-2">No friends yet</h3>
                                        <p className="text-stone-500 mb-4">Find people to learn and compete with!</p>
                                        <button
                                            onClick={() => handleTabChange('search')}
                                            className="inline-flex items-center gap-2 bg-stone-900 text-white px-5 py-2.5 rounded-full font-medium hover:bg-stone-800 transition-colors text-sm"
                                        >
                                            <Search className="w-4 h-4" />
                                            Find People
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {friends.map(friend => (
                                            <div
                                                key={friend.id}
                                                className="bg-white rounded-xl border border-stone-200 p-4 flex items-center justify-between"
                                            >
                                                <div
                                                    className="flex items-center gap-3 flex-1 cursor-pointer"
                                                    onClick={() => navigate(`/friends/${friend.username}`)}
                                                >
                                                    <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                                        {friend.username[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-stone-900">@{friend.username}</p>
                                                        {friend.display_name && (
                                                            <p className="text-sm text-stone-500">{friend.display_name}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => navigate(`/challenges/new?opponent=${friend.username}`)}
                                                        className="p-2 bg-stone-100 rounded-lg hover:bg-stone-200 transition-colors text-stone-600"
                                                        title="Challenge"
                                                    >
                                                        <Swords className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveFriend(friend)}
                                                        disabled={actionLoading === friend.friendship_id}
                                                        className="p-2 hover:bg-red-50 rounded-lg transition-colors text-stone-400 hover:text-red-500"
                                                        title="Remove friend"
                                                    >
                                                        <UserMinus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Friend Requests Tab */}
                        {tab === 'requests' && (
                            <div>
                                {requests.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-stone-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <UserPlus className="w-8 h-8 text-stone-400" />
                                        </div>
                                        <h3 className="text-lg font-medium text-stone-900 mb-2">No pending requests</h3>
                                        <p className="text-stone-500">When someone sends you a friend request, it&apos;ll appear here.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {requests.map(request => (
                                            <div
                                                key={request.friendship_id}
                                                className="bg-white rounded-xl border border-stone-200 p-4 flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold">
                                                        {request.username[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-stone-900">@{request.username}</p>
                                                        {request.display_name && (
                                                            <p className="text-sm text-stone-500">{request.display_name}</p>
                                                        )}
                                                        <p className="text-xs text-stone-400">Wants to be your friend</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleAcceptRequest(request)}
                                                        disabled={actionLoading === request.friendship_id}
                                                        className="flex items-center gap-1 px-3 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors disabled:opacity-50"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeclineRequest(request)}
                                                        disabled={actionLoading === request.friendship_id + '-decline'}
                                                        className="p-2 bg-stone-100 rounded-lg hover:bg-red-50 transition-colors text-stone-500 hover:text-red-500 disabled:opacity-50"
                                                        title="Decline"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Search Tab */}
                        {tab === 'search' && (
                            <div>
                                <div className="relative mb-6">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        placeholder="Search by @username..."
                                        autoFocus
                                        className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-stone-200 focus:border-stone-400 focus:bg-white outline-none transition-all"
                                    />
                                </div>

                                {searching ? (
                                    <div className="flex justify-center py-8">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-stone-900" />
                                    </div>
                                ) : searchResults.length > 0 ? (
                                    <div className="space-y-3">
                                        {searchResults.map(user => (
                                            <div
                                                key={user.id}
                                                className="bg-white rounded-xl border border-stone-200 p-4 flex items-center justify-between"
                                            >
                                                <div
                                                    className="flex items-center gap-3 flex-1 cursor-pointer"
                                                    onClick={() => navigate(`/friends/${user.username}`)}
                                                >
                                                    <div className="w-11 h-11 bg-gradient-to-br from-stone-600 to-stone-800 rounded-full flex items-center justify-center text-white font-semibold">
                                                        {user.username[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-stone-900">@{user.username}</p>
                                                        {user.display_name && (
                                                            <p className="text-sm text-stone-500">{user.display_name}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {user.friendStatus === 'accepted' ? (
                                                        <span className="text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full font-medium">Friends</span>
                                                    ) : user.friendStatus === 'pending' ? (
                                                        <span className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full font-medium">Pending</span>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleAddFriend(user)}
                                                            disabled={actionLoading === user.id}
                                                            className="flex items-center gap-1 px-3 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors disabled:opacity-50"
                                                        >
                                                            <UserPlus className="w-4 h-4" />
                                                            Add
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => navigate(`/challenges/new?opponent=${user.username}`)}
                                                        className="p-2 bg-stone-100 rounded-lg hover:bg-stone-200 transition-colors text-stone-600"
                                                        title="Challenge"
                                                    >
                                                        <Swords className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : searchQuery.length >= 2 ? (
                                    <div className="text-center py-8 text-stone-500">
                                        No users found matching &quot;{searchQuery}&quot;
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Search className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                                        <p className="text-sm text-stone-400">Type at least 2 characters to search</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Invite to App Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
                        <div className="flex items-center justify-between p-4 border-b border-stone-100">
                            <h3 className="font-semibold text-stone-900">Invite Friends to CraftMaxxing</h3>
                            <button
                                onClick={() => setShowInviteModal(false)}
                                className="p-1.5 hover:bg-stone-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <p className="text-sm text-stone-600">
                                Share this link with friends so they can join CraftMaxxing and compete with you!
                            </p>
                            <div className="flex items-center gap-2 bg-stone-50 rounded-xl p-3 border border-stone-200">
                                <p className="text-sm text-stone-700 truncate flex-1">
                                    {window.location.origin}/signup?ref=friend
                                </p>
                                <button
                                    onClick={handleCopyInviteLink}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-medium hover:bg-stone-800 transition-colors flex-shrink-0"
                                >
                                    {inviteCopied ? (
                                        <><CheckCheck className="w-3.5 h-3.5" /> Copied</>
                                    ) : (
                                        <><Copy className="w-3.5 h-3.5" /> Copy</>
                                    )}
                                </button>
                            </div>
                            <button
                                onClick={handleShareInvite}
                                className="w-full flex items-center justify-center gap-2 bg-stone-100 text-stone-900 py-3 rounded-xl font-medium hover:bg-stone-200 transition-colors"
                            >
                                <Share2 className="w-4 h-4" />
                                Share via...
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}
