"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Cloud, CloudOff, RefreshCw, Check, AlertCircle } from "lucide-react"
import { syncService } from "@/lib/sync/sync-service"
import { useUserStore } from "@/store/user-store"

interface SyncStatus {
  isOnline: boolean
  isSyncing: boolean
  pendingCount: number
  lastSyncedAt: number | null
  hasConflicts: boolean
}

export function SyncIndicator() {
  const { currentUser } = useUserStore()
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    isSyncing: false,
    pendingCount: 0,
    lastSyncedAt: null,
    hasConflicts: false,
  })
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    if (!currentUser) return

    const updateStatus = async () => {
      const syncStatus = await syncService.getStatus()
      setStatus((prev) => ({
        ...prev,
        pendingCount: syncStatus.pendingCount,
        hasConflicts: syncStatus.conflictedCount > 0,
      }))
    }

    updateStatus()

    const handleOnline = () => setStatus((prev) => ({ ...prev, isOnline: true }))
    const handleOffline = () => setStatus((prev) => ({ ...prev, isOnline: false }))

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    const interval = setInterval(updateStatus, 10000)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      clearInterval(interval)
    }
  }, [currentUser])

  const handleSync = async () => {
    if (status.isSyncing || !status.isOnline) return

    setStatus((prev) => ({ ...prev, isSyncing: true }))

    try {
      await syncService.syncNow()
      const syncStatus = await syncService.getStatus()
      setStatus((prev) => ({
        ...prev,
        pendingCount: syncStatus.pendingCount,
        lastSyncedAt: Date.now(),
        isSyncing: false,
      }))
    } catch (error) {
      console.error("Sync failed:", error)
      setStatus((prev) => ({ ...prev, isSyncing: false }))
    }
  }

  const getStatusIcon = () => {
    if (!status.isOnline) return <CloudOff className="h-4 w-4 text-gray-400" />
    if (status.isSyncing) return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
    if (status.hasConflicts) return <AlertCircle className="h-4 w-4 text-orange-500" />
    if (status.pendingCount > 0) return <Cloud className="h-4 w-4 text-amber-500" />
    return <Check className="h-4 w-4 text-green-500" />
  }

  const getStatusText = () => {
    if (!status.isOnline) return "离线"
    if (status.isSyncing) return "同步中..."
    if (status.hasConflicts) return "有冲突"
    if (status.pendingCount > 0) return `${status.pendingCount} 待同步`
    return "已同步"
  }

  if (!currentUser) return null

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 text-sm transition-all hover:bg-white"
      >
        {getStatusIcon()}
        <span className="text-gray-600">{getStatusText()}</span>
      </motion.button>

      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl border border-gray-200 shadow-lg p-4 z-50"
          >
            <h4 className="font-medium text-gray-900 text-sm mb-3">同步状态</h4>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">网络状态</span>
                <span className={`flex items-center gap-1 ${status.isOnline ? "text-green-600" : "text-gray-400"}`}>
                  {status.isOnline ? "在线" : "离线"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500">待同步</span>
                <span className={status.pendingCount > 0 ? "text-amber-600" : "text-gray-600"}>
                  {status.pendingCount} 项
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500">冲突</span>
                <span className={status.hasConflicts ? "text-orange-600" : "text-gray-600"}>
                  {status.hasConflicts ? "有" : "无"}
                </span>
              </div>

              {status.lastSyncedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">上次同步</span>
                  <span className="text-gray-600">
                    {new Date(status.lastSyncedAt).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSync}
              disabled={!status.isOnline || status.isSyncing}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${status.isSyncing ? "animate-spin" : ""}`} />
              {status.isSyncing ? "同步中..." : "立即同步"}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
