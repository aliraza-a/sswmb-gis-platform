"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import BoundaryMapInput from "../BoundaryMapInput";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, CheckCircle, Clock, Circle } from "lucide-react";

const statusConfig: Record<
  string,
  { label: string; color: string; icon: any }
> = {
  pending: {
    label: "Pending",
    color: "border-border text-muted-foreground",
    icon: Circle,
  },
  in_progress: {
    label: "In Progress",
    color: "border-amber-500/50 text-amber-500",
    icon: Clock,
  },
  complete: {
    label: "Complete",
    color: "border-emerald-500/50 text-emerald-500",
    icon: CheckCircle,
  },
};

const emptyForm = {
  uc_number: "",
  name: "",
  zone: "",
  supervisor_name: "",
  supervisor_phone: "",
  status: "pending",
  boundary_geojson: null as any,
};

export default function UCTab() {
  const [ucs, setUcs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from("uc").select("*").order("uc_number");
    setUcs(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetch();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = async (uc: any) => {
    setEditing(uc);
    setForm({
      uc_number: uc.uc_number,
      name: uc.name,
      zone: uc.zone || "",
      supervisor_name: uc.supervisor_name || "",
      supervisor_phone: uc.supervisor_phone || "",
      status: uc.status,
      boundary_geojson: "",
    });
    setOpen(true);

    const { data: bData } = await supabase.from("uc_boundary").select("geojson").eq("uc_id", uc.id).single();
    if (bData && bData.geojson) {
      setForm(prev => ({ ...prev, boundary_geojson: bData.geojson }));
    }
  };

  const save = async () => {
    setSaving(true);

    let parsedGeoJSON = form.boundary_geojson;
    const isEmptyGeoJSON = !parsedGeoJSON || 
      (parsedGeoJSON.type === "FeatureCollection" && (!parsedGeoJSON.features || parsedGeoJSON.features.length === 0));

    const payload = {
      uc_number: Number(form.uc_number),
      name: form.name,
      zone: form.zone,
      supervisor_name: form.supervisor_name || null,
      supervisor_phone: form.supervisor_phone || null,
      status: form.status,
    };

    let currentUcId = editing?.id;

    if (editing) {
      const { error } = await supabase
        .from("uc")
        .update(payload)
        .eq("id", currentUcId);
      if (error) {
        toast.error("Failed to update UC");
        setSaving(false);
        return;
      }
      toast.success(`UC-${form.uc_number} updated`);
    } else {
      const { data, error } = await supabase.from("uc").insert(payload).select().single();
      if (error || !data) {
        toast.error("Failed to add UC");
        setSaving(false);
        return;
      }
      currentUcId = data.id;
      toast.success(`UC-${form.uc_number} added`);
    }

    // Save boundary
    if (parsedGeoJSON && currentUcId) {
      const { error: bError } = await supabase.from("uc_boundary").upsert({
        uc_id: currentUcId,
        geojson: parsedGeoJSON
      }, { onConflict: "uc_id" });
      
      // Fallback if unique constraint 'uc_id' isn't explicitly named or if upsert fails
      if (bError) {
        await supabase.from("uc_boundary").delete().eq("uc_id", currentUcId);
        await supabase.from("uc_boundary").insert({
          uc_id: currentUcId,
          geojson: parsedGeoJSON
        });
      }
    } else if (isEmptyGeoJSON && currentUcId) {
      await supabase.from("uc_boundary").delete().eq("uc_id", currentUcId);
    }

    setSaving(false);
    setOpen(false);
    fetch();
  };

  const f = (key: string, val: string) =>
    setForm((p) => ({ ...p, [key]: val }));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Union Councils</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage all 37 UCs in Korangi District
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAdd} className="gap-2">
              <Plus className="w-4 h-4" /> Add UC
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-5xl w-[95vw]">
            <DialogHeader>
              <DialogTitle>
                {editing ? `Edit UC-${editing.uc_number}` : "Add Union Council"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
              <div className="space-y-4 md:col-span-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>UC Number</Label>
                    <Input
                      type="number"
                      value={form.uc_number}
                      onChange={(e) => f("uc_number", e.target.value)}
                      placeholder="e.g. 2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => f("name", e.target.value)}
                      placeholder="e.g. Model Colony"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Zone</Label>
                  <Input
                    value={form.zone}
                    onChange={(e) => f("zone", e.target.value)}
                    placeholder="e.g. Model Zone"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Supervisor Name</Label>
                    <Input
                      value={form.supervisor_name}
                      onChange={(e) => f("supervisor_name", e.target.value)}
                      placeholder="e.g. Shahnawaz"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Supervisor Phone</Label>
                    <Input
                      value={form.supervisor_phone}
                      onChange={(e) => f("supervisor_phone", e.target.value)}
                      placeholder="03xx-xxxxxxx"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => f("status", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="complete">Complete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full mt-4" onClick={save} disabled={saving}>
                  {saving ? "Saving..." : editing ? "Update UC" : "Add UC"}
                </Button>
              </div>
              <div className="md:col-span-2 flex flex-col space-y-2">
                <Label>Boundary Drawer</Label>
                <div className="flex-1 bg-muted/20 rounded-xl">
                  {open && (
                    <BoundaryMapInput
                      initialGeoJSON={form.boundary_geojson}
                      onChange={(geojson) => f("boundary_geojson", geojson)}
                    />
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total UCs", value: ucs.length, color: "text-foreground" },
          {
            label: "In Progress",
            value: ucs.filter((u) => u.status === "in_progress").length,
            color: "text-amber-500",
          },
          {
            label: "Complete",
            value: ucs.filter((u) => u.status === "complete").length,
            color: "text-emerald-500",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-card border border-border rounded-2xl p-5"
          >
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {["UC #", "Name", "Zone", "Supervisor", "Status", ""].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-12 text-muted-foreground"
                >
                  Loading...
                </td>
              </tr>
            ) : ucs.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-12 text-muted-foreground"
                >
                  No UCs yet — add one above
                </td>
              </tr>
            ) : (
              ucs.map((uc, i) => {
                const s = statusConfig[uc.status] || statusConfig.pending;
                return (
                  <motion.tr
                    key={uc.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-bold text-blue-500">
                      UC-{uc.uc_number}
                    </td>
                    <td className="px-4 py-3 font-medium">{uc.name || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {uc.zone || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {uc.supervisor_name || (
                        <span className="text-destructive/60 text-xs">
                          Not set
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`text-xs gap-1 ${s.color}`}
                      >
                        <s.icon className="w-3 h-3" />
                        {s.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(uc)}
                        className="gap-1"
                      >
                        <Pencil className="w-3 h-3" /> Edit
                      </Button>
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
