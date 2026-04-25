import { NextResponse } from 'next/server'
import { PLANS } from '@/lib/subscriptions/plans'

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: PLANS,
    })
  } catch (error) {
    console.error('Failed to fetch plans:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch plans' },
      { status: 500 }
    )
  }
}