import { useMemo, useState } from 'react'
import { BookOpen } from 'lucide-react'

// Generate activity data for skill checkins, optionally filtered by skill
function generateActivityData(checkinsData = [], filterSkill = null) {
    const today = new Date()
    const data = []

    // Generate 52 weeks (1 year) of data
    for (let week = 51; week >= 0; week--) {
        const weekData = []
        for (let day = 0; day < 7; day++) {
            const date = new Date(today)
            date.setDate(date.getDate() - (week * 7 + (6 - day)))

            const dateStr = date.toISOString().split('T')[0]

            // Count activity on this date, optionally filtered by skill
            const activity = checkinsData.filter(c => {
                const matchesDate = c.date?.startsWith(dateStr)
                const matchesSkill = filterSkill ? c.skill_name === filterSkill : true
                return matchesDate && matchesSkill
            }).length

            weekData.push({
                date: dateStr,
                count: activity,
                level: activity === 0 ? 0 : activity === 1 ? 1 : activity === 2 ? 2 : activity >= 3 ? 3 : 4
            })
        }
        data.push(weekData)
    }

    return data
}

const LEVEL_COLORS = [
    'bg-stone-100',    // Level 0 - no activity
    'bg-emerald-200',  // Level 1 - light activity
    'bg-emerald-400',  // Level 2 - medium activity
    'bg-emerald-600',  // Level 3 - good activity
    'bg-emerald-800',  // Level 4 - high activity
]

export default function ContributionGraph({ activeSkills = [], checkinsData = [] }) {
    const [filterSkill, setFilterSkill] = useState(null) // null = "All"

    // Deduplicate skill names from activeSkills (can be strings or objects)
    const skillNames = useMemo(() => {
        const names = activeSkills.map(s => typeof s === 'string' ? s : s.name || s)
        return [...new Set(names)]
    }, [activeSkills])

    // Also collect unique skill names from checkins data for the filter chips
    const checkinSkillNames = useMemo(() => {
        const names = new Set()
        checkinsData.forEach(c => {
            if (c.skill_name) names.add(c.skill_name)
        })
        return [...names]
    }, [checkinsData])

    // Merge skill names from both sources
    const allFilterableSkills = useMemo(() => {
        return [...new Set([...skillNames, ...checkinSkillNames])]
    }, [skillNames, checkinSkillNames])

    const activityData = useMemo(
        () => generateActivityData(checkinsData, filterSkill),
        [checkinsData, filterSkill]
    )

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    const monthLabels = useMemo(() => {
        const labels = []
        let currentMonth = null

        activityData.forEach((week, weekIndex) => {
            const date = new Date(week[0].date)
            const month = date.getMonth()
            if (month !== currentMonth) {
                labels.push({ month: months[month], position: weekIndex })
                currentMonth = month
            }
        })

        return labels
    }, [activityData])

    const totalContributions = useMemo(
        () => activityData.flat().reduce((sum, day) => sum + day.count, 0),
        [activityData]
    )

    // Empty state: no skills and no checkins
    const isEmpty = allFilterableSkills.length === 0 && checkinsData.length === 0

    if (isEmpty) {
        return (
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
                <div className="text-center py-6">
                    <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <BookOpen className="w-6 h-6 text-stone-400" />
                    </div>
                    <h3 className="font-medium text-stone-700 mb-1">No practice activity yet</h3>
                    <p className="text-sm text-stone-400">
                        Start learning a skill to see your practice graph
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-stone-900">Skill Practice</h3>
                <span className="text-sm text-stone-500">
                    {totalContributions} session{totalContributions !== 1 ? 's' : ''}{filterSkill ? ` (${filterSkill})` : ' this year'}
                </span>
            </div>

            {/* Month labels */}
            <div className="flex mb-1 text-xs text-stone-400 overflow-hidden">
                <div className="w-6" />
                <div className="flex-1 relative h-4">
                    {monthLabels.map(({ month, position }) => (
                        <span
                            key={`${month}-${position}`}
                            className="absolute"
                            style={{ left: `${(position / 52) * 100}%` }}
                        >
                            {month}
                        </span>
                    ))}
                </div>
            </div>

            {/* Graph */}
            <div className="flex gap-0.5 overflow-x-auto">
                {/* Day labels */}
                <div className="flex flex-col gap-0.5 text-xs text-stone-400 pr-1 shrink-0">
                    <span className="h-2.5" />
                    <span className="h-2.5 text-[10px]">Mon</span>
                    <span className="h-2.5" />
                    <span className="h-2.5 text-[10px]">Wed</span>
                    <span className="h-2.5" />
                    <span className="h-2.5 text-[10px]">Fri</span>
                    <span className="h-2.5" />
                </div>

                {/* Weeks */}
                {activityData.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col gap-0.5">
                        {week.map((day, dayIndex) => (
                            <div
                                key={`${weekIndex}-${dayIndex}`}
                                className={`w-2.5 h-2.5 rounded-sm ${LEVEL_COLORS[day.level]} transition-colors`}
                                title={`${day.date}: ${day.count} session${day.count !== 1 ? 's' : ''}`}
                            />
                        ))}
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end gap-1 mt-3 text-xs text-stone-400">
                <span>Less</span>
                {LEVEL_COLORS.map((color, index) => (
                    <div key={index} className={`w-2.5 h-2.5 rounded-sm ${color}`} />
                ))}
                <span>More</span>
            </div>

            {/* Skill filter chips */}
            {allFilterableSkills.length > 0 && (
                <div className="mt-4 pt-4 border-t border-stone-100">
                    <p className="text-xs text-stone-500 mb-2">Filter by skill:</p>
                    <div className="flex flex-wrap gap-2">
                        {/* All chip */}
                        <button
                            onClick={() => setFilterSkill(null)}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                                filterSkill === null
                                    ? 'bg-stone-900 text-white'
                                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            }`}
                        >
                            All
                        </button>
                        {allFilterableSkills.map(skill => (
                            <button
                                key={skill}
                                onClick={() => setFilterSkill(filterSkill === skill ? null : skill)}
                                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                                    filterSkill === skill
                                        ? 'bg-stone-900 text-white'
                                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                }`}
                            >
                                {skill}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
