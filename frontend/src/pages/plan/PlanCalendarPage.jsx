import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useSkill } from "@/lib/skill-context.jsx"
import {
  ArrowLeft, Check, Smile, Meh, Frown, Lock,
  Target, Trophy, ChevronDown, ChevronUp, Swords
} from "lucide-react"
import { cn } from "@/lib/utils.js"

const FEEDBACK_ICONS = {
  easy: { icon: Smile, color: "text-green-500", bg: "bg-green-50", label: "Easy" },
  okay: { icon: Meh, color: "text-amber-500", bg: "bg-amber-50", label: "Okay" },
  hard: { icon: Frown, color: "text-red-500", bg: "bg-red-50", label: "Hard" },
}

export default function PlanCalendarPage() {
  const navigate = useNavigate()
  const { getActivePlan, activeSkill, getChallengeForSkill } = useSkill()
  const plan = getActivePlan()
  const [expandedDay, setExpandedDay] = useState(null)

  const challengeInfo = activeSkill ? getChallengeForSkill(activeSkill) : null

  useEffect(() => {
    if (!plan) {
      navigate("/setup", { replace: true })
    }
  }, [plan, navigate])

  if (!plan) return null

  const completedDays = plan.days.filter(d => d.completed).length
  const percentage = Math.round((completedDays / 30) * 100)

  const weeks = [
    { days: plan.days.slice(0, 7), label: "Week 1", milestone: plan.weeklyMilestones?.[0] },
    { days: plan.days.slice(7, 14), label: "Week 2", milestone: plan.weeklyMilestones?.[1] },
    { days: plan.days.slice(14, 21), label: "Week 3", milestone: plan.weeklyMilestones?.[2] },
    { days: plan.days.slice(21, 28), label: "Week 4", milestone: plan.weeklyMilestones?.[3] },
    { days: plan.days.slice(28, 30), label: "Final", milestone: plan.weeklyMilestones?.[4] },
  ]

  const getDayStatus = (day) => {
    if (day.day === plan.currentDay) return "today"
    if (day.completed) return "completed"
    if (day.day < plan.currentDay) return "missed"
    return "upcoming"
  }

  const toggleDay = (dayNum) => {
    setExpandedDay(expandedDay === dayNum ? null : dayNum)
  }

  return (
    <main className="min-h-screen bg-stone-50 pb-32">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate("/plan/today")}
            className="p-2 -ml-2 hover:bg-stone-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-medium text-stone-900">{plan.skillName}</h1>
            <p className="text-xs text-stone-500">30-Day Journey</p>
          </div>
          {challengeInfo && (
            <button
              onClick={() => navigate(`/friends/${challengeInfo.opponentUsername}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 rounded-full"
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[8px] font-bold">
                {challengeInfo.opponentUsername?.[0]?.toUpperCase()}
              </div>
              <Swords className="w-3 h-3 text-indigo-400" />
              <span className="text-xs font-medium text-indigo-700">@{challengeInfo.opponentUsername}</span>
            </button>
          )}
        </div>
      </header>

      <div className="px-6 py-6 max-w-2xl mx-auto">
        {/* Progress Overview */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-2xl font-bold text-stone-900">{percentage}%</p>
              <p className="text-sm text-stone-500">
                Day {plan.currentDay} of 30 &middot; {completedDays} completed
              </p>
            </div>
            {completedDays >= 30 && (
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <Trophy className="w-6 h-6 text-amber-600" />
              </div>
            )}
          </div>
          <div className="w-full bg-stone-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Feedback summary */}
          <div className="flex gap-4 mt-4 pt-4 border-t border-stone-100">
            {Object.entries(FEEDBACK_ICONS).map(([key, { icon: Icon, color, label }]) => {
              const count = plan.days.filter(d => d.feedback === key).length
              return (
                <div key={key} className="flex items-center gap-1.5">
                  <Icon className={cn("w-4 h-4", color)} />
                  <span className="text-sm text-stone-600">
                    <span className="font-semibold text-stone-900">{count}</span> {label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Calendar Grid by Week */}
        <div className="space-y-4">
          {weeks.map((week) => (
            <div key={week.label} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              {/* Week header with milestone */}
              <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-stone-900">{week.label}</span>
                  {week.milestone && (
                    <span className="text-xs text-stone-500 flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {week.milestone.goal}
                    </span>
                  )}
                </div>
                <span className="text-xs text-stone-400">
                  {week.days.filter(d => d.completed).length}/{week.days.length} done
                </span>
              </div>

              {/* Day cells */}
              <div className="p-3">
                <div className="grid grid-cols-7 gap-1.5 mb-1">
                  {["M", "T", "W", "T", "F", "S", "S"].slice(0, week.days.length).map((d, i) => (
                    <span key={i} className="text-[10px] text-stone-400 text-center font-medium">
                      {d}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {week.days.map((day) => {
                    const status = getDayStatus(day)
                    const feedback = day.feedback ? FEEDBACK_ICONS[day.feedback] : null
                    const isExpanded = expandedDay === day.day

                    return (
                      <button
                        key={day.day}
                        onClick={() => toggleDay(day.day)}
                        className={cn(
                          "relative aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-medium transition-all",
                          status === "today" && "bg-stone-900 text-white ring-2 ring-stone-900 ring-offset-1",
                          status === "completed" && "bg-emerald-100 text-emerald-800",
                          status === "missed" && "bg-red-50 text-red-400",
                          status === "upcoming" && "bg-stone-100 text-stone-400",
                          isExpanded && "ring-2 ring-stone-400"
                        )}
                      >
                        <span>{day.day}</span>
                        {status === "completed" && (
                          <Check className="w-3 h-3 mt-0.5" />
                        )}
                        {status === "upcoming" && (
                          <Lock className="w-2.5 h-2.5 mt-0.5 opacity-40" />
                        )}
                        {feedback && (
                          <feedback.icon className={cn("w-3 h-3 mt-0.5", feedback.color)} />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Expanded day detail */}
              {week.days.map((day) => {
                if (expandedDay !== day.day) return null
                const status = getDayStatus(day)
                const feedback = day.feedback ? FEEDBACK_ICONS[day.feedback] : null

                return (
                  <div
                    key={`detail-${day.day}`}
                    className="px-4 py-3 border-t border-stone-100 bg-stone-50 animate-in fade-in slide-in-from-top-1 duration-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-stone-900">Day {day.day}</p>
                      <div className="flex items-center gap-2">
                        {feedback && (
                          <span className={cn("flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full", feedback.bg, feedback.color)}>
                            <feedback.icon className="w-3 h-3" />
                            {feedback.label}
                          </span>
                        )}
                        {status === "today" && (
                          <span className="text-xs bg-stone-900 text-white px-2 py-0.5 rounded-full font-medium">
                            Today
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Daily Plan - Tasks */}
                    {day.tasks && day.tasks.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-xs text-stone-400 uppercase tracking-wide font-medium">Daily Plan</p>
                        {day.tasks.map((task, idx) => (
                          <div key={task.id || idx} className="bg-white rounded-lg p-3 border border-stone-200">
                            <div className="flex items-start gap-2 mb-1.5">
                              <div className={cn(
                                "w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5",
                                task.completed
                                  ? "bg-emerald-500 border-emerald-500 text-white"
                                  : "border-stone-300"
                              )}>
                                {task.completed && <Check className="w-2.5 h-2.5" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={cn(
                                  "text-sm font-medium",
                                  task.completed ? "text-stone-500 line-through" : "text-stone-800"
                                )}>
                                  {task.title}
                                </p>
                                {task.instruction && (
                                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                                    {task.instruction}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-stone-400">
                        {status === "upcoming" ? "Tasks will unlock when you reach this day" : "No tasks recorded"}
                      </p>
                    )}

                    {status === "today" && (
                      <button
                        onClick={() => navigate("/plan/today")}
                        className="mt-3 w-full py-2 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800 transition-colors"
                      >
                        Go to Today&apos;s Tasks
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-6 text-xs text-stone-500">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-stone-900" />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-emerald-100" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-red-50" />
            <span>Missed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-stone-100" />
            <span>Upcoming</span>
          </div>
        </div>
      </div>
    </main>
  )
}
