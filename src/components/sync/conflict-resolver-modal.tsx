"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, X, Check, ChevronRight, RefreshCw } from "lucide-react"
import { syncService } from "@/lib/sync/sync-service"
import { syncQueue } from "@/lib/sync/sync-queue"
import type { SyncRecord } from "@/lib/sync/types"

interface ConflictCardProps {
  record: SyncRecord
  onResolve: (strategy: 'server-wins' | 'client-wins' | 'merge' | 'timestamp') => void
  isResolving: boolean
}

function ConflictCard({ record, onResolve, isResolving }: ConflictCardProps) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-yellow-200 bg-yellow-50 p-4"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-gray-900">{record.tableName}</h4>
            <p className="text-sm text-gray-500">
              记录 ID: {record.recordId.slice(0, 8)}...
            </p>
            <p className="text-xs text-gray-400 mt-1">
              本地修改: {new Date(record.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="p-1 text-gray-400 hover:text-gray-600"
        >
          <ChevronRight className={`h-4 w-4 transition-transform ${showDetails ? "rotate-90" : ""}`} />
        </button>
      </div>

      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-4"
          >
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 mb-1">本地数据</p>
                <pre className="bg-white p-2 rounded border text-xs overflow-auto max-h-32">
                  {JSON.stringify(record.data, null, 2)}
                </pre>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">服务器数据</p>
                <pre className="bg-white p-2 rounded border text-xs overflow-auto max-h-32">
                  {JSON.stringify(record.conflictData, null, 2)}
                </pre>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2 mt-4">
        <button
          onClick={() => onResolve('server-wins')}
          disabled={isResolving}
          className="flex-1 px-3 py-1.5 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-1"
        >
          保留服务器
        </button>
        <button
          onClick={() => onResolve('client-wins')}
          disabled={isResolving}
          className="flex-1 px-3 py-1.5 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-1"
        >
          保留本地
        </button>
        <button
          onClick={() => onResolve('merge')}
          disabled={isResolving}
          className="flex-1 px-3 py-1.5 rounded-lg bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 disabled:opacity-50 flex items-center justify-center gap-1"
        >
          合并
        </button>
      </div>
    </motion.div>
  )
}

interface ConflictResolverModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ConflictResolverModal({ isOpen, onClose }: ConflictResolverModalProps) {
  const [conflicts, setConflicts] = useState<SyncRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [resolving, setResolving] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadConflicts()
    }
  }, [isOpen])

  async function loadConflicts() {
    setLoading(true)
    try {
      const conflictedRecords = await syncQueue.getConflictedRecords()
      setConflicts(conflictedRecords)
    } catch (error) {
      console.error("Failed to load conflicts:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleResolve(recordId: string, strategy: 'server-wins' | 'client-wins' | 'merge' | 'timestamp') {
    setResolving(recordId)
    try {
      await syncService.resolveConflict(recordId, strategy)
      await loadConflicts()
    } catch (error) {
      console.error("Failed to resolve conflict:", error)
    } finally {
      setResolving(null)
    }
  }

  async function handleResolveAll(strategy: 'server-wins' | 'client-wins' | 'merge' | 'timestamp') {
    for (const conflict of conflicts) {
      await handleResolve(conflict.id, strategy)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <h2 className="text-lg font-bold text-gray-900">同步冲突</h2>
                {conflicts.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-sm">
                    {conflicts.length}
                  </span>
                )}
              </div>
              <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 overflow-auto max-h-[calc(80vh-120px)]">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 text-gray-400 animate-spin" />
                </div>
              ) : conflicts.length === 0 ? (
                <div className="text-center py-8">
                  <Check className="h-12 w-12 text-green-400 mx-auto mb-3" />
                  <p className="text-gray-600">没有待解决的冲突</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => handleResolveAll('server-wins')}
                      className="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 text-sm font-medium hover:bg-blue-200"
                    >
                      全部保留服务器
                    </button>
                    <button
                      onClick={() => handleResolveAll('client-wins')}
                      className="px-3 py-1.5 rounded-lg bg-green-100 text-green-700 text-sm font-medium hover:bg-green-200"
                    >
                      全部保留本地
                    </button>
                    <button
                      onClick={() => handleResolveAll('merge')}
                      className="px-3 py-1.5 rounded-lg bg-purple-100 text-purple-700 text-sm font-medium hover:bg-purple-200"
                    >
                      全部合并
                    </button>
                  </div>

                  {conflicts.map(conflict => (
                    <ConflictCard
                      key={conflict.id}
                      record={conflict}
                      onResolve={(strategy) => handleResolve(conflict.id, strategy)}
                      isResolving={resolving === conflict.id}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50">
              <div className="flex justify-between text-sm text-gray-500">
                <span>
                  {conflicts.length > 0
                    ? `还有 ${conflicts.length} 个冲突待解决`
                    : "所有冲突已解决"}
                </span>
                <span>策略: 时间戳优先 → 不可合并字段直接覆盖</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}