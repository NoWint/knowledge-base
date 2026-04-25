"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AppLayout } from "@/components/layout/app-layout"
import { db } from "@/lib/db/database"
import { useUserStore } from "@/store/user-store"
import {
  FolderOpen,
  Upload,
  Search,
  FileText,
  FileImage,
  File,
  Trash2,
  Download,
  Eye,
  FolderPlus,
  X,
  FileVideo,
  FileAudio,
  Archive,
} from "lucide-react"
import type { UserFile, FileFolder } from "@/types"

const fileIcons: Record<string, { icon: any; color: string }> = {
  pdf: { icon: FileText, color: "from-red-500 to-red-600" },
  doc: { icon: FileText, color: "from-blue-500 to-blue-600" },
  docx: { icon: FileText, color: "from-blue-500 to-blue-600" },
  txt: { icon: FileText, color: "from-gray-500 to-gray-600" },
  jpg: { icon: FileImage, color: "from-green-500 to-green-600" },
  jpeg: { icon: FileImage, color: "from-green-500 to-green-600" },
  png: { icon: FileImage, color: "from-green-500 to-green-600" },
  gif: { icon: FileImage, color: "from-green-500 to-green-600" },
  webp: { icon: FileImage, color: "from-green-500 to-green-600" },
  mp4: { icon: FileVideo, color: "from-purple-500 to-purple-600" },
  webm: { icon: FileVideo, color: "from-purple-500 to-purple-600" },
  mp3: { icon: FileAudio, color: "from-amber-500 to-amber-600" },
  zip: { icon: Archive, color: "from-orange-500 to-orange-600" },
  rar: { icon: Archive, color: "from-orange-500 to-orange-600" },
}

function getFileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() || ""
  return fileIcons[ext] || { icon: File, color: "from-gray-500 to-gray-600" }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function FilesPage() {
  const { currentUser } = useUserStore()
  const [files, setFiles] = useState<UserFile[]>([])
  const [folders, setFolders] = useState<FileFolder[]>([])
  const [search, setSearch] = useState("")
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [previewFile, setPreviewFile] = useState<UserFile | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!currentUser) return
    loadData()
  }, [currentUser, selectedFolder])

  const loadData = async () => {
    if (!currentUser) return
    let f = await db.userFiles.where("userId").equals(currentUser.id).toArray()
    const fo = await db.fileFolders.where("userId").equals(currentUser.id).toArray()
    
    if (selectedFolder) {
      f = f.filter(file => file.folderId === selectedFolder)
    }

    setFiles(f.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()))
    setFolders(fo)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList || !currentUser) return

    for (const file of Array.from(fileList)) {
      const arrayBuffer = await file.arrayBuffer()
      const blob = new Blob([arrayBuffer], { type: file.type })
      const newFile: UserFile = {
        id: crypto.randomUUID(),
        userId: currentUser.id,
        folderId: selectedFolder,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileData: blob,
        tags: [],
        knowledgePointId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      await db.userFiles.add(newFile)
    }

    await loadData()
    setShowUpload(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleDeleteFile = async (id: string) => {
    await db.userFiles.delete(id)
    await loadData()
  }

  const handleDownloadFile = async (file: UserFile) => {
    const blob = new Blob([file.fileData], { type: file.fileType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = file.fileName
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePreviewFile = async (file: UserFile) => {
    const blob = new Blob([file.fileData], { type: file.fileType })
    const url = URL.createObjectURL(blob)
    setPreviewFile(file)
    setPreviewUrl(url)
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !currentUser) return
    const newFolder: FileFolder = {
      id: crypto.randomUUID(),
      userId: currentUser.id,
      parentId: null,
      folderName: newFolderName.trim(),
      createdAt: new Date(),
    }
    await db.fileFolders.add(newFolder)
    setNewFolderName("")
    setShowNewFolder(false)
    await loadData()
  }

  const handleDeleteFolder = async (id: string) => {
    await db.fileFolders.delete(id)
    if (selectedFolder === id) setSelectedFolder(null)
    await loadData()
  }

  const filteredFiles = files.filter(f =>
    f.fileName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">资料库</h1>
            <p className="text-gray-600 mt-1">管理你的学习资料和文件</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNewFolder(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white font-medium hover:bg-gray-50 transition"
            >
              <FolderPlus className="h-4 w-4" /> 新建文件夹
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium hover:from-blue-600 hover:to-indigo-700 transition shadow-lg shadow-blue-500/25"
            >
              <Upload className="h-4 w-4" /> 上传文件
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileUpload}
              accept="*/*"
            />
          </div>
        </motion.div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索文件..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
            />
          </div>
        </div>

        {folders.length > 0 && (
          <div>
            <h2 className="mb-3 text-sm font-medium text-gray-700">文件夹</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setSelectedFolder(null)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                  selectedFolder === null
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <FolderOpen className="h-4 w-4" />
                全部文件
              </button>
              {folders.map(folder => (
                <div key={folder.id} className="relative group">
                  <button
                    onClick={() => setSelectedFolder(folder.id === selectedFolder ? null : folder.id)}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                      selectedFolder === folder.id
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <FolderOpen className="h-4 w-4" />
                    {folder.folderName}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteFolder(folder.id)
                    }}
                    className="absolute -right-2 -top-2 hidden rounded-full bg-red-500 p-1 text-white group-hover:block"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-2xl font-bold text-gray-900">{files.length}</p>
            <p className="text-sm text-gray-500">总文件数</p>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-2xl font-bold text-gray-900">{folders.length}</p>
            <p className="text-sm text-gray-500">文件夹</p>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-2xl font-bold text-gray-900">{formatFileSize(files.reduce((sum, f) => sum + f.fileSize, 0))}</p>
            <p className="text-sm text-gray-500">总大小</p>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-2xl font-bold text-gray-900">
              {files.length > 0 ? formatFileSize(Math.max(...files.map(f => f.fileSize))) : "0 B"}
            </p>
            <p className="text-sm text-gray-500">最大文件</p>
          </div>
        </div>

        {filteredFiles.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence>
              {filteredFiles.map((file, index) => {
                const { icon: Icon, color } = getFileIcon(file.fileName)
                return (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    className="group rounded-xl border bg-white p-5 shadow-sm hover:shadow-lg transition-all"
                  >
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-md mb-4`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-medium text-gray-900 truncate" title={file.fileName}>{file.fileName}</h3>
                    <p className="text-xs text-gray-500 mt-1">{formatFileSize(file.fileSize)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {file.createdAt.toLocaleDateString()}
                    </p>
                    <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => handlePreviewFile(file)}
                        className="flex-1 rounded-lg bg-gray-100 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 transition"
                      >
                        <Eye className="mr-1 inline h-3 w-3" /> 预览
                      </button>
                      <button
                        onClick={() => handleDownloadFile(file)}
                        className="flex-1 rounded-lg bg-gray-100 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 transition"
                      >
                        <Download className="mr-1 inline h-3 w-3" /> 下载
                      </button>
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className="rounded-lg bg-red-50 p-1.5 text-red-500 hover:bg-red-100 transition"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50"
          >
            <Upload className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 font-medium">
              {search ? "没有找到匹配的文件" : "拖拽文件到这里上传"}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {search ? "尝试其他搜索关键词" : "支持 PDF、Word、图片、视频等格式"}
            </p>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showNewFolder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setShowNewFolder(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-4 text-lg font-semibold text-gray-900">新建文件夹</h2>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="文件夹名称"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              />
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => setShowNewFolder(false)}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim()}
                  className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 transition"
                >
                  创建
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewUrl && previewFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
            onClick={() => { if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); setPreviewFile(null) }}          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b p-4">
                <h3 className="font-medium text-gray-900">{previewFile.fileName}</h3>
                <button
                  onClick={() => { if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); setPreviewFile(null) }}
                  className="rounded-lg p-2 hover:bg-gray-100 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex max-h-[70vh] items-center justify-center overflow-auto p-4">
                {previewFile.fileType.startsWith("image/") ? (
                  <img src={previewUrl} alt={previewFile.fileName} className="max-h-full max-w-full rounded-lg" />
                ) : previewFile.fileType.startsWith("video/") ? (
                  <video src={previewUrl} controls className="max-h-full max-w-full rounded-lg" />
                ) : previewFile.fileType.startsWith("audio/") ? (
                  <audio src={previewUrl} controls className="w-full" />
                ) : previewFile.fileType === "application/pdf" ? (
                  <iframe src={previewUrl} className="h-[60vh] w-full rounded-lg" />
                ) : previewFile.fileType === "text/plain" ? (
                  <pre className="max-h-[60vh] w-full overflow-auto whitespace-pre-wrap rounded-lg bg-gray-100 p-4 text-sm">
                    文本文件预览需要解码...
                  </pre>
                ) : (
                  <div className="flex flex-col items-center py-8">
                    <File className="h-16 w-16 text-gray-400 mb-4" />
                    <p className="text-gray-500">此文件类型暂不支持预览</p>
                    <button
                      onClick={() => handleDownloadFile(previewFile)}
                      className="mt-4 rounded-xl bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 transition"
                    >
                      下载文件
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  )
}
