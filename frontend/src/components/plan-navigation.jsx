import { Link } from "react-router-dom"
import { Calendar, LayoutGrid, TrendingUp, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils.js"

const navItems = [
  { href: "/plan/today", icon: Calendar, label: "Today", page: "today" },
  { href: "/plan/overview", icon: LayoutGrid, label: "Plan", page: "plan" },
  { href: "/plan/progress", icon: TrendingUp, label: "Progress", page: "progress" },
  { href: "/setup", icon: Sparkles, label: "Skills", page: "skills" },
]

export function PlanNavigation({ currentPage }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border">
      <div className="max-w-xl mx-auto px-6">
        <div className="flex items-center justify-around py-3">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.page

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "scale-110")} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
