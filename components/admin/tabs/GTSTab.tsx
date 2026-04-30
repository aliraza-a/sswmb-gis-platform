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
import { Plus, Pencil, Link } from "lucide-react";

const emptyForm = {
  reg_number: "",
  vehicle_type: "",
  capacity_cum: "",
  driver_name: "",
  driver_phone: "",
  driver_cnic: "",
  helper_name: "",
  helper_phone: "",
  helper_cnic: "",
  latitude: "",
  longitude: "",
  location_name: "",
};

export default function GTSTab() {
  const [gts, setGts] = useState<any[]>([]);
  const [ucs, setUcs] = useState<any[]>([]);
  const [gtsUc, setGtsUc] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [linkForm, setLinkForm] = useState({ gts_id: "", uc_id: "" });

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: gData }, { data: uData }, { data: guData }] =
      await Promise.all([
        supabase.from("gts").select("*").order("reg_number"),
        supabase.from("uc").select("id, uc_number, name").order("uc_number"),
        supabase
          .from("gts_uc")
          .select("*, gts(reg_number), uc(uc_number, name)"),
      ]);
    setGts(gData || []);
    setUcs(uData || []);
    setGtsUc(guData || []);
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
  const openEdit = (g: any) => {
    setEditing(g);
    setForm({
      reg_number: g.reg_number,
      vehicle_type: g.vehicle_type || "",
      capacity_cum: g.capacity_cum || "",
      driver_name: g.driver_name || "",
      driver_phone: g.driver_phone || "",
      driver_cnic: g.driver_cnic || "",
      helper_name: g.helper_name || "",
      helper_phone: g.helper_phone || "",
      helper_cnic: g.helper_cnic || "",
      latitude: g.latitude || "",
      longitude: g.longitude || "",
      location_name: g.location_name || "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.reg_number) {
      toast.error("Reg number required");
      return;
    }
    setSaving(true);
    const payload: any = {
      reg_number: form.reg_number,
      vehicle_type: form.vehicle_type || null,
      capacity_cum: form.capacity_cum ? Number(form.capacity_cum) : null,
      driver_name: form.driver_name || null,
      driver_phone: form.driver_phone || null,
      driver_cnic: form.driver_cnic || null,
      helper_name: form.helper_name || null,
      helper_phone: form.helper_phone || null,
      helper_cnic: form.helper_cnic || null,
      location_name: form.location_name || null,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
    };
    if (form.latitude && form.longitude) {
      payload.geometry = `SRID=4326;POINT(${form.longitude} ${form.latitude})`;
    }
    if (editing) {
      const { error } = await supabase
        .from("gts")
        .update(payload)
        .eq("id", editing.id);
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
      toast.success(`${form.reg_number} updated`);
    } else {
      const { error } = await supabase.from("gts").insert(payload);
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

  const linkGtsToUc = async () => {
    if (!linkForm.gts_id || !linkForm.uc_id) {
      toast.error("Select both GTS and UC");
      return;
    }
    const { error } = await supabase.from("gts_uc").insert({
      gts_id: linkForm.gts_id,
      uc_id: linkForm.uc_id,
    });
    if (error) {
      toast.error("Already linked or error occurred");
      return;
    }
    toast.success("GTS linked to UC");
    setLinkOpen(false);
    fetchAll();
  };

  const f = (key: string, val: string) =>
    setForm((p) => ({ ...p, [key]: val }));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">
            Compactors
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage compactor trucks and their UC assignments
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Link className="w-4 h-4" /> Link Compactor to UC
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Link Compactor to UC</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label>Compactor</Label>
                  <Select
                    value={linkForm.gts_id}
                    onValueChange={(v) =>
                      setLinkForm((p) => ({ ...p, gts_id: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Compactor" />
                    </SelectTrigger>
                    <SelectContent>
                      {gts.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.reg_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Union Council</Label>
                  <Select
                    value={linkForm.uc_id}
                    onValueChange={(v) =>
                      setLinkForm((p) => ({ ...p, uc_id: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select UC" />
                    </SelectTrigger>
                    <SelectContent>
                      {ucs.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          UC-{u.uc_number} — {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={linkGtsToUc}>
                  Link
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAdd} className="gap-2">
                <Plus className="w-4 h-4" /> Add Compactor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editing
                    ? `Edit ${editing.reg_number}`
                    : "Add Compactor"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2 pb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Reg Number</Label>
                    <Input
                      value={form.reg_number}
                      onChange={(e) => f("reg_number", e.target.value)}
                      placeholder="GS-C-014"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Capacity (CUM)</Label>
                    <Input
                      type="number"
                      value={form.capacity_cum}
                      onChange={(e) => f("capacity_cum", e.target.value)}
                      placeholder="5"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Vehicle Type</Label>
                  <Input
                    value={form.vehicle_type}
                    onChange={(e) => f("vehicle_type", e.target.value)}
                    placeholder="e.g. 05 CUM Compactor"
                  />
                </div>
                
                <div className="border-t border-border pt-4">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-4">Driver Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Driver Name</Label>
                      <Input
                        value={form.driver_name}
                        onChange={(e) => f("driver_name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Driver Phone</Label>
                      <Input
                        value={form.driver_phone}
                        onChange={(e) => f("driver_phone", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Driver CNIC</Label>
                      <Input
                        value={form.driver_cnic}
                        onChange={(e) => f("driver_cnic", e.target.value)}
                        placeholder="42XXX-XXXXXXX-X"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-4">Helper Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Helper Name</Label>
                      <Input
                        value={form.helper_name}
                        onChange={(e) => f("helper_name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Helper Phone</Label>
                      <Input
                        value={form.helper_phone}
                        onChange={(e) => f("helper_phone", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Helper CNIC</Label>
                      <Input
                        value={form.helper_cnic}
                        onChange={(e) => f("helper_cnic", e.target.value)}
                        placeholder="42XXX-XXXXXXX-X"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-4">Location & Coordinates</h4>
                  <div className="space-y-2 mb-4">
                    <Label>Location Name</Label>
                    <Input
                      value={form.location_name}
                      onChange={(e) => f("location_name", e.target.value)}
                      placeholder="e.g. Model Zone UC-01/02 yard"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Latitude</Label>
                      <Input
                        value={form.latitude}
                        onChange={(e) => f("latitude", e.target.value)}
                        placeholder="24.8918"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Longitude</Label>
                      <Input
                        value={form.longitude}
                        onChange={(e) => f("longitude", e.target.value)}
                        placeholder="67.1855"
                      />
                    </div>
                  </div>
                </div>
                
                <Button className="w-full" onClick={save} disabled={saving}>
                  {saving ? "Saving..." : editing ? "Update Compactor" : "Add Compactor"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* GTS UC Links */}
      <div className="mb-6">
        <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Current UC Assignments
        </div>
        <div className="flex flex-wrap gap-2">
          {gtsUc.map((gu) => (
            <Badge
              key={gu.id}
              variant="outline"
              className="text-xs gap-1 py-1.5 px-3"
            >
              <span className="text-amber-500">{gu.gts?.reg_number}</span>
              <span className="text-muted-foreground mx-1">→</span>
              <span className="text-blue-400">
                UC-{gu.uc?.uc_number} {gu.uc?.name}
              </span>
            </Badge>
          ))}
          {gtsUc.length === 0 && (
            <span className="text-sm text-muted-foreground">
              No assignments yet — use Link Compactor to UC
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {[
                  "Reg Number",
                  "Type",
                  "Capacity",
                  "Location",
                  "Personnel (Driver/Helper)",
                  "Coordinates",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
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
                    colSpan={7}
                    className="text-center py-12 text-muted-foreground"
                  >
                    Loading...
                  </td>
                </tr>
              ) : (
                gts.map((g, i) => (
                  <motion.tr
                    key={g.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-bold">
                      {g.reg_number}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {g.vehicle_type || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {g.capacity_cum ? (
                        <Badge
                          variant="outline"
                          className="text-amber-500 border-amber-500/30"
                        >
                          {g.capacity_cum} CUM
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {g.location_name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="secondary" className="text-[9px] px-1 h-3.5">D</Badge>
                          <span className="text-xs">{g.driver_name || "—"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[9px] px-1 h-3.5">H</Badge>
                          <span className="text-xs text-muted-foreground">{g.helper_name || "—"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {g.latitude ? (
                        `${g.latitude}, ${g.longitude}`
                      ) : (
                        <span className="text-destructive/60">Not set</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(g)}
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
    </div>
  );
}
