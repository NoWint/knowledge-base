export type UserRole = 'student' | 'teacher' | 'admin'

export type ClassStatus = 'active' | 'archived'

export interface Teacher {
  id: string
  userId: string
  schoolId: string
  employeeNumber: string
  subjects: string[]
  grades: string[]
  phone: string
  email: string
  hireDate: Date
  status: 'active' | 'inactive'
}

export interface School {
  id: string
  name: string
  level: 'primary' | 'middle' | 'high' | 'secondary' | 'university'
  region: string
  address: string
  phone: string
  adminId: string
  createdAt: Date
  subscription: 'free' | 'basic' | 'pro' | 'enterprise'
  maxTeachers: number
  maxStudents: number
}

export interface Class {
  id: string
  name: string
  grade: string
  subject: string
  teacherId: string
  schoolId: string
  inviteCode: string
  studentCount: number
  status: ClassStatus
  createdAt: Date
  description: string
}

export interface ClassStudent {
  id: string
  classId: string
  studentId: string
  joinedAt: Date
  role: 'student' | 'assistant'
}

export interface Assignment {
  id: string
  title: string
  description: string
  classId: string
  teacherId: string
  subjectId: string
  knowledgePointIds: string[]
  questionCount: number
  totalPoints: number
  dueDate: Date
  assignedAt: Date
  status: 'draft' | 'published' | 'closed'
  allowLateSubmission: boolean
  timeLimit: number | null
}

export interface AssignmentSubmission {
  id: string
  assignmentId: string
  studentId: string
  score: number | null
  status: 'pending' | 'submitted' | 'graded'
  submittedAt: Date | null
  gradedAt: Date | null
  feedback: string | null
  timeSpent: number | null
}

export interface ClassAnalytics {
  classId: string
  totalStudents: number
  activeStudents: number
  averageCompletionRate: number
  averageScore: number
  totalQuestionsAnswered: number
  masteryByTopic: {
    knowledgePointId: string
    name: string
    mastery: number
  }[]
  weeklyActivity: {
    date: string
    submissions: number
    avgScore: number
  }[]
}

export interface TeacherDashboard {
  totalClasses: number
  totalStudents: number
  pendingGrading: number
  upcomingDeadlines: Assignment[]
  recentActivity: {
    type: 'submission' | 'assignment' | 'enrollment'
    description: string
    timestamp: Date
  }[]
}

export interface BillingRecord {
  id: string
  schoolId: string
  amount: number
  currency: string
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  description: string
  dueDate: Date
  paidAt: Date | null
  createdAt: Date
}

export interface UsageMetric {
  id: string
  schoolId: string
  date: string
  activeUsers: number
  totalLogins: number
  questionsAnswered: number
  studyMinutes: number
  avgSessionLength: number
}

export interface SystemStats {
  totalSchools: number
  totalTeachers: number
  totalStudents: number
  totalQuestions: number
  totalAnswers: number
  dailyActiveUsers: number
  weeklyGrowth: number
}
