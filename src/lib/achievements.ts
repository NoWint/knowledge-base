export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: "streak" | "mastery" | "exploration" | "consistency" | "speed"
  requirement: number
  unlockedAt: Date | null
}

export interface UserAchievement extends Achievement {
  progress: number
  isUnlocked: boolean
}

export const ACHIEVEMENTS: Omit<Achievement, "unlockedAt">[] = [
  { id: "streak_3", name: "初露锋芒", description: "连续学习3天", icon: "🌱", category: "streak", requirement: 3 },
  { id: "streak_7", name: "习惯养成", description: "连续学习7天", icon: "🔥", category: "streak", requirement: 7 },
  { id: "streak_30", name: "月度学霸", description: "连续学习30天", icon: "⚡", category: "streak", requirement: 30 },
  { id: "streak_100", name: "百日英雄", description: "连续学习100天", icon: "👑", category: "streak", requirement: 100 },

  { id: "questions_50", name: "初试牛刀", description: "完成50道题", icon: "✏️", category: "mastery", requirement: 50 },
  { id: "questions_200", name: "题海战士", description: "完成200道题", icon: "📝", category: "mastery", requirement: 200 },
  { id: "questions_500", name: "刷题达人", description: "完成500道题", icon: "🏆", category: "mastery", requirement: 500 },
  { id: "questions_1000", name: "题圣", description: "完成1000道题", icon: "🎓", category: "mastery", requirement: 1000 },

  { id: "accuracy_80", name: "稳定发挥", description: "正确率达到80%", icon: "🎯", category: "mastery", requirement: 80 },
  { id: "accuracy_90", name: "精益求精", description: "正确率达到90%", icon: "💯", category: "mastery", requirement: 90 },
  { id: "accuracy_100", name: "完美无缺", description: "正确率达到100%", icon: "⭐", category: "mastery", requirement: 100 },

  { id: "subjects_all", name: "全科探索", description: "学习所有学科", icon: "🌍", category: "exploration", requirement: 10 },
  { id: "chapters_50", name: "章节猎人", description: "学习50个章节", icon: "📚", category: "exploration", requirement: 50 },
  { id: "kp_100", name: "知识点收集者", description: "学习100个知识点", icon: "💎", category: "exploration", requirement: 100 },

  { id: "daily_7", name: "周冠军", description: "一周每天都有学习", icon: "📅", category: "consistency", requirement: 7 },
  { id: "daily_30", name: "月冠军", description: "一个月每天都有学习", icon: "🗓️", category: "consistency", requirement: 30 },
]

export function checkAchievements(
  userStats: {
    currentStreak: number
    totalQuestions: number
    correctAnswers: number
    subjectsStudied: number
    chaptersStudied: number
    knowledgePointsStudied: number
    studyDays: number
  }
): UserAchievement[] {
  const accuracy = userStats.totalQuestions > 0
    ? Math.round((userStats.correctAnswers / userStats.totalQuestions) * 100)
    : 0

  return ACHIEVEMENTS.map(achievement => {
    let progress = 0

    switch (achievement.category) {
      case "streak":
        progress = userStats.currentStreak
        break
      case "mastery":
        if (achievement.id.startsWith("questions_")) {
          progress = userStats.totalQuestions
        } else if (achievement.id.startsWith("accuracy_")) {
          progress = accuracy
        }
        break
      case "exploration":
        if (achievement.id === "subjects_all") {
          progress = userStats.subjectsStudied
        } else if (achievement.id === "chapters_50") {
          progress = userStats.chaptersStudied
        } else if (achievement.id === "kp_100") {
          progress = userStats.knowledgePointsStudied
        }
        break
      case "consistency":
        progress = userStats.studyDays
        break
    }

    return {
      ...achievement,
      unlockedAt: progress >= achievement.requirement ? new Date() : null,
      progress: Math.min(progress, achievement.requirement),
      isUnlocked: progress >= achievement.requirement,
    }
  })
}
