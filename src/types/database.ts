export type QuestionType = 'single' | 'multiple' | 'fill' | 'judge' | 'essay'

export type ArticleType = 'teaching' | 'overview' | 'method' | 'analysis' | 'summary' | 'policy'

export type KnowledgeRelationType = 'prerequisite' | 'successor' | 'related' | 'cross_subject' | 'extension'

export type WrongQuestionStatus = 'wrong' | 'correcting' | 'mastered'

export type WrongReason = 'careless' | 'misunderstanding' | 'forgot' | null

export type GoalType = 'daily_questions' | 'weekly_streak' | 'mastery_level'

export type GoalStatus = 'active' | 'completed' | 'expired'

export type SessionType = 'practice' | 'review' | 'cards' | 'exam'

export interface Subject {
  id: string
  name: string
  icon: string
  gradeLevel: string
  description: string
  orderIndex: number
}

export interface Chapter {
  id: string
  subjectId: string
  parentId: string | null
  name: string
  orderIndex: number
  description: string
}

export interface KnowledgePoint {
  id: string
  chapterId: string
  name: string
  description: string
  difficulty: number
  content: string
  masteryLevel: number
}

export interface Article {
  id: string
  knowledgePointId: string
  title: string
  content: string
  type: ArticleType
  author: string
  createdAt: Date
}

export interface Question {
  id: string
  knowledgePointId: string
  type: QuestionType
  difficulty: number
  content: string
  answer: string
  explanation: string
  source: string
  tags: string[]
  estimatedTime: number
  fromAI: boolean
}

export interface QuestionOption {
  id: string
  questionId: string
  label: string
  content: string
  isCorrect: boolean
}

export interface TestPaper {
  id: string
  name: string
  description: string
  subjectId: string
  timeLimit: number | null
  totalScore: number
}

export interface TestPaperQuestion {
  id: string
  testPaperId: string
  questionId: string
  orderIndex: number
}

export interface KnowledgeRelation {
  id: string
  sourceKpId: string
  targetKpId: string
  relationType: KnowledgeRelationType
  description: string
}

export interface User {
  id: string
  name: string
  avatar: string | null
  userType?: 'student' | 'teacher'
  createdAt: Date
  updatedAt: Date
}

export interface UserProfile {
  id: string
  userId: string
  currentGrade: string
  preferences: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export interface UserSubject {
  id: string
  userId: string
  subjectId: string
  createdAt: Date
}

export interface UserAnswer {
  id: string
  userId: string
  questionId: string
  answer: string
  isCorrect: boolean
  answeredAt: Date
  timeSpent: number
}

export interface WrongQuestion {
  id: string
  userId: string
  questionId: string
  wrongCount: number
  lastWrongAt: Date
  masteredAt: Date | null
  status: WrongQuestionStatus
  createdAt: Date
  wrongReason: WrongReason
  lastWrongReason: string
}

export interface UserFile {
  id: string
  userId: string
  folderId: string | null
  fileName: string
  fileType: string
  fileSize: number
  fileData: Blob
  tags: string[]
  knowledgePointId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface FileFolder {
  id: string
  userId: string
  parentId: string | null
  folderName: string
  createdAt: Date
}

export interface FileTag {
  id: string
  userId: string
  tagName: string
  color: string
}

export interface FileKnowledgeLink {
  id: string
  fileId: string
  knowledgePointId: string
  createdAt: Date
}

export interface ReviewSchedule {
  id: string
  userId: string
  questionId: string
  interval: number
  easeFactor: number
  repetitions: number
  nextReviewDate: Date
  lastReviewDate: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface LearningGoal {
  id: string
  userId: string
  type: GoalType
  targetValue: number
  currentValue: number
  startDate: Date
  endDate: Date
  status: GoalStatus
}

export interface StudySession {
  id: string
  userId: string
  startTime: Date
  endTime: Date | null
  type: SessionType
  contentSummary: string
}

export interface FlashCard {
  id: string
  knowledgePointId: string
  front: string
  back: string
  createdAt: Date
  updatedAt: Date
}

export interface UserFlashCardReview {
  id: string
  userId: string
  flashCardId: string
  easeFactor: number
  interval: number
  repetitions: number
  nextReviewDate: Date
  lastReviewDate: Date | null
}

export interface DailyStats {
  id: string
  userId: string
  date: string
  totalQuestions: number
  correctCount: number
  studyMinutes: number
  topicsCovered: string[]
}

export interface UserStreak {
  id: string
  userId: string
  currentStreak: number
  longestStreak: number
  lastStudyDate: string | null
  totalStudyDays: number
  lastUpdated: Date
}
