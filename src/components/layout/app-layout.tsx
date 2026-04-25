"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useAuthStore } from "@/store/auth-store"
import {
  Home,
  BookOpen,
  Pen,
  AlertCircle,
  CreditCard,
  Target,
  BarChart3,
  Brain,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronDown,
  FileText,
  Users,
  GraduationCap,
  LayoutDashboard,
  Sparkles,
  FolderOpen,
  Network,
  Layers,
  FileQuestion,
  Zap,
  Clapperboard,
  Key,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const learningNavItems: NavItem[] = [
  { label: "首页", href: "/", icon: Home },
  { label: "学科目录", href: "/subjects", icon: BookOpen },
  { label: "知识图谱", href: "/knowledge/graph", icon: Network },
  { label: "闪卡记忆", href: "/cards", icon: Layers },
]

const practiceNavItems: NavItem[] = [
  { label: "自由练习", href: "/practice", icon: Pen },
  { label: "模拟考试", href: "/exam", icon: FileQuestion },
  { label: "专项训练", href: "/practice?mode=subject", icon: Zap },
]

const reviewNavItems: NavItem[] = [
  { label: "错题本", href: "/wrong", icon: AlertCircle },
  { label: "复习计划", href: "/review", icon: Brain },
]

const resourceNavItems: NavItem[] = [
  { label: "资料库", href: "/files", icon: FolderOpen },
  { label: "学习资源", href: "/knowledge/resources", icon: Clapperboard },
]

const statsNavItems: NavItem[] = [
  { label: "学习目标", href: "/goals", icon: Target },
  { label: "数据统计", href: "/stats", icon: BarChart3 },
]

const teacherNavItems: NavItem[] = [
  { label: "工作台", href: "/teacher/dashboard", icon: LayoutDashboard },
  { label: "班级管理", href: "/teacher/classes", icon: Users },
  { label: "作业管理", href: "/teacher/assignments", icon: FileText },
]

const adminNavItems: NavItem[] = [
  { label: "API设置", href: "/settings/api", icon: Key },
  { label: "账单管理", href: "/admin/billing", icon: CreditCard },
  { label: "学校设置", href: "/admin/school", icon: Settings },
  { label: "教师管理", href: "/admin/teachers", icon: GraduationCap },
  { label: "使用统计", href: "/admin/usage", icon: BarChart3 },
]

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/"
  return pathname.startsWith(href)
}

