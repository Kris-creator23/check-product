import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_MAC_DOWNLOAD_URL;
  if (!url) {
    return NextResponse.json({ error: "Download URL is not configured." }, { status: 500 });
  }

  return NextResponse.redirect(url);
}
