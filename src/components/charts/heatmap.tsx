"use client"

import { useMemo } from "react"

interface HeatmapProps {
  data: { date: string; value: number }[]
  maxValue?: number
}

export function Heatmap({ data, maxValue = 10 }: HeatmapProps) {
  const weeks = useMemo(() => {
    const result: { date: string; value: number }[][] = []
    let currentWeek: { date: string; value: number }[] = []

    for (let i = 0; i < data.length; i++) {
      currentWeek.push(data[i])
      if (currentWeek.length === 7 || i === data.length - 1) {
        result.push(currentWeek)
        currentWeek = []
      }
    }

    return result
  }, [data])

  const getColor = (value: number) => {
    if (value === 0) return 'bg-gray-100'
    const ratio = Math.min(value / maxValue, 1)
    if (ratio < 0.25) return 'bg-green-200'
    if (ratio < 0.5) return 'bg-green-300'
    if (ratio < 0.75) return 'bg-green-400'
    return 'bg-green-500'
  }

  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-0.5">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-0.5">
            {week.map((day, dayIndex) => {
              const date = new Date(day.date)
              const monthLabel = dayIndex === 0 ? months[date.getMonth()] : ''
              return (
                <div key={dayIndex} className="relative group">
                  {monthLabel && (
                    <span className="absolute -top-4 left-0 text-xs text-gray-400">{monthLabel}</span>
                  )}
                  <div
                    className={`w-3 h-3 rounded-sm ${getColor(day.value)} transition-colors`}
                    title={`${day.date}: ${day.value} 题`}
                  />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {day.date}: {day.value} 题
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}