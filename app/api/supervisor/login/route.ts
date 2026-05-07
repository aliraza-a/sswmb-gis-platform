import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { phone, pin } = await req.json();

    const { data: supervisor, error } = await supabase
      .from("supervisors")
      .select("*")
      .eq("phone", phone)
      .eq("pin", pin)
      .eq("status", "active")
      .single();

    if (error || !supervisor) {
      return NextResponse.json(
        { error: "Invalid phone number or PIN" },
        { status: 401 }
      );
    }

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("supervisor_id", supervisor.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("supervisor_id");
  return NextResponse.json({ success: true });
}
