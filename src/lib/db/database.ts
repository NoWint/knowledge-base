import Dexie, { type EntityTable } from 'dexie'
import type {
  User,
  UserProfile,
  UserSubject,
  Subject,
  Chapter,
  KnowledgePoint,
  Article,
  Question,
  QuestionOption,
  UserAnswer,
  WrongQuestion,
  TestPaper,
  TestPaperQuestion,
  KnowledgeRelation,
  UserFile,
  FileFolder,
  FileTag,
  FileKnowledgeLink,
  ReviewSchedule,
  FlashCard,
  UserFlashCardReview,
  LearningGoal,
  StudySession,
  DailyStats,
} from '@/types'

const db = new Dexie('KnowledgeBaseDB') as Dexie & {
  users: EntityTable<User, 'id'>
  userProfiles: EntityTable<UserProfile, 'id'>
  userSubjects: EntityTable<UserSubject, 'id'>
  subjects: EntityTable<Subject, 'id'>
  chapters: EntityTable<Chapter, 'id'>
  knowledgePoints: EntityTable<KnowledgePoint, 'id'>
  articles: EntityTable<Article, 'id'>
  questions: EntityTable<Question, 'id'>
  questionOptions: EntityTable<QuestionOption, 'id'>
  userAnswers: EntityTable<UserAnswer, 'id'>
  wrongQuestions: EntityTable<WrongQuestion, 'id'>
  testPapers: EntityTable<TestPaper, 'id'>
  testPaperQuestions: EntityTable<TestPaperQuestion, 'id'>
  knowledgeRelations: EntityTable<KnowledgeRelation, 'id'>
  userFiles: EntityTable<UserFile, 'id'>
  fileFolders: EntityTable<FileFolder, 'id'>
  fileTags: EntityTable<FileTag, 'id'>
  fileKnowledgeLinks: EntityTable<FileKnowledgeLink, 'id'>
  reviewSchedules: EntityTable<ReviewSchedule, 'id'>
  flashCards: EntityTable<FlashCard, 'id'>
  userFlashCardReviews: EntityTable<UserFlashCardReview, 'id'>
  learningGoals: EntityTable<LearningGoal, 'id'>
  studySessions: EntityTable<StudySession, 'id'>
  dailyStats: EntityTable<DailyStats, 'id'>
}

const DB_VERSION = 3

db.version(1).stores({
  users: 'id, name, createdAt',
  userProfiles: 'id, userId, currentGrade',
  userSubjects: 'id, userId, subjectId',
  subjects: 'id, name, gradeLevel, orderIndex',
  chapters: 'id, subjectId, parentId, orderIndex',
  knowledgePoints: 'id, chapterId, name, difficulty',
  articles: 'id, knowledgePointId, type, createdAt',
  questions: 'id, knowledgePointId, type, difficulty, *tags',
  questionOptions: 'id, questionId, label, isCorrect',
  userAnswers: 'id, userId, questionId, answeredAt, isCorrect',
  wrongQuestions: 'id, userId, questionId, status, lastWrongAt',
  testPapers: 'id, name, subjectId',
  testPaperQuestions: 'id, testPaperId, questionId, orderIndex',
  knowledgeRelations: 'id, sourceKpId, targetKpId, relationType',
  userFiles: 'id, userId, folderId, fileName, fileType, createdAt',
  fileFolders: 'id, userId, parentId, folderName',
  fileTags: 'id, userId, tagName',
  fileKnowledgeLinks: 'id, fileId, knowledgePointId',
  reviewSchedules: 'id, userId, questionId, nextReviewDate',
  flashCards: 'id, knowledgePointId, createdAt',
  userFlashCardReviews: 'id, userId, flashCardId, nextReviewDate',
  learningGoals: 'id, userId, type, status',
  studySessions: 'id, userId, startTime, type',
  dailyStats: 'id, userId, date',
})

db.version(2).stores({
  users: 'id, name, createdAt',
  userProfiles: 'id, userId, currentGrade',
  userSubjects: 'id, userId, subjectId',
  subjects: 'id, name, gradeLevel, orderIndex',
  chapters: 'id, subjectId, parentId, orderIndex',
  knowledgePoints: 'id, chapterId, name, difficulty',
  articles: 'id, knowledgePointId, type, createdAt',
  questions: 'id, knowledgePointId, type, difficulty, *tags',
  questionOptions: 'id, questionId, label, isCorrect',
  userAnswers: 'id, userId, questionId, answeredAt, isCorrect',
  wrongQuestions: 'id, userId, questionId, status, lastWrongAt',
  testPapers: 'id, name, subjectId',
  testPaperQuestions: 'id, testPaperId, questionId, orderIndex',
  knowledgeRelations: 'id, sourceKpId, targetKpId, relationType',
  userFiles: 'id, userId, folderId, fileName, fileType, createdAt',
  fileFolders: 'id, userId, parentId, folderName',
  fileTags: 'id, userId, tagName',
  fileKnowledgeLinks: 'id, fileId, knowledgePointId',
  reviewSchedules: 'id, userId, questionId, nextReviewDate',
  flashCards: 'id, knowledgePointId, createdAt',
  userFlashCardReviews: 'id, userId, flashCardId, nextReviewDate',
  learningGoals: 'id, userId, type, status',
  studySessions: 'id, userId, startTime, type',
  dailyStats: 'id, userId, date',
}).upgrade(tx => {
  return tx.table('wrongQuestions').toCollection().modify(wq => {
    if (!('wrongReason' in wq)) wq.wrongReason = null
    if (!('lastWrongReason' in wq)) wq.lastWrongReason = ''
  })
})

db.version(3).stores({
  users: 'id, name, createdAt',
  userProfiles: 'id, userId, currentGrade',
  userSubjects: 'id, userId, subjectId',
  subjects: 'id, name, gradeLevel, orderIndex',
  chapters: 'id, subjectId, parentId, orderIndex',
  knowledgePoints: 'id, chapterId, name, difficulty',
  articles: 'id, knowledgePointId, type, createdAt',
  questions: 'id, knowledgePointId, type, difficulty, *tags',
  questionOptions: 'id, questionId, label, isCorrect',
  userAnswers: 'id, userId, questionId, answeredAt, isCorrect',
  wrongQuestions: 'id, userId, questionId, status, lastWrongAt',
  testPapers: 'id, name, subjectId',
  testPaperQuestions: 'id, testPaperId, questionId, orderIndex',
  knowledgeRelations: 'id, sourceKpId, targetKpId, relationType',
  userFiles: 'id, userId, folderId, fileName, fileType, createdAt',
  fileFolders: 'id, userId, parentId, folderName',
  fileTags: 'id, userId, tagName',
  fileKnowledgeLinks: 'id, fileId, knowledgePointId',
  reviewSchedules: 'id, userId, questionId, nextReviewDate',
  flashCards: 'id, knowledgePointId, createdAt',
  userFlashCardReviews: 'id, userId, flashCardId, nextReviewDate',
  learningGoals: 'id, userId, type, status',
  studySessions: 'id, userId, startTime, type',
  dailyStats: 'id, userId, date',
})

export { db, DB_VERSION }

export async function runMigrations(): Promise<void> {
  const storedVersion = localStorage.getItem('knowledge_db_version')
  if (!storedVersion || parseInt(storedVersion) < DB_VERSION) {
    localStorage.setItem('knowledge_db_version', String(DB_VERSION))
  }
}