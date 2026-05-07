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

    const { reg_number, lat, lng, image_url } = await req.json();

    // Find the vehicle by reg_number
    const { data: vehicle } = await supabase
      .from("vehicle")
      .select("id, uc_id")
      .eq("reg_number", reg_number)
      .single();

    // Also get the supervisor's assigned UC
    const { data: supervisor } = await supabase
      .from("supervisors")
      .select("uc_id")
      .eq("id", supervisorId)
      .single();

    let alertMsg = null;
    let vehicleId = vehicle?.id || null;

    if (!vehicle) {
      alertMsg = `Invalid vehicle reg entered: ${reg_number}`;
    } else {
      // Check if this vehicle is already in an active shift
      const { data: activeVehicleShift } = await supabase
        .from("shift_logs")
        .select("id")
        .eq("vehicle_id", vehicle.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      if (activeVehicleShift) {
        return NextResponse.json({ error: `Vehicle ${reg_number} is already in an active shift.` }, { status: 400 });
      }
    }

    // Insert shift log
    const { data: shift, error: shiftError } = await supabase
      .from("shift_logs")
      .insert({
        supervisor_id: supervisorId,
        uc_id: supervisor?.uc_id || null,
        vehicle_id: vehicleId,
        start_image_url: image_url,
        start_lat: lat,
        start_lng: lng,
        status: "active"
      })
      .select("*, vehicle(reg_number)")
      .single();

    if (shiftError || !shift) {
      return NextResponse.json({ error: "Failed to start shift" }, { status: 500 });
    }

    // If there's an alert, create it
    if (alertMsg) {
      await supabase.from("shift_alerts").insert({
        shift_id: shift.id,
        type: "invalid_vehicle",
        message: alertMsg,
      });
    }

    return NextResponse.json({ 
      success: true, 
      shift,
      alert: alertMsg 
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
