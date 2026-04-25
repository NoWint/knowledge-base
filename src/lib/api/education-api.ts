import type { ApiResponse } from './types'

interface BaiduBaikeResponse {
  card?: Array<{
    lemma_title: string
    lemma_id: number
    abstract: string
    image_urls?: string[]
    tags?: string[]
  }>
  result?: Array<{
    title: string
    url: string
    abstract: string
  }>
}

interface EducationResource {
  id: string
  title: string
  subject: string
  grade?: string
  content: string
  summary?: string
  imageUrl?: string
  source: 'baidu' | 'khan' | 'national'
  url?: string
}

interface Subject {
  id: string
  name: string
  icon: string
  chapters: Chapter[]
}

interface Chapter {
  id: string
  name: string
  knowledgePoints: KnowledgePoint[]
}

interface KnowledgePoint {
  id: string
  name: string
  description?: string
  externalData?: EducationResource[]
}

class EducationAPIService {
  private baiduApiKey: string | null = null
  private baiduAccessToken: string | null = null
  private tokenExpiry: number = 0

  constructor() {
    if (typeof window !== 'undefined') {
      this.baiduApiKey = localStorage.getItem('baidu_api_key')
    }
  }

  configure(config: { baiduApiKey?: string; khanAcademyKey?: string }) {
    if (config.baiduApiKey) {
      this.baiduApiKey = config.baiduApiKey
      if (typeof window !== 'undefined') {
        localStorage.setItem('baidu_api_key', config.baiduApiKey)
      }
    }
  }

  isConfigured(): boolean {
    return !!this.baiduApiKey
  }

  private async getBaiduAccessToken(): Promise<string | null> {
    if (!this.baiduApiKey) return null

    if (this.baiduAccessToken && Date.now() < this.tokenExpiry) {
      return this.baiduAccessToken
    }

    try {
      const response = await fetch(
        `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${this.baiduApiKey}&client_secret=${this.baiduApiKey}`,
        { method: 'POST' }
      )
      const data: { access_token?: string; expires_in?: number } = await response.json()
      if (data.access_token) {
        this.baiduAccessToken = data.access_token
        this.tokenExpiry = Date.now() + ((data.expires_in || 0) - 60) * 1000
        return this.baiduAccessToken
      }
    } catch (error) {
      console.error('Failed to get Baidu access token:', error)
    }
    return null
  }

  async searchBaiduBaike(keyword: string, subject?: string): Promise<EducationResource[]> {
    if (!this.baiduApiKey) {
      console.warn('Baidu API key not configured')
      return []
    }

    try {
      const accessToken = await this.getBaiduAccessToken()
      if (!accessToken) return []

      const query = subject ? `${keyword} ${subject} 知识点` : `${keyword} 知识点`
      const response = await fetch(
        `https://aip.baidubce.com/rpc/2.0/kg/v1/search?access_token=${accessToken}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            limit: 10,
          }),
        }
      )

      const data: BaiduBaikeResponse = await response.json()
      const resources: EducationResource[] = []

      if (data.result) {
        for (const item of data.result) {
          resources.push({
            id: `baidu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: item.title,
            subject: subject || '通用',
            content: item.abstract,
            source: 'baidu',
            url: item.url,
          })
        }
      }

      return resources
    } catch (error) {
      console.error('Baidu Baike search failed:', error)
      return []
    }
  }

  async getKnowledgePointDetails(knowledgePoint: string, subject: string): Promise<EducationResource | null> {
    const results = await this.searchBaiduBaike(knowledgePoint, subject)
    return results[0] || null
  }

  async enrichKnowledgePoints(points: KnowledgePoint[], subject: string): Promise<KnowledgePoint[]> {
    const enriched: KnowledgePoint[] = []

    for (const point of points) {
      const resources = await this.searchBaiduBaike(point.name, subject)
      enriched.push({
        ...point,
        description: resources[0]?.content || point.description,
        externalData: resources,
      })

      await new Promise(resolve => setTimeout(resolve, 200))
    }

    return enriched
  }
}

