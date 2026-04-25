"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Building2, Users, Settings, Bell, Save, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface SchoolSettings {
  name: string
  level: string
  region: string
  address: string
  phone: string
  email: string
}

interface SubscriptionInfo {
  plan: 'free' | 'pro' | 'enterprise'
  status: 'active' | 'cancelled' | 'expired'
  maxTeachers: number
  maxStudents: number
  teacherCount: number
  studentCount: number
  endDate?: Date
}

export default function SchoolPage() {
  const [activeTab, setActiveTab] = useState<'info' | 'settings' | 'subscription'>('info')
  const [loading, setLoading] = useState(false)
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>({
    name: '',
    level: '',
    region: '',
    address: '',
    phone: '',
    email: '',
  })
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('school_settings')
    if (stored) {
      setSchoolSettings(JSON.parse(stored))
    } else {
      setSchoolSettings({
        name: '我的学校',
        level: 'high',
        region: '',
        address: '',
        phone: '',
        email: '',
      })
    }

    const subInfo = localStorage.getItem('subscription_info')
    if (subInfo) {
      setSubscriptionInfo(JSON.parse(subInfo))
    } else {
      setSubscriptionInfo({
        plan: 'free',
        status: 'active',
        maxTeachers: 5,
        maxStudents: 50,
        teacherCount: 0,
        studentCount: 0,
      })
    }
  }, [])

  const handleSave = async () => {
    setLoading(true)
    localStorage.setItem('school_settings', JSON.stringify(schoolSettings))
    await new Promise(resolve => setTimeout(resolve, 500))
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const getPlanName = (plan: string) => {
    const names: Record<string, string> = {
      free: '免费版',
      pro: '专业版',
      enterprise: '旗舰版'
    }
    return names[plan] || plan
  }

  const getPlanColor = (plan: string) => {
    const colors: Record<string, string> = {
      free: 'bg-gray-100 text-gray-700',
      pro: 'bg-blue-100 text-blue-700',
      enterprise: 'bg-purple-100 text-purple-700'
    }
    return colors[plan] || colors.free
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">学校设置</h1>
          <p className="text-gray-500 mt-1">管理学校信息和配置</p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              保存中...
            </>
          ) : saved ? (
            '已保存!'
          ) : (
            <>
              <Save className="w-4 h-4" />
              保存设置
            </>
          )}
        </button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200">
              <div className="flex">
                {[
                  { id: 'info', label: '基本信息', icon: Building2 },
                  { id: 'settings', label: '系统设置', icon: Settings },
                  { id: 'subscription', label: '订阅管理', icon: Bell },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={cn(
                      "flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors",
                      activeTab === tab.id
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {activeTab === 'info' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                      {schoolSettings.name?.charAt(0) || '校'}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{schoolSettings.name || '未命名学校'}</h3>
                      <p className="text-sm text-gray-500">ID: {schoolSettings.level || 'unknown'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">学校名称</label>
                      <input
                        type="text"
                        value={schoolSettings.name}
                        onChange={(e) => setSchoolSettings({ ...schoolSettings, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">学校级别</label>
                      <select
                        value={schoolSettings.level}
                        onChange={(e) => setSchoolSettings({ ...schoolSettings, level: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="">请选择</option>
                        <option value="primary">小学</option>
                        <option value="middle">初中</option>
                        <option value="high">高中</option>
                        <option value=" vocational">职高</option>
                        <option value="university">大学</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">所在地区</label>
                      <input
                        type="text"
                        value={schoolSettings.region}
                        onChange={(e) => setSchoolSettings({ ...schoolSettings, region: e.target.value })}
                        placeholder="省/市/区"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">联系电话</label>
                      <input
                        type="tel"
                        value={schoolSettings.phone}
                        onChange={(e) => setSchoolSettings({ ...schoolSettings, phone: e.target.value })}
                        placeholder="联系电话"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">详细地址</label>
                      <input
                        type="text"
                        value={schoolSettings.address}
                        onChange={(e) => setSchoolSettings({ ...schoolSettings, address: e.target.value })}
                        placeholder="学校详细地址"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">管理员邮箱</label>
                      <input
                        type="email"
                        value={schoolSettings.email}
                        onChange={(e) => setSchoolSettings({ ...schoolSettings, email: e.target.value })}
                        placeholder="管理员邮箱"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">通知设置</h3>
                    <div className="space-y-3">
                      {[
                        { id: 'email_notify', label: '邮件通知', desc: '接收作业提交和成绩更新邮件' },
                        { id: 'sms_notify', label: '短信通知', desc: '重要消息发送短信提醒' },
                        { id: 'weekly_report', label: '周报', desc: '每周发送学习情况汇总' },
                      ].map((item) => (
                        <label key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.label}</p>
                            <p className="text-xs text-gray-500">{item.desc}</p>
                          </div>
                          <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">安全设置</h3>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                        <div>
                          <p className="text-sm font-medium text-gray-900">双因素认证</p>
                          <p className="text-xs text-gray-500">登录时需要手机验证码</p>
                        </div>
                        <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                      </label>
                      <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                        <div>
                          <p className="text-sm font-medium text-gray-900">登录IP限制</p>
                          <p className="text-xs text-gray-500">只允许在校园网络登录</p>
                        </div>
                        <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'subscription' && subscriptionInfo && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn("px-2 py-0.5 rounded text-xs font-medium", getPlanColor(subscriptionInfo.plan))}>
                          {getPlanName(subscriptionInfo.plan)}
                        </span>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-xs font-medium",
                          subscriptionInfo.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        )}>
                          {subscriptionInfo.status === 'active' ? '使用中' : '已过期'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {subscriptionInfo.maxTeachers === -1 ? '无限' : subscriptionInfo.maxTeachers} 教师 · {subscriptionInfo.maxStudents === -1 ? '无限' : subscriptionInfo.maxStudents} 学生
                      </p>
                    </div>
                    <a
                      href="/subscription"
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                    >
                      升级方案
                    </a>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">已用教师</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {subscriptionInfo.teacherCount}
                        <span className="text-sm font-normal text-gray-500 ml-1">/ {subscriptionInfo.maxTeachers === -1 ? '∞' : subscriptionInfo.maxTeachers}</span>
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">已用学生</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {subscriptionInfo.studentCount}
                        <span className="text-sm font-normal text-gray-500 ml-1">/ {subscriptionInfo.maxStudents === -1 ? '∞' : subscriptionInfo.maxStudents}</span>
                      </p>
                    </div>
                  </div>

                  {subscriptionInfo.endDate && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-sm text-amber-800">
                        订阅将于 {new Date(subscriptionInfo.endDate).toLocaleDateString()} 到期
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">快速操作</h3>
            <div className="space-y-2">
              <a href="/admin/teachers" className="flex items-center gap-2 p-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">
                <Users className="w-4 h-4" />
                管理教师
              </a>
              <a href="/admin/usage" className="flex items-center gap-2 p-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">
                <Settings className="w-4 h-4" />
                使用统计
              </a>
              <a href="/admin/import" className="flex items-center gap-2 p-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">
                <Bell className="w-4 h-4" />
                导入数据
              </a>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">帮助</h3>
            <p className="text-xs text-gray-500 mb-3">需要帮助？查看使用文档或联系客服。</p>
            <div className="space-y-2">
              <a href="#" className="block text-xs text-blue-600 hover:underline">使用文档</a>
              <a href="#" className="block text-xs text-blue-600 hover:underline">常见问题</a>
              <a href="#" className="block text-xs text-blue-600 hover:underline">联系客服</a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
