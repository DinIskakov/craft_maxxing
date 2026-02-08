import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { challengeApi } from "./api"
import { supabase } from "./supabase"

const SkillContext = createContext(undefined)

export function SkillProvider({ children }) {
  const [skills, setSkills] = useState([])
  const [activeSkill, setActiveSkill] = useState(null)
  const [plans, setPlans] = useState({})
  // Challenge skills synced from backend: { skillName: { challengeId, opponentUsername, opponentId, opponentDisplayName } }
  const [challengeSkills, setChallengeSkills] = useState({})
  const [challengesSynced, setChallengesSynced] = useState(false)

  // Sync active challenges from backend on mount (when authenticated)
  useEffect(() => {
    const checkAndSync = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        syncChallenges()
      }
    }
    checkAndSync()

    // Re-sync when auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          syncChallenges()
        } else {
          setChallengeSkills({})
          setChallengesSynced(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const syncChallenges = useCallback(async () => {
    try {
      const data = await challengeApi.getMyChallenges("active")
      const newChallengeSkills = {}

      for (const item of data) {
        const { challenge, my_progress } = item
        if (!my_progress) continue

        const skillName = my_progress.skill_name
        // Figure out who the opponent is
        const { data: { session } } = await supabase.auth.getSession()
        const myId = session?.user?.id
        const isChallenger = challenge.challenger_id === myId
        const opponent = isChallenger ? challenge.opponent : challenge.challenger

        newChallengeSkills[skillName] = {
          challengeId: challenge.id,
          opponentUsername: opponent?.username || "unknown",
          opponentId: opponent?.id,
          opponentDisplayName: opponent?.display_name || opponent?.username,
        }

        // Auto-add to skills list if not already there
        setSkills((prev) => {
          if (!prev.includes(skillName)) {
            return [...prev, skillName]
          }
          return prev
        })
      }

      setChallengeSkills(newChallengeSkills)
      setChallengesSynced(true)
    } catch (err) {
      console.error("Failed to sync challenges:", err)
      setChallengesSynced(true) // Mark as synced even on error to avoid blocking
    }
  }, [])

  const addSkill = (skill) => {
    if (!skills.includes(skill)) {
      setSkills((prev) => [...prev, skill])
      setActiveSkill(skill)
    }
  }

  const removeSkill = (skill) => {
    setSkills((prev) => prev.filter((s) => s !== skill))
    setPlans((prev) => {
      const newPlans = { ...prev }
      delete newPlans[skill]
      return newPlans
    })
    // If this was a challenge skill, remove from challengeSkills too
    if (challengeSkills[skill]) {
      setChallengeSkills((prev) => {
        const next = { ...prev }
        delete next[skill]
        return next
      })
    }
    if (activeSkill === skill) {
      const remaining = skills.filter((s) => s !== skill)
      setActiveSkill(remaining.length > 0 ? remaining[0] : null)
    }
  }

  const giveUpSkill = async (skill) => {
    const challenge = challengeSkills[skill]
    if (!challenge) return false
    try {
      await challengeApi.giveUpChallenge(challenge.challengeId)
      removeSkill(skill)
      return true
    } catch (err) {
      console.error("Failed to give up challenge:", err)
      return false
    }
  }

  const setPlanForSkill = (skillName, plan) => {
    setPlans((prev) => ({ ...prev, [skillName]: plan }))
  }

  const getActivePlan = () => {
    if (!activeSkill) return null
    return plans[activeSkill] || null
  }

  const hasActivePlan = (skillName) => {
    return !!plans[skillName]
  }

  const getChallengeForSkill = (skillName) => {
    return challengeSkills[skillName] || null
  }

  // Merged list of all skill names (standalone + challenge)
  const allSkillNames = skills

  const completeTask = (dayIndex, taskId) => {
    if (!activeSkill || !plans[activeSkill]) return
    setPlans((prev) => {
      const plan = prev[activeSkill]
      if (!plan) return prev
      const newDays = [...plan.days]
      const day = newDays[dayIndex]
      if (day) {
        newDays[dayIndex] = {
          ...day,
          tasks: day.tasks.map((task) =>
            task.id === taskId ? { ...task, completed: true } : task
          ),
        }
      }
      return { ...prev, [activeSkill]: { ...plan, days: newDays } }
    })
  }

  const submitFeedback = (dayIndex, feedback) => {
    if (!activeSkill || !plans[activeSkill]) return
    setPlans((prev) => {
      const plan = prev[activeSkill]
      if (!plan) return prev
      const newDays = [...plan.days]
      const day = newDays[dayIndex]
      if (day) {
        newDays[dayIndex] = { ...day, feedback, completed: true }
      }
      return { ...prev, [activeSkill]: { ...plan, days: newDays } }
    })
  }

  const completeDay = () => {
    if (!activeSkill || !plans[activeSkill]) return
    setPlans((prev) => {
      const plan = prev[activeSkill]
      if (!plan || plan.currentDay >= 30) return prev
      return { ...prev, [activeSkill]: { ...plan, currentDay: plan.currentDay + 1 } }
    })
  }

  return (
    <SkillContext.Provider
      value={{
        skills,
        allSkillNames,
        addSkill,
        removeSkill,
        activeSkill,
        setActiveSkill,
        plans,
        setPlanForSkill,
        getActivePlan,
        completeTask,
        submitFeedback,
        completeDay,
        hasActivePlan,
        challengeSkills,
        getChallengeForSkill,
        giveUpSkill,
        syncChallenges,
        challengesSynced,
      }}
    >
      {children}
    </SkillContext.Provider>
  )
}

export function useSkill() {
  const context = useContext(SkillContext)
  if (context === undefined) {
    throw new Error("useSkill must be used within a SkillProvider")
  }
  return context
}
