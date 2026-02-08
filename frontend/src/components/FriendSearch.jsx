import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, UserPlus, Swords, X } from 'lucide-react'
import { profileApi, friendsApi } from '../lib/api'

export default function FriendSearch({ onClose }) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState([])
    const [searching, setSearching] = useState(false)
    const [addingFriend, setAddingFriend] = useState(null)
    const navigate = useNavigate()

    const handleSearch = async (value) => {
        setQuery(value)
        if (value.length < 2) {
            setResults([])
            return
        }

        setSearching(true)
        try {
            const users = await profileApi.searchUsers(value.replace('@', ''))
            setResults(users)
        } catch {
            setResults([])
        }
        setSearching(false)
    }

    const handleAddFriend = async (user) => {
        setAddingFriend(user.id)
        try {
            await friendsApi.addFriend(user.id)
            // Update the UI to show friend added
            setResults(prev => prev.map(u =>
                u.id === user.id ? { ...u, friendStatus: 'pending' } : u
            ))
        } catch (err) {
            console.error('Failed to add friend:', err)
        }
        setAddingFriend(null)
    }

    const handleChallenge = (user) => {
        navigate(`/challenges/new?opponent=${user.username}`)
        onClose?.()
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20">
            <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-stone-200">
                    <h2 className="text-lg font-semibold text-stone-900">Find Friends</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-stone-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search Input */}
                <div className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Search by @username..."
                            autoFocus
                            className="w-full pl-10 pr-4 py-3 bg-stone-50 rounded-xl border border-stone-200 focus:border-stone-400 focus:bg-white outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Results */}
                <div className="max-h-80 overflow-y-auto">
                    {searching ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-stone-900" />
                        </div>
                    ) : results.length > 0 ? (
                        <div className="pb-4">
                            {results.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-center justify-between px-4 py-3 hover:bg-stone-50"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-stone-600 to-stone-800 rounded-full flex items-center justify-center text-white font-medium">
                                            {user.username[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-stone-900">@{user.username}</p>
                                            {user.display_name && (
                                                <p className="text-sm text-stone-500">{user.display_name}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {user.friendStatus === 'accepted' ? (
                                            <span className="text-xs text-stone-500 px-2 py-1">Friends</span>
                                        ) : user.friendStatus === 'pending' ? (
                                            <span className="text-xs text-stone-500 px-2 py-1">Pending</span>
                                        ) : (
                                            <button
                                                onClick={() => handleAddFriend(user)}
                                                disabled={addingFriend === user.id}
                                                className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                                                title="Add Friend"
                                            >
                                                <UserPlus className="w-5 h-5 text-stone-600" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleChallenge(user)}
                                            className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                                            title="Challenge"
                                        >
                                            <Swords className="w-5 h-5 text-stone-600" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : query.length >= 2 ? (
                        <div className="text-center py-8 text-stone-500">
                            No users found
                        </div>
                    ) : (
                        <div className="text-center py-8 text-stone-400">
                            Type at least 2 characters to search
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
