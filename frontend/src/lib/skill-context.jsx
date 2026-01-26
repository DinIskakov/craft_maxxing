import { createContext, useContext, useState } from "react"

const SkillContext = createContext(undefined)

export function SkillProvider({ children }) {
  const [skills, setSkills] = useState([])
  const [activeSkill, setActiveSkill] = useState(null)
  const [plans, setPlans] = useState({})

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
    if (activeSkill === skill) {
      const remaining = skills.filter((s) => s !== skill)
      setActiveSkill(remaining.length > 0 ? remaining[0] : null)
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
