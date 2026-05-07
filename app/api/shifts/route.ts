import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uc_id = searchParams.get("uc_id");
    const status = searchParams.get("status");

    let shiftsQuery = supabase
      .from("shift_logs")
      .select("*, supervisor:supervisors(name, phone), vehicle:vehicle(reg_number), uc:uc(uc_number, name)")
      .order("created_at", { ascending: false });

    if (uc_id && uc_id !== "all") {
      shiftsQuery = shiftsQuery.eq("uc_id", uc_id);
    }
    if (status && status !== "all") {
      shiftsQuery = shiftsQuery.eq("status", status);
    }

    const { data: shifts, error: shiftsError } = await shiftsQuery;

    const { data: alerts, error: alertsError } = await supabase
      .from("shift_alerts")
      .select("*, shift:shift_logs(supervisor_id, uc_id, vehicle_id)")
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (shiftsError || alertsError) {
      throw new Error("Failed to fetch data");
    }

    return NextResponse.json({ shifts: shifts || [], alerts: alerts || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
