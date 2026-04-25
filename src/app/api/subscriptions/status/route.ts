import { NextRequest, NextResponse } from 'next/server'
import type { SubscriptionTier, UsageStats } from '@/lib/subscriptions/plans'

interface SubscriptionStatus {
  subscription: {
    id: string
    planId: SubscriptionTier
    status: 'active' | 'cancelled' | 'expired' | 'trial'
    currentPeriodEnd: string
    trialEndsAt?: string
  } | null
  usage: UsageStats
  limits: {
    students: number
    devices: number
    questions: number
    classes: number
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      const guestUsage: UsageStats = {
        studentCount: 0,
        deviceCount: 1,
        totalQuestions: 0,
        classesCount: 0,
      }

      return NextResponse.json({
        success: true,
        data: {
          subscription: null,
          usage: guestUsage,
          limits: {
            students: 1,
            devices: 2,
            questions: 1000,
            classes: 0,
          },
        } as SubscriptionStatus,
      })
    }

    const mockSubscription = {
      id: `sub_${userId}`,
      planId: 'FREE' as SubscriptionTier,
      status: 'active' as const,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }

    const mockUsage: UsageStats = {
      studentCount: 1,
      deviceCount: 2,
      totalQuestions: 156,
      classesCount: 0,
    }

    return NextResponse.json({
      success: true,
      data: {
        subscription: mockSubscription,
        usage: mockUsage,
        limits: {
          students: 1,
          devices: 2,
          questions: 1000,
          classes: 0,
        },
      } as SubscriptionStatus,
    })
  } catch (error) {
    console.error('Failed to fetch subscription status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subscription status' },
      { status: 500 }
    )
  }
}