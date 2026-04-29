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
import { Plus, Trash2, MapPin } from "lucide-react";

const emptyForm = {
  uc_id: "",
  bin_type: "",
  latitude: "",
  longitude: "",
  capacity_ltr: "",
};

export default function BinsTab() {
  const [bins, setBins] = useState<any[]>([]);
  const [ucs, setUcs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filterUc, setFilterUc] = useState("all");

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: bData }, { data: uData }] = await Promise.all([
      supabase
        .from("bin")
        .select("*, uc(uc_number, name)")
        .order("created_at", { ascending: false }),
      supabase.from("uc").select("id, uc_number, name").order("uc_number"),
    ]);
    setBins(bData || []);
    setUcs(uData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const save = async () => {
    if (!form.uc_id || !form.latitude || !form.longitude) {
      toast.error("UC and coordinates are required");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("bin").insert({
      uc_id: form.uc_id,
      bin_type: form.bin_type || null,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      capacity_ltr: form.capacity_ltr ? Number(form.capacity_ltr) : null,
      geometry: `SRID=4326;POINT(${form.longitude} ${form.latitude})`,
    });
    if (error) {
      toast.error(error.message);
      setSaving(false);
      return;
    }
    toast.success("Bin added");
    setSaving(false);
    setOpen(false);
    setForm(emptyForm);
    fetchAll();
  };

  const deleteBin = async (id: string) => {
    const { error } = await supabase.from("bin").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
      return;
    }
    toast.success("Bin removed");
    fetchAll();
  };

  const f = (key: string, val: string) =>
    setForm((p) => ({ ...p, [key]: val }));
  const filtered =
    filterUc === "all" ? bins : bins.filter((b) => b.uc_id === filterUc);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Bins</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Add and manage bin locations per UC
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Add Bin
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Bin Location</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Union Council</Label>
                <Select value={form.uc_id} onValueChange={(v) => f("uc_id", v)}>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bin Type</Label>
                  <Select
                    value={form.bin_type}
                    onValueChange={(v) => f("bin_type", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.8ltr">0.8 Ltr</SelectItem>
                      <SelectItem value="1m3">1 m³</SelectItem>
                      <SelectItem value="3m3">3 m³</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Capacity (Ltr)</Label>
                  <Input
                    type="number"
                    value={form.capacity_ltr}
                    onChange={(e) => f("capacity_ltr", e.target.value)}
                    placeholder="800"
                  />
                </div>
              </div>
              <div className="bg-muted/30 rounded-xl p-3 text-xs text-muted-foreground">
                <div className="font-medium mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Getting coordinates
                </div>
                Open Google Maps → long press on bin location → coordinates
                appear at top → copy here
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
              <Button className="w-full" onClick={save} disabled={saving}>
                {saving ? "Saving..." : "Add Bin"}
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
          {filtered.length} bins
        </span>
      </div>

      {/* Table */}
      <div className="border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {["UC", "Type", "Capacity", "Coordinates", ""].map((h) => (
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
                  colSpan={5}
                  className="text-center py-12 text-muted-foreground"
                >
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-16 text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <MapPin className="w-8 h-8 opacity-30" />
                    <div>No bins yet — add bin locations above</div>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((b, i) => (
                <motion.tr
                  key={b.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors"
                >
                  <td className="px-4 py-3 text-blue-500 font-medium">
                    UC-{b.uc?.uc_number}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className="text-xs text-emerald-500 border-emerald-500/30"
                    >
                      {b.bin_type || "—"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {b.capacity_ltr ? `${b.capacity_ltr} ltr` : "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {b.latitude}, {b.longitude}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteBin(b.id)}
                      className="gap-1 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
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
