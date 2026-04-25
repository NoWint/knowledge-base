import { db } from '@/lib/db/database'
import { parsePEQuestions } from './pe-exam'
import type { Subject, Chapter, KnowledgePoint } from '@/types'

export async function seedDatabase() {
  const subjectCount = await db.subjects.count()
  if (subjectCount > 0) {
    return
  }

  const peSubject: Subject = {
    id: 'pe',
    name: '体育',
    icon: '⚽',
    gradeLevel: '7-9',
    description: '初中体育与健康',
    orderIndex: 10,
  }

  const peChapters: Chapter[] = [
    { id: 'pe-sports', subjectId: 'pe', parentId: null, name: '体育运动常识', orderIndex: 1, description: '田径、球类、体操、游泳等运动项目' },
    { id: 'pe-science', subjectId: 'pe', parentId: null, name: '运动人体科学常识', orderIndex: 2, description: '骨骼、肌肉、心肺、神经系统' },
    { id: 'pe-medical', subjectId: 'pe', parentId: null, name: '运动医学康复常识', orderIndex: 3, description: '运动损伤预防、处理与康复' },
    { id: 'pe-nutrition', subjectId: 'pe', parentId: null, name: '运动营养卫生常识', orderIndex: 4, description: '营养基础、运动营养、卫生' },
    { id: 'pe-firstaid', subjectId: 'pe', parentId: null, name: '急救常识', orderIndex: 5, description: '心肺复苏、急救处理' },
  ]

  const subChapters: Chapter[] = [
    { id: 'pe-sports-1', subjectId: 'pe', parentId: 'pe-sports', name: '田径运动', orderIndex: 1, description: '' },
    { id: 'pe-sports-2', subjectId: 'pe', parentId: 'pe-sports', name: '球类运动', orderIndex: 2, description: '' },
    { id: 'pe-sports-3', subjectId: 'pe', parentId: 'pe-sports', name: '体操与武术', orderIndex: 3, description: '' },
    { id: 'pe-sports-4', subjectId: 'pe', parentId: 'pe-sports', name: '游泳运动', orderIndex: 4, description: '' },
    { id: 'pe-sports-5', subjectId: 'pe', parentId: 'pe-sports', name: '运动项目基础知识', orderIndex: 5, description: '' },
    { id: 'pe-science-1', subjectId: 'pe', parentId: 'pe-science', name: '骨骼与关节', orderIndex: 1, description: '' },
    { id: 'pe-science-2', subjectId: 'pe', parentId: 'pe-science', name: '肌肉系统', orderIndex: 2, description: '' },
    { id: 'pe-science-3', subjectId: 'pe', parentId: 'pe-science', name: '心肺系统', orderIndex: 3, description: '' },
    { id: 'pe-science-4', subjectId: 'pe', parentId: 'pe-science', name: '神经系统', orderIndex: 4, description: '' },
    { id: 'pe-science-5', subjectId: 'pe', parentId: 'pe-science', name: '身体发育', orderIndex: 5, description: '' },
    { id: 'pe-medical-1', subjectId: 'pe', parentId: 'pe-medical', name: '运动损伤预防', orderIndex: 1, description: '' },
    { id: 'pe-medical-2', subjectId: 'pe', parentId: 'pe-medical', name: '常见运动损伤处理', orderIndex: 2, description: '' },
    { id: 'pe-medical-3', subjectId: 'pe', parentId: 'pe-medical', name: '运动康复', orderIndex: 3, description: '' },
    { id: 'pe-medical-4', subjectId: 'pe', parentId: 'pe-medical', name: '运动与健康', orderIndex: 4, description: '' },
    { id: 'pe-nutrition-1', subjectId: 'pe', parentId: 'pe-nutrition', name: '营养基础', orderIndex: 1, description: '' },
    { id: 'pe-nutrition-2', subjectId: 'pe', parentId: 'pe-nutrition', name: '运动营养', orderIndex: 2, description: '' },
    { id: 'pe-nutrition-3', subjectId: 'pe', parentId: 'pe-nutrition', name: '运动卫生', orderIndex: 3, description: '' },
    { id: 'pe-nutrition-4', subjectId: 'pe', parentId: 'pe-nutrition', name: '健康饮食', orderIndex: 4, description: '' },
    { id: 'pe-firstaid-1', subjectId: 'pe', parentId: 'pe-firstaid', name: '心肺复苏（CPR）', orderIndex: 1, description: '' },
    { id: 'pe-firstaid-2', subjectId: 'pe', parentId: 'pe-firstaid', name: '常见急救处理', orderIndex: 2, description: '' },
    { id: 'pe-firstaid-3', subjectId: 'pe', parentId: 'pe-firstaid', name: '运动急救', orderIndex: 3, description: '' },
    { id: 'pe-firstaid-4', subjectId: 'pe', parentId: 'pe-firstaid', name: '急救常识', orderIndex: 4, description: '' },
  ]

  const knowledgePoints: KnowledgePoint[] = subChapters.map(ch => ({
    id: ch.id,
    chapterId: ch.id,
    name: ch.name,
    description: ch.description,
    difficulty: 1,
    content: '',
    masteryLevel: 0,
  }))

  await db.transaction('rw', [db.subjects, db.chapters, db.knowledgePoints], async () => {
    await db.subjects.add(peSubject)
    await db.chapters.bulkAdd([...peChapters, ...subChapters])
    await db.knowledgePoints.bulkAdd(knowledgePoints)
  })

  const peQuestions = parsePEQuestions()
  if (peQuestions.length > 0) {
    const categoryToChapter: Record<string, string> = {
      '田径运动': 'pe-sports-1',
      '球类运动': 'pe-sports-2',
      '体操与武术': 'pe-sports-3',
      '游泳运动': 'pe-sports-4',
      '运动项目基础知识': 'pe-sports-5',
      '骨骼与关节': 'pe-science-1',
      '肌肉系统': 'pe-science-2',
      '心肺系统': 'pe-science-3',
      '神经系统': 'pe-science-4',
      '身体发育': 'pe-science-5',
      '运动损伤预防': 'pe-medical-1',
      '常见运动损伤处理': 'pe-medical-2',
      '运动康复': 'pe-medical-3',
      '运动与健康': 'pe-medical-4',
      '营养基础': 'pe-nutrition-1',
      '运动营养': 'pe-nutrition-2',
      '运动卫生': 'pe-nutrition-3',
      '健康饮食': 'pe-nutrition-4',
      '心肺复苏（CPR）': 'pe-firstaid-1',
      '常见急救处理': 'pe-firstaid-2',
      '运动急救': 'pe-firstaid-3',
      '急救常识': 'pe-firstaid-4',
    }

    const questionsData: any[] = []
    const optionsData: any[] = []

    for (const q of peQuestions) {
      const questionId = `q-pe-${String(q.questionNumber).padStart(3, '0')}`
      const chapterId = categoryToChapter[q.category] || 'pe-sports-1'

      questionsData.push({
        id: questionId,
        knowledgePointId: chapterId,
        type: 'single',
        difficulty: Math.ceil(q.questionNumber / 50),
        content: q.content,
        answer: q.answer,
        explanation: q.explanation,
        source: 'exam',
        tags: [q.category],
        estimatedTime: 60,
        fromAI: false,
      })

      const optionLabels = ['A', 'B', 'C', 'D']
      for (let i = 0; i < q.options.length; i++) {
        optionsData.push({
          id: `${questionId}-${optionLabels[i].toLowerCase()}`,
          questionId,
          label: optionLabels[i],
          content: q.options[i].text,
          isCorrect: q.answer === optionLabels[i],
        })
      }
    }

    await db.questions.bulkAdd(questionsData)
    await db.questionOptions.bulkAdd(optionsData)
    console.log(`Added ${peQuestions.length} PE exam questions`)
  }

  console.log('Database initialized')
}
