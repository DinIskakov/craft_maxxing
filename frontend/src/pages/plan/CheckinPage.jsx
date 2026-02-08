import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useSkill } from "@/lib/skill-context.jsx"
import { challengeApi } from "@/lib/api.js"
import { Smile, Meh, Frown, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils.js"
import { Suspense } from "react"
import Loading from "./CheckinLoading.jsx"

const feedbackOptions = [
  { value: "easy", icon: Smile, label: "Easy", color: "text-green-500" },
  { value: "okay", icon: Meh, label: "Okay", color: "text-amber-500" },
  { value: "hard", icon: Frown, label: "Hard", color: "text-red-500" },
]

export default function CheckinPage() {
  const navigate = useNavigate()
  const { getActivePlan, submitFeedback, completeDay, getChallengeForSkill, activeSkill } = useSkill()
  const plan = getActivePlan()
  const [selected, setSelected] = useState(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const challengeInfo = activeSkill ? getChallengeForSkill(activeSkill) : null

  useEffect(() => {
    if (!plan) {
      navigate("/setup", { replace: true })
    }
  }, [plan, navigate])

  if (!plan) return null

  const currentDayIndex = plan.currentDay - 1

  const handleSubmit = async () => {
    if (!selected) return

    setIsUpdating(true)

    // If this skill is from a challenge, also sync with backend
    if (challengeInfo?.challengeId) {
      try {
        await challengeApi.dailyCheckin(
          challengeInfo.challengeId,
          true,
          `Feedback: ${selected}`
        )
      } catch (err) {
        console.error("Failed to sync challenge checkin:", err)
        // Continue with local update even if backend fails
      }
    } else {
      // Simulate AI updating the plan for non-challenge skills
      await new Promise((resolve) => setTimeout(resolve, 1500))
    }

    submitFeedback(currentDayIndex, selected)
    completeDay()

    // Check if we completed day 30
    if (plan.currentDay >= 30) {
      navigate("/profile")
    } else {
      navigate("/plan/today")
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <Suspense fallback={<Loading />}>
          {!isUpdating ? (
            <>
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
                  How did today feel?
                </h1>
                <p className="text-muted-foreground mb-10">
                  Your feedback helps us adjust tomorrow&apos;s plan
                </p>
              </div>

              {/* Feedback Options */}
              <div className="flex justify-center gap-4 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                {feedbackOptions.map((option) => {
                  const Icon = option.icon
                  const isSelected = selected === option.value

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSelected(option.value)}
                      className={cn(
                        "flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all",
                        isSelected
                          ? "border-primary bg-primary/5 scale-105"
                          : "border-border bg-card hover:border-muted-foreground"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-10 h-10 transition-colors",
                          isSelected ? option.color : "text-muted-foreground"
                        )}
                      />
                      <span
                        className={cn(
                          "text-sm font-medium transition-colors",
                          isSelected ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {option.label}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!selected}
                className={cn(
                  "px-8 py-4 rounded-full text-lg font-medium transition-all animate-in fade-in duration-700 delay-300",
                  selected
                    ? "bg-primary text-primary-foreground hover:shadow-lg"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                Update Plan
              </button>
            </>
          ) : (
            <div className="animate-in fade-in duration-500">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-primary animate-pulse" />
              </div>
              <h2 className="font-serif text-2xl text-foreground mb-2">
                {challengeInfo ? "Syncing progress" : "Adjusting your plan"}
              </h2>
              <p className="text-muted-foreground">
                {challengeInfo
                  ? "Recording your check-in and updating your challenge..."
                  : "Making tomorrow just right for you..."}
              </p>
            </div>
          )}
        </Suspense>
      </div>
    </main>
  )
}
