import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useSkill } from "@/lib/skill-context.jsx"
import { ArrowRight, Target } from "lucide-react"
import { PlanNavigation } from "@/components/plan-navigation.jsx"

export default function PlanOverviewPage() {
  const navigate = useNavigate()
  const { getActivePlan } = useSkill()
  const plan = getActivePlan()

  useEffect(() => {
    if (!plan) {
      navigate("/setup", { replace: true })
    }
  }, [plan, navigate])

  if (!plan) return null

  const weeks = [
    { days: plan.days.slice(0, 7), label: "Week 1" },
    { days: plan.days.slice(7, 14), label: "Week 2" },
    { days: plan.days.slice(14, 21), label: "Week 3" },
    { days: plan.days.slice(21, 28), label: "Week 4" },
    { days: plan.days.slice(28, 30), label: "Final" },
  ]

  return (
    <main className="min-h-screen px-6 py-12 pb-32">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-4 text-balance">
            {plan.skillName}
          </h1>
          <p className="text-muted-foreground text-lg">
            Your 30-day learning journey
          </p>
        </div>

        {/* Weekly Milestones */}
        <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Weekly Milestones
          </h2>
          <div className="space-y-3">
            {plan.weeklyMilestones.map((milestone) => (
              <div
                key={`${milestone.week}-${milestone.goal}`}
                className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border"
              >
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-medium text-foreground">
                  {milestone.week}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{milestone.goal}</p>
                  <p className="text-sm text-muted-foreground">
                    Days {(milestone.week - 1) * 7 + 1} - {Math.min(milestone.week * 7, 30)}
                  </p>
                </div>
                <Target className="w-5 h-5 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Grid */}
        <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            30-Day Timeline
          </h2>
          <div className="space-y-4">
            {weeks.map((week) => (
              <div key={week.label} className="flex items-center gap-3">
                <span className="text-xs font-medium text-muted-foreground w-14">
                  {week.label}
                </span>
                <div className="flex gap-1.5 flex-1">
                  {week.days.map((day) => {
                    const isToday = day.day === plan.currentDay
                    const isCompleted = day.completed

                    return (
                      <div
                        key={day.day}
                        className={`flex-1 h-10 rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                          isToday
                            ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background"
                            : isCompleted
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {day.day}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 text-sm text-muted-foreground mb-8 animate-in fade-in duration-700 delay-500">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary" />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary/20" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-muted" />
            <span>Upcoming</span>
          </div>
        </div>
      </div>

      {/* Fixed CTA */}
      <div className="fixed bottom-24 left-0 right-0 flex justify-center px-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
        <button
          type="button"
          onClick={() => navigate("/plan/today")}
          className="group flex items-center gap-3 bg-primary text-primary-foreground px-8 py-4 rounded-full text-lg font-medium transition-all hover:gap-5 hover:shadow-lg"
        >
          Start Today
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      <PlanNavigation currentPage="plan" />
    </main>
  )
}