function NavSection({
  title,
  items,
  collapsed,
  pathname,
  accentColor = "blue",
}: {
  title: string
  items: NavItem[]
  collapsed: boolean
  pathname: string
  accentColor?: string
}) {
  const colorMap: Record<string, { active: string; inactive: string }> = {
    blue: { active: "bg-blue-50 text-blue-700", inactive: "text-gray-600 hover:bg-gray-100 hover:text-gray-900" },
    purple: { active: "bg-purple-50 text-purple-700", inactive: "text-gray-600 hover:bg-gray-100 hover:text-gray-900" },
    amber: { active: "bg-amber-50 text-amber-700", inactive: "text-gray-600 hover:bg-gray-100 hover:text-gray-900" },
  }
  const colors = colorMap[accentColor] || colorMap.blue

  return (
    <div className="px-3 mb-3">
      {!collapsed && (
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          {title}
        </p>
      )}
      <nav className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon
          const active = isActivePath(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                active ? colors.active : colors.inactive
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="flex-1">{item.label}</span>}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

function MobileNavSection({
  title,
  items,
  iconColor,
  pathname,
}: {
  title: string
  items: NavItem[]
  iconColor: string
  pathname: string
}) {
  return (
    <div>
      <p className={`text-xs font-semibold uppercase mb-2 px-2 ${iconColor}`}>{title}</p>
      <div className="grid grid-cols-2 gap-1">
        {items.map((item) => {
          const Icon = item.icon
          const active = isActivePath(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function SidebarNavContent({
  collapsed,
  pathname,
  isTeacher,
  isAdmin,
  user,
  userMenuOpen,
  setUserMenuOpen,
  handleLogout,
}: {
  collapsed: boolean
  pathname: string
  isTeacher: boolean
  isAdmin: boolean
  user: { name?: string; email?: string; userType?: string } | null
  userMenuOpen: boolean
  setUserMenuOpen: (open: boolean) => void
  handleLogout: () => void
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold shadow-sm flex-shrink-0">
            E
          </div>
          {!collapsed && (
            <span className="text-lg font-bold text-gray-900">知识库</span>
          )}
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <NavSection title="学习" items={learningNavItems} collapsed={collapsed} pathname={pathname} />

        <div className="mx-3 my-4 border-t border-gray-100" />

        <NavSection title="练习" items={practiceNavItems} collapsed={collapsed} pathname={pathname} />

        <div className="mx-3 my-4 border-t border-gray-100" />

        <NavSection title="复习" items={reviewNavItems} collapsed={collapsed} pathname={pathname} />

        <div className="mx-3 my-4 border-t border-gray-100" />

        <NavSection title="资源" items={resourceNavItems} collapsed={collapsed} pathname={pathname} />

        <div className="mx-3 my-4 border-t border-gray-100" />

        <NavSection title="统计" items={statsNavItems} collapsed={collapsed} pathname={pathname} />

        {isTeacher && (
          <>
            <div className="mx-3 my-4 border-t border-gray-100" />
            <NavSection title="教师" items={teacherNavItems} collapsed={collapsed} pathname={pathname} accentColor="purple" />
          </>
        )}

        {isAdmin && (
          <>
            <div className="mx-3 my-4 border-t border-gray-100" />
            <NavSection title="管理" items={adminNavItems} collapsed={collapsed} pathname={pathname} accentColor="amber" />
          </>
        )}
      </div>

      <div className="p-4 border-t border-gray-200">
        {user ? (
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors",
                collapsed && "justify-center"
              )}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                {user.name?.charAt(0) || "用户"}
              </div>
              {!collapsed && (
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              )}
              {!collapsed && <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", userMenuOpen && "rotate-180")} />}
            </button>

            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={cn(
                    "absolute bottom-full left-0 mb-2 w-56 bg-white rounded-xl border border-gray-200 shadow-lg py-2 z-50",
                    collapsed && "left-full ml-2 mb-0"
                  )}
                >
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <span className={cn(
                      "inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full",
                      user.userType === "teacher" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                    )}>
                      {user.userType === "teacher" ? "教师" : "学生"}
                    </span>
                  </div>
                  <Link
                    href="/subscription"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <CreditCard className="w-4 h-4" />
                    订阅管理
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Settings className="w-4 h-4" />
                    设置
                  </Link>
                  <div className="border-t border-gray-100 mt-2 pt-2">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      退出登录
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className={cn("flex gap-2", collapsed && "flex-col")}>
            <Link
              href="/auth/login"
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors",
                collapsed && "flex-none justify-center p-2"
              )}
            >
              登录
            </Link>
            <Link
              href="/auth/register"
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-lg transition-all shadow-sm",
                collapsed && "flex-none p-2"
              )}
            >
              {!collapsed ? "注册" : <Sparkles className="w-4 h-4" />}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, checkAuth, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    checkAuth()
  }, [checkAuth])

  const handleLogout = async () => {
    await logout()
    router.push("/")
    setUserMenuOpen(false)
  }

  const isTeacher = user?.userType === "teacher"
  const isAdmin = isAuthenticated && isTeacher

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between h-14 px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold shadow-sm">
              E
            </div>
            <span className="text-base font-bold text-gray-900">知识库</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-200 overflow-hidden"
            >
              <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                <MobileNavSection title="学习" items={learningNavItems} iconColor="text-blue-500" pathname={pathname} />
                <MobileNavSection title="练习" items={practiceNavItems} iconColor="text-green-500" pathname={pathname} />
                <MobileNavSection title="复习" items={reviewNavItems} iconColor="text-orange-500" pathname={pathname} />
                <MobileNavSection title="资源" items={resourceNavItems} iconColor="text-purple-500" pathname={pathname} />
                <MobileNavSection title="统计" items={statsNavItems} iconColor="text-cyan-500" pathname={pathname} />

                {isTeacher && (
                  <div className="pt-2 border-t border-gray-200">
                    <MobileNavSection title="教师" items={teacherNavItems} iconColor="text-purple-500" pathname={pathname} />
                  </div>
                )}

                {isAdmin && (
                  <div className="pt-2 border-t border-gray-200">
                    <MobileNavSection title="管理" items={adminNavItems} iconColor="text-amber-500" pathname={pathname} />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop Layout: Left sidebar + Right content */}
      <div className="hidden lg:flex min-h-screen">
        <aside
          className={cn(
            "fixed left-0 top-0 h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-30",
            sidebarOpen ? "w-64" : "w-20"
          )}
        >
          <SidebarNavContent
            collapsed={!sidebarOpen}
            pathname={pathname}
            isTeacher={isTeacher}
            isAdmin={isAdmin}
            user={user}
            userMenuOpen={userMenuOpen}
            setUserMenuOpen={setUserMenuOpen}
            handleLogout={handleLogout}
          />
        </aside>

        <div
          className={cn(
            "flex-1 min-h-screen transition-all duration-300",
            sidebarOpen ? "ml-64" : "ml-20"
          )}
        >
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Content */}
      <div className="lg:hidden">
        <main className="p-4 pb-20">
          {children}
        </main>
      </div>
    </div>
  )
}
