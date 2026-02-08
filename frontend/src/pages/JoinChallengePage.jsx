import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Swords, Clock, User, AlertCircle } from 'lucide-react'
import { challengeLinksApi } from '../lib/api'
import { useAuth } from '../lib/auth-context'

export default function JoinChallengePage() {
    const { code } = useParams()
    const [linkData, setLinkData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [accepting, setAccepting] = useState(false)
    const navigate = useNavigate()
    const { user } = useAuth()

    useEffect(() => {
        loadLink()
    }, [code])

    const loadLink = async () => {
        try {
            const data = await challengeLinksApi.getInviteLink(code)
            setLinkData(data)
        } catch (err) {
            setError(err.message || 'Invalid or expired challenge link')
        }
        setLoading(false)
    }

    const handleAccept = async () => {
        if (!user) {
            // Redirect to signup with return URL
            navigate(`/signup?redirect=/challenges/join/${code}`)
            return
        }

        setAccepting(true)
        try {
            const result = await challengeLinksApi.acceptInviteLink(code)
            navigate('/challenges')
        } catch (err) {
            setError(err.message)
        }
        setAccepting(false)
    }

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'long', day: 'numeric', year: 'numeric'
        })
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-stone-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-stone-100 flex items-center justify-center p-6">
                <div className="bg-white rounded-2xl border border-stone-200 p-8 max-w-sm w-full text-center">
                    <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-7 h-7 text-red-500" />
                    </div>
                    <h2 className="text-lg font-semibold text-stone-900 mb-2">Link unavailable</h2>
                    <p className="text-sm text-stone-500 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/challenges')}
                        className="bg-stone-900 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-stone-800 transition-colors text-sm"
                    >
                        Go to Challenges
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-stone-100 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl border border-stone-200 p-8 max-w-sm w-full">
                <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Swords className="w-7 h-7 text-amber-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-stone-900">You&apos;ve been challenged!</h2>
                </div>

                <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 bg-stone-50 rounded-xl p-3">
                        <User className="w-5 h-5 text-stone-400" />
                        <div>
                            <p className="text-xs text-stone-500">From</p>
                            <p className="font-medium text-stone-900">@{linkData?.creator?.username}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-stone-50 rounded-xl p-3">
                        <Swords className="w-5 h-5 text-stone-400" />
                        <div>
                            <p className="text-xs text-stone-500">Skill</p>
                            <p className="font-medium text-stone-900">{linkData?.skill}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-stone-50 rounded-xl p-3">
                        <Clock className="w-5 h-5 text-stone-400" />
                        <div>
                            <p className="text-xs text-stone-500">Deadline</p>
                            <p className="font-medium text-stone-900">{formatDate(linkData?.deadline)}</p>
                        </div>
                    </div>
                    {linkData?.message && (
                        <div className="bg-stone-50 rounded-xl p-3">
                            <p className="text-xs text-stone-500 mb-1">Message</p>
                            <p className="text-sm text-stone-700">&ldquo;{linkData.message}&rdquo;</p>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleAccept}
                    disabled={accepting}
                    className="w-full flex items-center justify-center gap-2 bg-stone-900 text-white py-3 rounded-xl font-medium hover:bg-stone-800 transition-colors disabled:opacity-50"
                >
                    {accepting ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    ) : (
                        <>
                            <Swords className="w-5 h-5" />
                            {user ? 'Accept Challenge' : 'Sign Up to Accept'}
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}
