import { NextResponse } from "next/server";

export function GET() {
  const hasSupabaseConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  return NextResponse.json({
    status: "ok",
    supabaseConfigured: hasSupabaseConfig,
  });
}
