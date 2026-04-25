import type { User } from '@/types'

export interface Teacher extends User {
  teacherId: string
  schoolId?: string
  subjects: string[]
  classes: string[]
  studentCount: number
  assignmentCount: number
  joinDate: Date
}

export interface SchoolClass {
  id: string
  name: string
  subject: string
  grade: string
  studentCount: number
  teacherId: string
  inviteCode: string
  status: "active" | "inactive" | "archived"
  createdAt: Date
  averageScore: number
  completionRate: number
}

export interface Assignment {
  id: string
  classId: string
  teacherId: string
  title: string
  description: string
  subject: string
  dueDate: Date
  questionCount: number
  submissionCount: number
  averageScore: number
  status: "draft" | "published" | "closed"
  createdAt: Date
}

export interface StudentProgress {
  studentId: string
  studentName: string
  totalQuestions: number
  correctAnswers: number
  accuracy: number
  streak: number
  lastActive: Date
  recentScores: number[]
  weakTopics: Array<{
    topic: string
    errorRate: number
  }>
}

const mockClasses: SchoolClass[] = [
  {
    id: "class_1",
    name: "初三1班",
    subject: "数学",
    grade: "九年级",
    studentCount: 35,
    teacherId: "teacher_1",
    inviteCode: "MATH2024",
    status: "active",
    createdAt: new Date(),
    averageScore: 78.5,
    completionRate: 0.85,
  },
  {
    id: "class_2",
    name: "初三2班",
    subject: "数学",
    grade: "九年级",
    studentCount: 32,
    teacherId: "teacher_1",
    inviteCode: "MATH2025",
    status: "active",
    createdAt: new Date(),
    averageScore: 82.1,
    completionRate: 0.9,
  },
]

const mockAssignments: Assignment[] = [
  {
    id: "assign_1",
    classId: "class_1",
    teacherId: "teacher_1",
    title: "二次函数练习",
    description: "完成课本P45-P48的练习题",
    subject: "数学",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    questionCount: 20,
    submissionCount: 28,
    averageScore: 75.3,
    status: "published",
    createdAt: new Date(),
  },
]

export async function getTeacherByUserId(userId: string): Promise<Teacher | null> {
  return {
    id: userId,
    name: "教师",
    avatar: null,
    userType: "teacher",
    teacherId: userId,
    subjects: ["数学"],
    classes: mockClasses.map(c => c.id),
    studentCount: 67,
    assignmentCount: mockAssignments.length,
    joinDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export async function getClassesByTeacher(teacherId: string): Promise<SchoolClass[]> {
  return mockClasses
}

export async function createClass(data: {
  name: string
  subject: string
  grade: string
  description?: string
}): Promise<SchoolClass> {
  const newClass: SchoolClass = {
    id: `class_${Date.now()}`,
    name: data.name,
    subject: data.subject,
    grade: data.grade,
    studentCount: 0,
    teacherId: "teacher_1",
    inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
    status: "active",
    createdAt: new Date(),
    averageScore: 0,
    completionRate: 0,
  }
  mockClasses.push(newClass)
  return newClass
}

export async function addStudentToClass(
  classId: string,
  studentData: { name: string; email: string; grade: string; parentPhone?: string }
): Promise<boolean> {
  return true
}

export async function getAssignmentsByTeacher(teacherId: string): Promise<Assignment[]> {
  return mockAssignments
}

export async function getStudentProgress(classId: string): Promise<StudentProgress[]> {
  return []
}

export async function getTeacherDashboard(teacherId: string) {
  return {
    totalStudents: 67,
    totalClasses: mockClasses.length,
    totalAssignments: mockAssignments.length,
    averageScore: 80.3,
    completionRate: 0.87,
    recentActivity: [],
  }
}
