import { Link } from "react-router-dom"
import { X, Play, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils.js"

// Color palettes for skill bubbles
const bubbleColors = [
  { bg: "from-rose-400 to-pink-500", border: "border-rose-300", text: "text-white" },
  { bg: "from-violet-400 to-purple-500", border: "border-violet-300", text: "text-white" },
  { bg: "from-blue-400 to-indigo-500", border: "border-blue-300", text: "text-white" },
  { bg: "from-emerald-400 to-teal-500", border: "border-emerald-300", text: "text-white" },
  { bg: "from-amber-400 to-orange-500", border: "border-amber-300", text: "text-white" },
  { bg: "from-cyan-400 to-sky-500", border: "border-cyan-300", text: "text-white" },
]

export function SkillBubble({
  name,
  index = 0,
  isActive = false,
  isCenter = false,
  hasPlan = false,
  onClick,
  onRemove,
  style,
}) {
  const colorSet = bubbleColors[index % bubbleColors.length]

  if (isCenter) {
    return (
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 md:w-44 md:h-44 rounded-full bg-gradient-to-br from-muted/50 to-muted border-2 border-border/50 flex items-center justify-center shadow-inner"
        style={style}
      >
        <div className="text-center">
          <Sparkles className="w-6 h-6 mx-auto mb-2 text-muted-foreground/60" />
          <span className="font-serif text-lg md:text-xl text-muted-foreground/80">
            Skills
          </span>
        </div>
      </div>
    )
  }

  const bubbleContent = (
    <div
      className={cn(
        "group relative px-5 py-3 rounded-full transition-all duration-300 cursor-pointer",
        "shadow-lg hover:shadow-xl",
        isActive ? "scale-110 ring-2 ring-white/50 ring-offset-2 ring-offset-background" : "hover:scale-105",
        `bg-gradient-to-br ${colorSet.bg}`,
        colorSet.text
      )}
      style={{ position: "relative" }}
    >
      <div className="flex items-center gap-2">
        {hasPlan && (
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
            <Play className="w-3 h-3 fill-current" />
          </div>
        )}
        <span className="font-medium text-sm md:text-base whitespace-nowrap drop-shadow-sm">
          {name}
        </span>
      </div>
      
      {/* Shine effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-white/10 to-white/20 pointer-events-none" />
      
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onRemove()
          }}
          className={cn(
            "absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center transition-all",
            "bg-white/90 text-gray-600 shadow-md",
            "opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white"
          )}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  )

  // If has plan, wrap in Link to go to plan page
  if (hasPlan) {
    return (
      <Link to="/plan/today" onClick={onClick} style={style} className="absolute">
        {bubbleContent}
      </Link>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick?.()
        }
      }}
      style={style}
      className="absolute"
    >
      {bubbleContent}
    </div>
  )
}
