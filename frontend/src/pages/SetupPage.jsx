import React, { useState, useMemo, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Sparkles } from "lucide-react"
import { SkillBubble } from "@/components/skill-bubble.jsx"
import { useSkill } from "@/lib/skill-context.jsx"
import { PlanNavigation } from "@/components/plan-navigation.jsx"

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
  const { skills, addSkill, removeSkill, activeSkill, setActiveSkill, hasActivePlan } = useSkill()
  const [inputValue, setInputValue] = useState("")

  const positions = useMemo(
    () => generateBubblePositions(Math.max(skills.length, 6)),
    [skills.length]
  )

  const handleAddSkill = useCallback(() => {
    const trimmed = inputValue.trim()
    if (trimmed && !skills.includes(trimmed)) {
      addSkill(trimmed)
      setInputValue("")
    }
  }, [inputValue, skills, addSkill])

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddSkill()
    }
  }

  const handleGeneratePlan = () => {
    if (activeSkill) {
      navigate("/plan/loading")
    }
  }

  const handleBubbleClick = (skill) => {
    setActiveSkill(skill)
  }

  // Check if active skill already has a plan
  const activeSkillHasPlan = activeSkill ? hasActivePlan(activeSkill) : false

  return (
    <main className="min-h-screen flex flex-col pb-32">
      {/* Bubble Canvas */}
      <div className="flex-1 relative overflow-hidden min-h-[60vh]">
        <div className="absolute inset-0">
          {/* Center Bubble */}
          <SkillBubble isCenter name="Skills" />

          {/* Skill Bubbles */}
          {skills.map((skill, index) => {
            const pos = positions[index] || { x: 50, y: 50 }
            const skillHasPlan = hasActivePlan(skill)
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
                  onClick={() => handleBubbleClick(skill)}
                  onRemove={() => removeSkill(skill)}
                />
              </div>
            )
          })}
        </div>

        {/* Empty State */}
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
          {/* Input */}
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

          {/* Generate Button - only show if skill doesn't have plan yet */}
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

          {/* Continue Button - show if skill has plan */}
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

      <PlanNavigation currentPage="skills" />
    </main>
  )
}
