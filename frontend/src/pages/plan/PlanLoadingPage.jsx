import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useSkill } from "@/lib/skill-context.jsx"
import { Compass, Layers, ListChecks } from "lucide-react"

const steps = [
  { icon: Compass, label: "Finding a guide" },
  { icon: Layers, label: "Structuring the skill" },
  { icon: ListChecks, label: "Creating daily tasks" },
]

function generateMockPlan(skillName) {
  const milestones = [
    { week: 1, goal: "Foundation & Basics" },
    { week: 2, goal: "Building Core Skills" },
    { week: 3, goal: "Advanced Techniques" },
    { week: 4, goal: "Mastery & Application" },
  ]

  const taskTemplates = [
    ["Learn the fundamentals", "Practice basic exercises", "Review key concepts"],
    ["Apply what you learned", "Challenge yourself", "Reflect on progress"],
    ["Explore advanced topics", "Combine techniques", "Create something new"],
  ]

  const days = Array.from({ length: 30 }, (_, i) => {
    const weekIndex = Math.floor(i / 7)
    const templates = taskTemplates[Math.min(weekIndex, taskTemplates.length - 1)]
    
    const tasks = templates.map((template, j) => ({
      id: `day-${i + 1}-task-${j + 1}`,
      title: `${template} for ${skillName}`,
      instruction: `Spend 10-15 minutes on this activity. Focus on understanding rather than speed.`,
      completed: false,
    }))

    return {
      day: i + 1,
      tasks,
      completed: false,
    }
  })

  return {
    skillName,
    days,
    currentDay: 1,
    weeklyMilestones: milestones,
  }
}

export default function LoadingPage() {
  const navigate = useNavigate()
  const { activeSkill, setPlanForSkill } = useSkill()
  const [currentStep, setCurrentStep] = useState(0)
  const [completed, setCompleted] = useState([false, false, false])

  useEffect(() => {
    if (!activeSkill) {
      navigate("/setup", { replace: true })
      return
    }

    const stepDurations = [1200, 1400, 1000]
    let totalDelay = 0

    stepDurations.forEach((duration, index) => {
      totalDelay += duration
      setTimeout(() => {
        setCompleted((prev) => {
          const next = [...prev]
          next[index] = true
          return next
        })
        if (index < steps.length - 1) {
          setCurrentStep(index + 1)
        }
      }, totalDelay)
    })

    // Generate plan and redirect
    setTimeout(() => {
      const plan = generateMockPlan(activeSkill)
      setPlanForSkill(activeSkill, plan)
      navigate("/plan/overview")
    }, totalDelay + 600)
  }, [activeSkill, navigate, setPlanForSkill])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-12 animate-in fade-in duration-700">
          Building your learning plan
        </h1>

        <div className="space-y-6">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = currentStep === index
            const isDone = completed[index]

            return (
              <div
                key={step.label}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-500 ${
                  isDone
                    ? "bg-primary/5"
                    : isActive
                    ? "bg-card border border-border shadow-sm"
                    : "opacity-40"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                    isDone
                      ? "bg-primary text-primary-foreground"
                      : isActive
                      ? "bg-secondary text-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive && !isDone ? "animate-pulse" : ""}`} />
                </div>
                <span
                  className={`text-lg transition-all duration-500 ${
                    isDone
                      ? "text-foreground font-medium"
                      : isActive
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
                {isDone && (
                  <div className="ml-auto w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center animate-in zoom-in duration-300">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-12 flex justify-center">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-muted-foreground/30 animate-pulse"
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
