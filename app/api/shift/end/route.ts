import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supervisorId = cookieStore.get("supervisor_id")?.value;

    if (!supervisorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { shift_id, reg_number, lat, lng, image_url } = await req.json();

    // Get the current shift to calculate duration
    const { data: shift } = await supabase
      .from("shift_logs")
      .select("start_time")
      .eq("id", shift_id)
      .single();

    if (!shift) {
      return NextResponse.json({ error: "Shift not found" }, { status: 404 });
    }

    const startTime = new Date(shift.start_time).getTime();
    const endTime = new Date().getTime();
    const diff = endTime - startTime;
    
    const totalMinutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const durationStr = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

    // Update shift
    const { error: updateError } = await supabase
      .from("shift_logs")
      .update({
        end_time: new Date().toISOString(),
        duration: durationStr,
        duration_minutes: totalMinutes,
        end_image_url: image_url,
        end_lat: lat,
        end_lng: lng,
        status: "complete",
        updated_at: new Date().toISOString()
      })
      .eq("id", shift_id)
      .eq("supervisor_id", supervisorId);

    if (updateError) {
      return NextResponse.json({ error: "Failed to end shift" }, { status: 500 });
    }

    return NextResponse.json({ success: true, duration: durationStr });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
