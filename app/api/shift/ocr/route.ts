import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const image = formData.get("image") as File;

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // 1. Upload to Supabase Storage
    const ext = image.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${ext}`;
    
    const { error: uploadError } = await supabase.storage
      .from("shifts")
      .upload(fileName, image, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from("shifts")
      .getPublicUrl(fileName);

    return NextResponse.json({
      image_url: publicUrl
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
