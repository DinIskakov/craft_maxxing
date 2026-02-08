import React, { useState, useMemo, useCallback, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Plus, Sparkles, User, Swords, Check, X, ChevronRight, Clock } from "lucide-react"
import { SkillBubble } from "@/components/skill-bubble.jsx"
import { useSkill } from "@/lib/skill-context.jsx"
import { PlanNavigation } from "@/components/plan-navigation.jsx"
import BottomNav from "@/components/BottomNav.jsx"
import NotificationBell from "@/components/NotificationBell.jsx"
import { useAuth } from "@/lib/auth-context.jsx"
import { challengeApi } from "@/lib/api.js"
import { markChallengeNotificationRead } from "@/lib/notification-sync.js"

function generateBubblePositions(count) {
  const positions = []
  const centerX = 50
  const centerY = 45
  const minRadius = 26
  const maxRadius = 38

  for (let i = 0; i < count; i++) {
    const angle = (i / Math.max(count, 1)) * 2 * Math.PI - Math.PI / 2
    const radius = minRadius + (i % 2) * (maxRadius - minRadius) * 0.5
    const x = centerX + radius * Math.cos(angle)
    const y = centerY + radius * Math.sin(angle)
    positions.push({ x: Math.max(12, Math.min(88, x)), y: Math.max(18, Math.min(75, y)) })
  }

  return positions
}

