"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Pencil } from "lucide-react";

const typeColors: Record<string, string> = {
  forland: "border-blue-500/40 text-blue-400",
  three_wheel: "border-purple-500/40 text-purple-400",
  mini_tipper: "border-emerald-500/40 text-emerald-400",
  compactor: "border-amber-500/40 text-amber-400",
};

const emptyForm = {
  uc_id: "",
  reg_number: "",
  vehicle_type: "forland",
  driver_name: "",
  driver_phone: "",
  driver_cnic: "",
  helper_name: "",
  helper_cnic: "",
  shift: "",
};

export default function VehiclesTab() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [ucs, setUcs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterUc, setFilterUc] = useState("all");

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: vData }, { data: uData }] = await Promise.all([
      supabase
        .from("vehicle")
        .select("*, uc(uc_number, name)")
        .order("reg_number"),
      supabase.from("uc").select("id, uc_number, name").order("uc_number"),
    ]);
    setVehicles(vData || []);
    setUcs(uData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };
  const openEdit = (v: any) => {
    setEditing(v);
    setForm({
      uc_id: v.uc_id,
      reg_number: v.reg_number,
      vehicle_type: v.vehicle_type,
      driver_name: v.driver_name || "",
      driver_phone: v.driver_phone || "",
      driver_cnic: v.driver_cnic || "",
      helper_name: v.helper_name || "",
      helper_cnic: v.helper_cnic || "",
      shift: v.shift || "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.uc_id || !form.reg_number) {
      toast.error("UC and Reg Number are required");
      return;
    }
    setSaving(true);
    const payload = {
      uc_id: form.uc_id,
      reg_number: form.reg_number,
      vehicle_type: form.vehicle_type,
      driver_name: form.driver_name || null,
      driver_phone: form.driver_phone || null,
      driver_cnic: form.driver_cnic || null,
      helper_name: form.helper_name || null,
      helper_cnic: form.helper_cnic || null,
      shift: form.shift || null,
    };
    if (editing) {
      const { error } = await supabase
        .from("vehicle")
        .update(payload)
        .eq("id", editing.id);
      if (error) {
        toast.error("Failed to update");
        setSaving(false);
        return;
      }
      toast.success(`${form.reg_number} updated`);
    } else {
      const { error } = await supabase.from("vehicle").insert(payload);
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
      toast.success(`${form.reg_number} added`);
    }
    setSaving(false);
    setOpen(false);
    fetchAll();
  };

  const f = (key: string, val: string) =>
    setForm((p) => ({ ...p, [key]: val }));

  const filtered =
    filterUc === "all"
      ? vehicles
      : vehicles.filter((v) => v.uc_id === filterUc);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Vehicles</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage all collection vehicles across UCs
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAdd} className="gap-2">
              <Plus className="w-4 h-4" /> Add Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editing ? `Edit ${editing.reg_number}` : "Add Vehicle"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Union Council</Label>
                  <Select
                    value={form.uc_id}
                    onValueChange={(v) => f("uc_id", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select UC" />
                    </SelectTrigger>
                    <SelectContent>
                      {ucs.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          UC-{u.uc_number} {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Vehicle Type</Label>
                  <Select
                    value={form.vehicle_type}
                    onValueChange={(v) => f("vehicle_type", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="forland">Forland</SelectItem>
                      <SelectItem value="three_wheel">Three Wheel</SelectItem>
                      <SelectItem value="mini_tipper">Mini Tipper</SelectItem>
                      <SelectItem value="compactor">Compactor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Registration Number</Label>
                <Input
                  value={form.reg_number}
                  onChange={(e) => f("reg_number", e.target.value)}
                  placeholder="e.g. GS-B-051"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Driver Name</Label>
                  <Input
                    value={form.driver_name}
                    onChange={(e) => f("driver_name", e.target.value)}
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Driver Phone</Label>
                  <Input
                    value={form.driver_phone}
                    onChange={(e) => f("driver_phone", e.target.value)}
                    placeholder="03xx-xxxxxxx"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Driver CNIC</Label>
                  <Input
                    value={form.driver_cnic}
                    onChange={(e) => f("driver_cnic", e.target.value)}
                    placeholder="xxxxx-xxxxxxx-x"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Shift</Label>
                  <Input
                    value={form.shift}
                    onChange={(e) => f("shift", e.target.value)}
                    placeholder="e.g. Morning"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Helper Name</Label>
                  <Input
                    value={form.helper_name}
                    onChange={(e) => f("helper_name", e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Helper CNIC</Label>
                  <Input
                    value={form.helper_cnic}
                    onChange={(e) => f("helper_cnic", e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <Button className="w-full" onClick={save} disabled={saving}>
                {saving
                  ? "Saving..."
                  : editing
                    ? "Update Vehicle"
                    : "Add Vehicle"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 mb-6">
        <Label className="text-sm text-muted-foreground">Filter by UC:</Label>
        <Select value={filterUc} onValueChange={setFilterUc}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All UCs</SelectItem>
            {ucs.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                UC-{u.uc_number} — {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {filtered.length} vehicles
        </span>
      </div>

      {/* Table */}
      <div className="border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {[
                "Reg Number",
                "UC",
                "Type",
                "Driver",
                "Phone",
                "CNIC",
                "Shift",
                "",
              ].map((h) => (
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
                  colSpan={8}
                  className="text-center py-12 text-muted-foreground"
                >
                  Loading...
                </td>
              </tr>
            ) : (
              filtered.map((v, i) => (
                <motion.tr
                  key={v.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors"
                >
                  <td className="px-4 py-3 font-mono font-bold text-sm">
                    {v.reg_number}
                  </td>
                  <td className="px-4 py-3 text-blue-500 font-medium">
                    UC-{v.uc?.uc_number}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={`text-xs ${typeColors[v.vehicle_type] || ""}`}
                    >
                      {v.vehicle_type?.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{v.driver_name || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {v.driver_phone || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                    {v.driver_cnic || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {v.shift || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(v)}
                      className="gap-1"
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </Button>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
