import { NextResponse } from "next/server"
import { getGoogleCalendarEvents } from "@/lib/actions/appointments"

export async function GET() {
  try {
    const events = await getGoogleCalendarEvents()
    return NextResponse.json(events)
  } catch (e) {
    return NextResponse.json([])
  }
}
