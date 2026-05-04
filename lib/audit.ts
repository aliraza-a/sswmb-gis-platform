import { supabase } from "./supabase";

export async function logActivity(description: string, adminName: string = "Admin", actionType: string = "update", entityType?: string, entityId?: string) {
  try {
    const { error } = await supabase.from("activity_logs").insert({
      admin_name: adminName,
      action_type: actionType,
      entity_type: entityType,
      entity_id: entityId,
      description: description
    });
    if (error) console.error("Failed to log activity:", error);
  } catch (e) {
    console.error("Audit log error:", e);
  }
}
