import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { alert_id } = await req.json();

    if (!alert_id) {
      return NextResponse.json({ error: "Alert ID is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("shift_alerts")
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString()
      })
      .eq("id", alert_id);

    if (error) {
      throw new Error("Failed to resolve alert");
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
