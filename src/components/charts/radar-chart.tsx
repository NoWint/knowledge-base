"use client"

import { useMemo } from "react"

interface RadarChartProps {
  data: { subject: string; mastery: number }[]
  size?: number
}

export function RadarChart({ data, size = 200 }: RadarChartProps) {
  const center = size / 2
  const maxRadius = size / 2 - 20

  const points = useMemo(() => {
    const angleStep = (2 * Math.PI) / data.length
    return data.map((item, index) => {
      const angle = angleStep * index - Math.PI / 2
      const radius = (item.mastery / 100) * maxRadius
      return {
        x: center + radius * Math.cos(angle),
        y: center + radius * Math.sin(angle),
        mastery: item.mastery,
        subject: item.subject,
      }
    })
  }, [data, center, maxRadius])

  const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ')

  const gridLevels = [25, 50, 75, 100]

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="overflow-visible">
        {gridLevels.map(level => {
          const gridRadius = (level / 100) * maxRadius
          const gridPoints = data.map((_, index) => {
            const angleStep = (2 * Math.PI) / data.length
            const angle = angleStep * index - Math.PI / 2
            return `${center + gridRadius * Math.cos(angle)},${center + gridRadius * Math.sin(angle)}`
          }).join(' ')

          return (
            <polygon
              key={level}
              points={gridPoints}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          )
        })}

        {data.map((_, index) => {
          const angleStep = (2 * Math.PI) / data.length
          const angle = angleStep * index - Math.PI / 2
          const x2 = center + maxRadius * Math.cos(angle)
          const y2 = center + maxRadius * Math.sin(angle)
          return (
            <line
              key={index}
              x1={center}
              y1={center}
              x2={x2}
              y2={y2}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          )
        })}

        <polygon
          points={polygonPoints}
          fill="rgba(139, 92, 246, 0.3)"
          stroke="#8b5cf6"
          strokeWidth="2"
        />

        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="#8b5cf6"
            stroke="white"
            strokeWidth="2"
          />
        ))}
      </svg>

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2 max-w-[200px]">
        {data.map((item, index) => (
          <div key={index} className="text-xs text-gray-600">
            <span className="font-medium">{item.subject}</span>
            <span className="text-gray-400 ml-1">{item.mastery}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}