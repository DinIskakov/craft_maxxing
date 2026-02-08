import { useEffect, useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { useSkill } from "@/lib/skill-context.jsx"
import { Check, ChevronRight, AlertCircle, Swords, Flag } from "lucide-react"
import { cn } from "@/lib/utils.js"

export default function TodayPage() {
  const navigate = useNavigate()
  const { getActivePlan, completeTask, getChallengeForSkill, giveUpSkill, activeSkill, removeSkill } = useSkill()
  const plan = getActivePlan()
  const [showStruggleOption, setShowStruggleOption] = useState(false)
  const [showGiveUp, setShowGiveUp] = useState(false)
  const [givingUp, setGivingUp] = useState(false)

  const challengeInfo = activeSkill ? getChallengeForSkill(activeSkill) : null

  useEffect(() => {
    if (!plan) {
      navigate("/setup", { replace: true })
    }
  }, [plan, navigate])

  if (!plan) return null

  const currentDayIndex = plan.currentDay - 1
  const currentDay = plan.days[currentDayIndex]

  if (!currentDay) {
    return <Navigate to="/plan/overview" replace />
  }

  const allTasksCompleted = currentDay.tasks.every((task) => task.completed)

  const handleCompleteDay = () => {
    navigate("/plan/checkin")
  }

  const handleStruggle = () => {
    navigate("/plan/checkin?struggled=true")
  }

  return (
    <main className="min-h-screen px-6 py-12 pb-48">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
            {plan.skillName}
          </p>
          <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-2">
            Day {plan.currentDay} of 30
          </h1>

          {/* Opponent badge for challenge skills */}
          {challengeInfo && (
            <button
              type="button"
              onClick={() => navigate(`/friends/${challengeInfo.opponentUsername}`)}
              className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 rounded-full transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold">
                {challengeInfo.opponentUsername?.[0]?.toUpperCase() || '?'}
              </div>
              <Swords className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-sm font-medium text-indigo-700">
                vs @{challengeInfo.opponentUsername}
              </span>
            </button>
          )}

          <div className="w-full bg-muted rounded-full h-1.5 mt-6">
            <div
              className="bg-primary h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${(plan.currentDay / 30) * 100}%` }}
            />
          </div>
        </div>

        {/* Task Cards */}
        <div className="space-y-4 mb-8">
          {currentDay.tasks.map((task, index) => (
            <div
              key={task.id}
              className={cn(
                "p-5 rounded-2xl border transition-all duration-300 animate-in fade-in slide-in-from-bottom-4",
                task.completed
                  ? "bg-primary/5 border-primary/20"
                  : "bg-card border-border hover:border-muted-foreground"
              )}
              style={{ animationDelay: `${index * 100 + 150}ms` }}
            >
              <div className="flex items-start gap-4">
                <button
                  type="button"
                  onClick={() => completeTask(currentDayIndex, task.id)}
                  disabled={task.completed}
                  className={cn(
                    "mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0",
                    task.completed
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-border hover:border-primary"
                  )}
                >
                  {task.completed && <Check className="w-4 h-4" />}
                </button>
                <div className="flex-1 min-w-0">
                  <h3
                    className={cn(
                      "font-medium text-lg mb-1 transition-all",
                      task.completed ? "text-muted-foreground line-through" : "text-foreground"
                    )}
                  >
                    {task.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {task.instruction}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Struggle Option */}
        {!showStruggleOption && !allTasksCompleted && (
          <button
            type="button"
            onClick={() => setShowStruggleOption(true)}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2 animate-in fade-in duration-700 delay-500"
          >
            Having a tough day?
          </button>
        )}

        {showStruggleOption && !allTasksCompleted && (
          <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-accent mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-foreground mb-3">
                  It is okay to have difficult days. Let us adjust tomorrow is plan to be lighter.
                </p>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={handleStruggle}
                    className="text-sm font-medium text-accent hover:underline"
                  >
                    I struggled today
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowGiveUp(true)}
                    className="text-sm font-medium text-red-400 hover:text-red-600 transition-colors"
                  >
                    Give up this skill
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Give up confirmation */}
        {showGiveUp && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 animate-in fade-in slide-in-from-bottom-2 duration-300 mt-4">
            <div className="flex items-start gap-3">
              <Flag className="w-5 h-5 text-red-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 mb-1">
                  Are you sure you want to give up?
                </p>
                <p className="text-xs text-red-600 mb-3">
                  {challengeInfo
                    ? "You'll be removed from the challenge. Your opponent can continue on their own."
                    : "Your plan and progress for this skill will be removed."}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={givingUp}
                    onClick={async () => {
                      setGivingUp(true)
                      if (challengeInfo) {
                        await giveUpSkill(plan.skillName)
                      } else {
                        removeSkill(plan.skillName)
                      }
                      setGivingUp(false)
                      navigate("/setup")
                    }}
                    className="px-4 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {givingUp ? "Giving up..." : "Yes, give up"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowGiveUp(false)}
                    className="px-4 py-1.5 bg-white text-stone-600 text-sm font-medium rounded-lg border border-stone-200 hover:bg-stone-50 transition-colors"
                  >
                    Keep going
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-24 left-0 right-0 flex justify-center px-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
        <button
          type="button"
          onClick={handleCompleteDay}
          disabled={!allTasksCompleted}
          className={cn(
            "group flex items-center gap-3 px-8 py-4 rounded-full text-lg font-medium transition-all",
            allTasksCompleted
              ? "bg-primary text-primary-foreground hover:gap-5 hover:shadow-lg"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          Complete Day
          <ChevronRight
            className={cn(
              "w-5 h-5 transition-transform",
              allTasksCompleted && "group-hover:translate-x-1"
            )}
          />
        </button>
      </div>

    </main>
  )
}
