import { NextRequest, NextResponse } from 'next/server'
import type { SubscriptionTier } from '@/lib/subscriptions/plans'

interface CreateSubscriptionRequest {
  userId: string
  planId: SubscriptionTier
  paymentMethod?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateSubscriptionRequest = await request.json()
    const { userId, planId } = body

    if (!userId || !planId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const mockSubscription = {
      id: `sub_${Date.now()}`,
      userId,
      planId,
      status: 'active' as const,
      startedAt: new Date(),
      expiresAt: null,
      cancelledAt: null,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    }

    return NextResponse.json({
      success: true,
      data: mockSubscription,
    })
  } catch (error) {
    console.error('Failed to create subscription:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create subscription' },
      { status: 500 }
    )
  }
}