export const educationAPI = new EducationAPIService()

export function getSubjectStructure(): Subject[] {
  return [
    {
      id: 'chinese',
      name: '语文',
      icon: '📚',
      chapters: [
        { id: 'chinese_1', name: '现代文阅读', knowledgePoints: [] },
        { id: 'chinese_2', name: '古诗文阅读', knowledgePoints: [] },
        { id: 'chinese_3', name: '写作', knowledgePoints: [] },
        { id: 'chinese_4', name: '基础知识', knowledgePoints: [] },
      ],
    },
    {
      id: 'math',
      name: '数学',
      icon: '📐',
      chapters: [
        { id: 'math_1', name: '代数', knowledgePoints: [] },
        { id: 'math_2', name: '几何', knowledgePoints: [] },
        { id: 'math_3', name: '函数', knowledgePoints: [] },
        { id: 'math_4', name: '概率统计', knowledgePoints: [] },
      ],
    },
    {
      id: 'english',
      name: '英语',
      icon: '🔤',
      chapters: [
        { id: 'english_1', name: '词汇', knowledgePoints: [] },
        { id: 'english_2', name: '语法', knowledgePoints: [] },
        { id: 'english_3', name: '阅读理解', knowledgePoints: [] },
        { id: 'english_4', name: '写作', knowledgePoints: [] },
      ],
    },
    {
      id: 'physics',
      name: '物理',
      icon: '⚡',
      chapters: [
        { id: 'physics_1', name: '力学', knowledgePoints: [] },
        { id: 'physics_2', name: '热学', knowledgePoints: [] },
        { id: 'physics_3', name: '电磁学', knowledgePoints: [] },
        { id: 'physics_4', name: '光学', knowledgePoints: [] },
      ],
    },
    {
      id: 'chemistry',
      name: '化学',
      icon: '🧪',
      chapters: [
        { id: 'chemistry_1', name: '物质的构成', knowledgePoints: [] },
        { id: 'chemistry_2', name: '化学反应', knowledgePoints: [] },
        { id: 'chemistry_3', name: '溶液', knowledgePoints: [] },
        { id: 'chemistry_4', name: '有机化学', knowledgePoints: [] },
      ],
    },
    {
      id: 'history',
      name: '历史',
      icon: '📜',
      chapters: [
        { id: 'history_1', name: '中国古代史', knowledgePoints: [] },
        { id: 'history_2', name: '中国近代史', knowledgePoints: [] },
        { id: 'history_3', name: '世界历史', knowledgePoints: [] },
      ],
    },
    {
      id: 'politics',
      name: '道德与法治',
      icon: '⚖️',
      chapters: [
        { id: 'politics_1', name: '心理健康', knowledgePoints: [] },
        { id: 'politics_2', name: '法治教育', knowledgePoints: [] },
        { id: 'politics_3', name: '国情教育', knowledgePoints: [] },
      ],
    },
    {
      id: 'geography',
      name: '地理',
      icon: '🌍',
      chapters: [
        { id: 'geography_1', name: '自然地理', knowledgePoints: [] },
        { id: 'geography_2', name: '人文地理', knowledgePoints: [] },
        { id: 'geography_3', name: '区域地理', knowledgePoints: [] },
      ],
    },
  ]
}

export function getGradeLevel(subjectId: string): string[] {
  const gradeMap: Record<string, string[]> = {
    chinese: ['七年级', '八年级', '九年级'],
    math: ['七年级', '八年级', '九年级'],
    english: ['七年级', '八年级', '九年级'],
    physics: ['八年级', '九年级'],
    chemistry: ['九年级'],
    history: ['七年级', '八年级', '九年级'],
    politics: ['七年级', '八年级', '九年级'],
    geography: ['七年级', '八年级', '九年级'],
  }
  return gradeMap[subjectId] || ['七年级', '八年级', '九年级']
}

export type { EducationResource, Subject, Chapter, KnowledgePoint }