export default function SetupPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    skills, addSkill, removeSkill, activeSkill, setActiveSkill,
    hasActivePlan, getChallengeForSkill, giveUpSkill, syncChallenges,
  } = useSkill()
  const [inputValue, setInputValue] = useState("")
  const [pendingChallenge, setPendingChallenge] = useState(null)
  const [challengeActionLoading, setChallengeActionLoading] = useState(null)

  // Sync challenge skills when page loads (if authenticated)
  useEffect(() => {
    if (user) {
      syncChallenges()
      loadPendingChallenge()
    }
  }, [user, syncChallenges])

  const loadPendingChallenge = async () => {
    try {
      const data = await challengeApi.getMyChallenges("pending")
      // Filter to only incoming challenges (where I'm the opponent)
      const incoming = data.filter(item => item.challenge.opponent_id === user.id)
      if (incoming.length > 0) {
        setPendingChallenge(incoming[0]) // most recent
      }
    } catch {
      // silently fail
    }
  }

  const handleAcceptChallenge = async () => {
    if (!pendingChallenge) return
    setChallengeActionLoading("accept")
    try {
      const challengeId = pendingChallenge.challenge.id
      await challengeApi.respondToChallenge(challengeId, true)
      setPendingChallenge(null)
      syncChallenges()
      // Mark the notification as read and update the bell badge
      markChallengeNotificationRead(challengeId)
    } catch (err) {
      console.error("Failed to accept challenge:", err)
    }
    setChallengeActionLoading(null)
  }

  const handleDeclineChallenge = async () => {
    if (!pendingChallenge) return
    setChallengeActionLoading("decline")
    try {
      const challengeId = pendingChallenge.challenge.id
      await challengeApi.respondToChallenge(challengeId, false)
      setPendingChallenge(null)
      // Mark the notification as read and update the bell badge
      markChallengeNotificationRead(challengeId)
    } catch (err) {
      console.error("Failed to decline challenge:", err)
    }
    setChallengeActionLoading(null)
  }

  const formatResponseDeadline = (deadlineStr) => {
    if (!deadlineStr) return null
    const date = new Date(deadlineStr)
    const now = new Date()
    const diff = date - now
    const hours = Math.ceil(diff / (1000 * 60 * 60))
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    if (hours <= 0) return "Expiring soon"
    if (hours < 24) return `${hours}h to respond`
    return `${days}d to respond`
  }

  const positions = useMemo(
    () => generateBubblePositions(Math.max(skills.length, 6)),
    [skills.length]
  )

  const handleAddSkill = useCallback(() => {
    if (!user) {
      navigate("/login")
      return
    }
    const trimmed = inputValue.trim()
    if (trimmed && !skills.includes(trimmed)) {
      addSkill(trimmed)
      setInputValue("")
    }
  }, [inputValue, skills, addSkill, user, navigate])

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddSkill()
    }
  }

  const handleGeneratePlan = () => {
    if (!user) {
      navigate("/login")
      return
    }
    if (activeSkill) {
      navigate("/plan/loading")
    }
  }

  const handleBubbleClick = (skill) => {
    setActiveSkill(skill)
  }

  const handleProfileClick = () => {
    if (user) {
      navigate("/profile")
    } else {
      navigate("/login")
    }
  }

  const activeSkillHasPlan = activeSkill ? hasActivePlan(activeSkill) : false

  return (
    <main className="min-h-screen flex flex-col pb-32">
      {/* Header */}
      <header className="flex items-center justify-between p-4">
        <h1 className="text-lg font-serif text-stone-900 pl-2">
          {user ? "Your Skills" : "CraftMaxxing"}
        </h1>
        <div className="flex items-center gap-2">
          {user && <NotificationBell />}
          <button
            onClick={handleProfileClick}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-stone-100 hover:bg-stone-200 transition-colors"
          >
            <User className="w-5 h-5 text-stone-600" />
            {user ? (
              <span className="text-sm font-medium text-stone-700">Profile</span>
            ) : (
              <span className="text-sm font-medium text-stone-700">Sign In</span>
            )}
          </button>
        </div>
      </header>

      {/* Incoming Challenge Banner */}
      {user && pendingChallenge && (
        <div className="mx-4 mb-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
              {pendingChallenge.challenge.challenger?.username?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-stone-900 text-sm">
                @{pendingChallenge.challenge.challenger?.username} challenges you!
              </p>
              <p className="text-xs text-stone-600 mt-0.5">
                Learn <span className="font-semibold">{pendingChallenge.challenge.opponent_skill || pendingChallenge.challenge.challenger_skill}</span>
              </p>
              {pendingChallenge.challenge.message && (
                <p className="text-xs text-stone-500 italic mt-1">
                  &ldquo;{pendingChallenge.challenge.message}&rdquo;
                </p>
              )}
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleAcceptChallenge}
                  disabled={!!challengeActionLoading}
                  className="flex items-center gap-1 px-3.5 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-medium hover:bg-stone-800 transition-colors disabled:opacity-50"
                >
                  {challengeActionLoading === "accept" ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  Accept
                </button>
                <button
                  onClick={handleDeclineChallenge}
                  disabled={!!challengeActionLoading}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white border border-stone-200 text-stone-600 rounded-lg text-xs font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-50"
                >
                  {challengeActionLoading === "decline" ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-stone-400" />
                  ) : (
                    <X className="w-3.5 h-3.5" />
                  )}
                  Decline
                </button>
                {pendingChallenge.challenge.response_deadline && (
                  <span className="flex items-center gap-1 text-[10px] text-stone-400 ml-auto">
                    <Clock className="w-3 h-3" />
                    {formatResponseDeadline(pendingChallenge.challenge.response_deadline)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Link
            to="/challenges"
            className="flex items-center justify-center gap-1 mt-3 pt-3 border-t border-amber-200/60 text-xs text-stone-500 hover:text-stone-900 transition-colors"
          >
            See all challenges <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Bubble Canvas */}
      <div className="flex-1 relative overflow-hidden min-h-[55vh]">
        <div className="absolute inset-0">
          <SkillBubble isCenter name="Skills" />

          {skills.map((skill, index) => {
            const pos = positions[index] || { x: 50, y: 50 }
            const skillHasPlan = hasActivePlan(skill)
            const challengeInfo = getChallengeForSkill(skill)
            return (
              <div
                key={skill}
                className="animate-in fade-in zoom-in duration-500"
                style={{
                  position: "absolute",
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: "translate(-50%, -50%)",
                  zIndex: activeSkill === skill ? 10 : 1,
                }}
              >
                <SkillBubble
                  name={skill}
                  index={index}
                  isActive={activeSkill === skill}
                  hasPlan={skillHasPlan}
                  opponent={challengeInfo ? {
                    username: challengeInfo.opponentUsername,
                    displayName: challengeInfo.opponentDisplayName,
                    id: challengeInfo.opponentId,
                  } : null}
                  onClick={() => handleBubbleClick(skill)}
                  onRemove={challengeInfo
                    ? async () => {
                        if (confirm(`Give up on ${skill}? You'll be removed from the challenge.`)) {
                          await giveUpSkill(skill)
                        }
                      }
                    : () => removeSkill(skill)
                  }
                />
              </div>
            )
          })}
        </div>

        {skills.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center mt-48 px-8">
              <p className="text-muted-foreground animate-pulse">
                Add a skill below to begin
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Input Bar */}
      <div className="fixed bottom-16 left-0 right-0 bg-background/90 backdrop-blur-lg border-t border-border p-4 md:p-5">
        <div className="max-w-xl mx-auto flex flex-col gap-3">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type any skill you want to learn..."
              className="flex-1 px-5 py-3 rounded-full bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              disabled={!inputValue.trim()}
              className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {skills.length > 0 && activeSkill && !activeSkillHasPlan && (
            <button
              type="button"
              onClick={handleGeneratePlan}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-medium flex items-center justify-center gap-2 hover:shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <Sparkles className="w-5 h-5" />
              Generate 30-Day Plan for {activeSkill}
            </button>
          )}

          {skills.length > 0 && activeSkill && activeSkillHasPlan && (
            <button
              type="button"
              onClick={() => navigate("/plan/today")}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium flex items-center justify-center gap-2 hover:shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              Continue {activeSkill} Plan
            </button>
          )}
        </div>
      </div>

      {/* Conditional BottomNav: show main nav when authenticated, PlanNavigation otherwise */}
      {user ? <BottomNav /> : <PlanNavigation currentPage="skills" />}
    </main>
  )
}
