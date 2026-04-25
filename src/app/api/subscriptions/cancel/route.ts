import { NextRequest, NextResponse } from 'next/server'

interface CancelRequest {
  subscriptionId: string
}

export async function POST(request: NextRequest) {
  try {
    const body: CancelRequest = await request.json()
    const { subscriptionId } = body

    if (!subscriptionId) {
      return NextResponse.json(
        { success: false, error: 'Missing subscription ID' },
        { status: 400 }
      )
    }

    const cancelledSubscription = {
      id: subscriptionId,
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }

    return NextResponse.json({
      success: true,
      data: cancelledSubscription,
    })
  } catch (error) {
    console.error('Failed to cancel subscription:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
