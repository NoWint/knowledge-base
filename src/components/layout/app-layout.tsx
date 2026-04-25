"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUserStore } from "@/store/user-store"
import { motion, AnimatePresence } from "framer-motion"
import {
  BookOpen,
  PenTool,
  AlertCircle,
  BarChart3,
  FolderOpen,
  Network,
  Settings,
  ChevronRight,
  ChevronLeft,
  LogOut,
  Home,
  Lightbulb,
  Upload,
  Target,
  Layers,
  Database,
  FileCheck,
  Flag,
} from "lucide-react"

const navItems = [
  { icon: Home, label: "首页", href: "/", group: "学习" },
  { icon: BookOpen, label: "学科目录", href: "/subjects", group: "学习" },
  { icon: Lightbulb, label: "知识中心", href: "/knowledge", group: "学习" },
  { icon: Network, label: "知识图谱", href: "/knowledge/graph", group: "学习" },
  { icon: PenTool, label: "练习题库", href: "/practice", group: "练习" },
  { icon: FileCheck, label: "模拟考试", href: "/exam", group: "练习" },
  { icon: Target, label: "复习计划", href: "/review", group: "练习" },
  { icon: AlertCircle, label: "错题本", href: "/wrong", group: "练习" },
  { icon: Layers, label: "学习闪卡", href: "/cards", group: "练习" },
  { icon: Flag, label: "学习目标", href: "/goals", group: "数据" },
  { icon: BarChart3, label: "学习数据", href: "/stats", group: "数据" },
  { icon: FolderOpen, label: "资料库", href: "/files", group: "工具" },
  { icon: Upload, label: "数据导入", href: "/import", group: "工具" },
  { icon: Settings, label: "设置", href: "/settings", group: "工具" },
]

const groupOrder = ["学习", "练习", "数据", "工具"]

const groupIcons: Record<string, React.ReactNode> = {
  "学习": <Database className="h-3 w-3" />,
  "练习": <PenTool className="h-3 w-3" />,
  "数据": <BarChart3 className="h-3 w-3" />,
  "工具": <FolderOpen className="h-3 w-3" />,
}

const groupColors: Record<string, string> = {
  "学习": "text-blue-500",
  "练习": "text-orange-500",
  "数据": "text-purple-500",
  "工具": "text-green-500",
}

const groupBgColors: Record<string, string> = {
  "学习": "bg-blue-50",
  "练习": "bg-orange-50",
  "数据": "bg-purple-50",
  "工具": "bg-green-50",
}

const groupedNavs = navItems.reduce((acc, item) => {
  if (!acc[item.group]) acc[item.group] = []
  acc[item.group].push(item)
  return acc
}, {} as Record<string, typeof navItems>)

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null)
  const pathname = usePathname()
  const { currentUser, clearCurrentUser } = useUserStore()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 64 : 240 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        className="fixed left-0 top-0 z-40 h-screen overflow-hidden border-r border-white/20 bg-white/40 backdrop-blur-xl shadow-2xl"
      >
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center px-3 border-b border-gray-100">
            <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 3 }}
                whileTap={{ scale: 0.95 }}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-white font-bold text-sm shadow-md"
              >
                E
              </motion.div>
              <AnimatePresence mode="wait">
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.2 }}
                    className="whitespace-nowrap font-bold text-gray-900 text-base tracking-tight"
                  >
                    Eric知识库
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto py-3 px-2">
            {groupOrder.map((group) => {
              const items = groupedNavs[group]
              if (!items) return null

              return (
                <div key={group} className="mb-3">
                  {!isCollapsed ? (
                    <div
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1.5 mb-1 rounded-md transition-colors",
                        hoveredGroup === group ? groupBgColors[group] : "",
                        groupColors[group]
                      )}
                      onMouseEnter={() => setHoveredGroup(group)}
                      onMouseLeave={() => setHoveredGroup(null)}
                    >
                      <span className={cn(groupColors[group])}>{groupIcons[group]}</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider opacity-60">
                        {group}
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-center py-1.5 mb-1">
                      <div className={cn("p-1 rounded-md", groupBgColors[group])}>
                        <span className={cn("flex", groupColors[group])}>{groupIcons[group]}</span>
                      </div>
                    </div>
                  )}

                  <ul className={cn("space-y-0.5", isCollapsed && "px-1")}>
                    {items.map((item) => {
                      const isActive = pathname === item.href

                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={cn(
                              "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-150",
                              isActive
                                ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                              isCollapsed && "justify-center px-2"
                            )}
                          >
                            <item.icon
                              className={cn(
                                "h-4 w-4 flex-shrink-0 transition-colors",
                                isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                              )}
                            />
                            {!isCollapsed && (
                              <span className="flex-1 truncate">{item.label}</span>
                            )}
                            {isActive && !isCollapsed && (
                              <motion.div
                                layoutId="activeIndicator"
                                className="h-1.5 w-1.5 rounded-full bg-blue-500"
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              />
                            )}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>

                  {!isCollapsed && group !== "工具" && (
                    <div className="my-2 border-t border-gray-100" />
                  )}
                </div>
              )
            })}
          </nav>

          <div className="border-t border-gray-100 p-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900",
                isCollapsed && "justify-center px-2"
              )}
            >
              <motion.div
                animate={{ rotate: isCollapsed ? 0 : 180 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="flex h-5 w-5 items-center justify-center"
              >
                <ChevronLeft className="h-4 w-4" />
              </motion.div>
              {!isCollapsed && <span>收起侧边栏</span>}
            </motion.button>

            <div className="relative mt-2">
              <motion.button
                whileHover={{ backgroundColor: "#f9fafb" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm transition-colors",
                  isCollapsed && "justify-center px-2"
                )}
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-500 text-white text-xs font-semibold shadow-sm">
                  {currentUser?.name?.charAt(0) || "U"}
                </div>
                <AnimatePresence mode="wait">
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex flex-col items-start"
                    >
                      <span className="truncate font-medium text-gray-800 text-xs">
                        {currentUser?.name}
                      </span>
                      <span className="text-[10px] text-gray-400 truncate">
                        点击切换用户
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
                    className="absolute bottom-full left-2 right-2 mb-2 rounded-xl border border-gray-100 bg-white py-2 shadow-lg"
                  >
                    <div className="px-3 py-2 border-b border-gray-50 mb-1">
                      <p className="text-xs font-medium text-gray-500">当前用户</p>
                      <p className="text-sm font-semibold text-gray-900">{currentUser?.name}</p>
                    </div>
                    <motion.button
                      whileHover={{ backgroundColor: "#fef2f2" }}
                      onClick={() => {
                        clearCurrentUser()
                        setShowUserMenu(false)
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      切换用户
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.aside>

      <motion.main
        initial={false}
        animate={{ marginLeft: isCollapsed ? 64 : 240 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        className="min-h-screen"
      >
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          className="min-h-screen p-6"
        >
          {children}
        </motion.div>
      </motion.main>
    </div>
  )
}
