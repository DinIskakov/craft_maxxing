import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useSkill } from "@/lib/skill-context.jsx"
import { Trophy, TrendingUp, Target, ArrowRight } from "lucide-react"

export default function ProgressPage() {
  const navigate = useNavigate()
  const { getActivePlan } = useSkill()
  const plan = getActivePlan()

  useEffect(() => {
    if (!plan) {
      navigate("/setup", { replace: true })
    }
  }, [plan, navigate])

  if (!plan) return null

  const completedDays = plan.days.filter((d) => d.completed).length
  const easyDays = plan.days.filter((d) => d.feedback === "easy").length
  const okayDays = plan.days.filter((d) => d.feedback === "okay").length
  const hardDays = plan.days.filter((d) => d.feedback === "hard").length
  const totalFeedback = easyDays + okayDays + hardDays

  // Calculate confidence trend (simple weighted average)
  const confidenceScore = totalFeedback > 0
    ? Math.round(((easyDays * 100 + okayDays * 70 + hardDays * 40) / totalFeedback))
    : 0

  // Find current week milestone
  const currentWeek = Math.ceil(plan.currentDay / 7)
  const nextMilestone = plan.weeklyMilestones[Math.min(currentWeek - 1, plan.weeklyMilestones.length - 1)]

  const isComplete = completedDays >= 30

  return (
    <main className="min-h-screen px-6 py-12 pb-32">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
            {plan.skillName}
          </p>
          <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-2">
            {isComplete ? "Journey Complete!" : "Your Progress"}
          </h1>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-6 rounded-2xl bg-card border border-border animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            <p className="text-3xl font-serif text-foreground mb-1">{completedDays}</p>
            <p className="text-sm text-muted-foreground">Days Completed</p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
            <p className="text-3xl font-serif text-foreground mb-1">{confidenceScore}%</p>
            <p className="text-sm text-muted-foreground">Confidence</p>
          </div>
        </div>

        {/* Feedback Breakdown */}
        {totalFeedback > 0 && (
          <div className="p-6 rounded-2xl bg-card border border-border mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
              How Your Days Felt
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden flex">
                {easyDays > 0 && (
                  <div
                    className="bg-green-500 h-full transition-all"
                    style={{ width: `${(easyDays / totalFeedback) * 100}%` }}
                  />
                )}
                {okayDays > 0 && (
                  <div
                    className="bg-amber-500 h-full transition-all"
                    style={{ width: `${(okayDays / totalFeedback) * 100}%` }}
                  />
                )}
                {hardDays > 0 && (
                  <div
                    className="bg-red-500 h-full transition-all"
                    style={{ width: `${(hardDays / totalFeedback) * 100}%` }}
                  />
                )}
              </div>
            </div>
            <div className="flex justify-between mt-3 text-sm">
              <span className="text-green-500">{easyDays} Easy</span>
              <span className="text-amber-500">{okayDays} Okay</span>
              <span className="text-red-500">{hardDays} Hard</span>
            </div>
          </div>
        )}

        {/* Next Milestone */}
        {!isComplete && nextMilestone && (
          <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Next Milestone
                </p>
                <p className="text-lg font-medium text-foreground">{nextMilestone.goal}</p>
              </div>
            </div>
          </div>
        )}

        {/* Completion Message */}
        {isComplete && (
          <div className="text-center p-8 rounded-2xl bg-primary/5 border border-primary/20 animate-in fade-in zoom-in duration-700 delay-400">
            <Trophy className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="font-serif text-2xl text-foreground mb-2">
              Congratulations!
            </h2>
            <p className="text-muted-foreground mb-6">
              You have completed your 30-day journey with {plan.skillName}. Keep practicing to maintain your new skills!
            </p>
            <button
              type="button"
              onClick={() => navigate("/setup")}
              className="group inline-flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all"
            >
              Start a new skill
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

    </main>
  )
}
