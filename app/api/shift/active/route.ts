import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supervisorId = cookieStore.get("supervisor_id")?.value;

    if (!supervisorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get supervisor details
    const { data: supervisor, error: supError } = await supabase
      .from("supervisors")
      .select("*, uc(name, uc_number)")
      .eq("id", supervisorId)
      .single();

    if (supError || !supervisor) {
      return NextResponse.json({ error: "Supervisor not found" }, { status: 404 });
    }

    // Get active shifts
    const { data: activeShifts } = await supabase
      .from("shift_logs")
      .select("*, vehicle(reg_number), uc(name, uc_number)")
      .eq("supervisor_id", supervisorId)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    return NextResponse.json({
      supervisor: {
        id: supervisor.id,
        name: supervisor.name,
        uc_id: supervisor.uc_id,
        uc_name: supervisor.uc?.name,
        uc_number: supervisor.uc?.uc_number,
      },
      activeShifts: activeShifts || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
