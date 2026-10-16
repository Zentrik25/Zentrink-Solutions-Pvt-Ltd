import { NextResponse } from "next/server";
import { issueFormToken } from "@/lib/enquiry/spam";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ token: issueFormToken() }, { headers: { "Cache-Control": "no-store" } });
}
