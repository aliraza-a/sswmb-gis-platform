"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/audit";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
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
import { Plus, Pencil, CheckCircle, Clock, Circle, Trash2, MoreHorizontal, Save, X as CloseIcon } from "lucide-react";

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
  is_draft: false,
};

export default function UCTab() {
  const [ucs, setUcs] = useState<any[]>([]);
  const [allBoundaries, setAllBoundaries] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [overlapDetected, setOverlapDetected] = useState(false);

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from("uc").select("*").order("uc_number");
    setUcs(data || []);

    const { data: bData } = await supabase.from("uc_boundary").select("uc_id, geojson");
    if (bData) {
      setAllBoundaries(bData);
    }
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
      is_draft: false,
    });
    setOpen(true);

    const { data: bData } = await supabase.from("uc_boundary").select("geojson, is_draft").eq("uc_id", uc.id).single();
    if (bData) {
      setForm(prev => ({ ...prev, boundary_geojson: bData.geojson, is_draft: !!bData.is_draft }));
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
      logActivity(`Updated metadata for UC-${form.uc_number}`, "Admin", "update", "uc", currentUcId);
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
        geojson: parsedGeoJSON,
        is_draft: form.is_draft
      }, { onConflict: "uc_id" });
      
      // Fallback if unique constraint 'uc_id' isn't explicitly named or if upsert fails
      if (bError) {
        await supabase.from("uc_boundary").delete().eq("uc_id", currentUcId);
        await supabase.from("uc_boundary").insert({
          uc_id: currentUcId,
          geojson: parsedGeoJSON,
          is_draft: form.is_draft
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

  // Phase 2: Selection & Inline Editing State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineValue, setInlineValue] = useState("");

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds(prev => prev.length === ucs.length ? [] : ucs.map(u => u.id));
  };

  const batchUpdateStatus = async (status: string) => {
    setLoading(true);
    const { error } = await supabase
      .from("uc")
      .update({ status })
      .in("id", selectedIds);
    
    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(`Updated ${selectedIds.length} UCs`);
      logActivity(`Bulk updated status to ${status} for ${selectedIds.length} UCs`, "Admin", "update", "uc");
      setSelectedIds([]);
      fetch();
    }
    setLoading(false);
  };

  const updateInline = async (id: string, field: string, value: any) => {
    const { error } = await supabase
      .from("uc")
      .update({ [field]: value })
      .eq("id", id);
    
    if (error) {
      toast.error("Update failed");
    } else {
      toast.success(`Updated ${field}`);
      logActivity(`Updated ${field} for UC-${id}`, "Admin", "update", "uc", id);
      setUcs(prev => prev.map(u => u.id === id ? { ...u, [field]: value } : u));
      setInlineEditingId(null);
    }
  };

  return (
    <div className="relative">
      {/* Batch Action Toolbar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-primary text-primary-foreground px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 border border-primary-foreground/10"
          >
            <div className="flex items-center gap-2 border-r border-primary-foreground/20 pr-6">
              <span className="text-sm font-bold">{selectedIds.length} UCs selected</span>
              <button onClick={() => setSelectedIds([])} className="hover:opacity-70 transition-opacity">
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-[10px] uppercase tracking-widest opacity-70">Batch Update Status:</span>
              <div className="flex gap-1.5">
                {Object.entries(statusConfig).map(([key, config]) => (
                  <Button 
                    key={key} 
                    size="sm" 
                    variant="secondary"
                    onClick={() => batchUpdateStatus(key)}
                    className="h-8 px-3 text-[10px] font-bold gap-1.5"
                  >
                    <config.icon className="w-3 h-3" />
                    {config.label}
                  </Button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
                  <Select
                    value={form.zone}
                    onValueChange={(v) => f("zone", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Zone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Model Zone">Model Zone</SelectItem>
                      <SelectItem value="Shah Faisal Zone">Shah Faisal Zone</SelectItem>
                      <SelectItem value="Landhi Zone">Landhi Zone</SelectItem>
                      <SelectItem value="Korangi Zone">Korangi Zone</SelectItem>
                    </SelectContent>
                  </Select>
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
                <Button className="w-full mt-4" onClick={save} disabled={saving || overlapDetected}>
                  {saving ? "Saving..." : editing ? "Update UC" : "Add UC"}
                </Button>
              </div>
              <div className="md:col-span-2 flex flex-col space-y-2">
                <Label>Boundary Drawer</Label>
                <div className="flex-1 bg-muted/20 rounded-xl">
                  {open && (
                    <BoundaryMapInput
                      initialGeoJSON={form.boundary_geojson}
                      isDraft={form.is_draft}
                      onDraftChange={(val) => setForm(p => ({ ...p, is_draft: val }))}
                      onOverlap={(overlap) => setOverlapDetected(overlap)}
                      referenceGeoJSON={{
                        type: "FeatureCollection",
                        features: (allBoundaries || [])
                          .filter((b: any) => b.uc_id !== editing?.id)
                          .map((b: any) => ({
                            type: "Feature",
                            geometry: b.geojson.type === "FeatureCollection" ? b.geojson.features[0].geometry : b.geojson,
                            properties: {}
                          }))
                      }}
                      onChange={(geojson) => f("boundary_geojson", geojson)}
                    />
                  )}
                </div>
                {overlapDetected && (
                  <p className="text-[10px] text-destructive font-bold animate-pulse">
                    ⚠️ Cannot save while overlap is detected. Please adjust the boundary.
                  </p>
                )}
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
      <div className="border border-border rounded-2xl overflow-hidden bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left w-10">
                <input 
                  type="checkbox" 
                  className="rounded border-border"
                  checked={selectedIds.length === ucs.length && ucs.length > 0}
                  onChange={toggleSelectAll}
                />
              </th>
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
                  colSpan={7}
                  className="text-center py-12 text-muted-foreground"
                >
                  Loading...
                </td>
              </tr>
            ) : ucs.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-12 text-muted-foreground"
                >
                  No UCs yet — add one above
                </td>
              </tr>
            ) : (
              ucs.map((uc, i) => {
                const s = statusConfig[uc.status] || statusConfig.pending;
                const isSelected = selectedIds.includes(uc.id);
                const isInlineEditing = inlineEditingId === `${uc.id}-supervisor`;

                return (
                  <motion.tr
                    key={uc.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className={`border-b border-border last:border-0 hover:bg-accent/30 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input 
                        type="checkbox" 
                        className="rounded border-border text-primary"
                        checked={isSelected}
                        onChange={() => toggleSelect(uc.id)}
                      />
                    </td>
                    <td className="px-4 py-3 font-bold text-blue-500">
                      UC-{uc.uc_number}
                    </td>
                    <td className="px-4 py-3 font-medium">{uc.name || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {uc.zone || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground group">
                      {isInlineEditing ? (
                        <div className="flex items-center gap-2">
                          <Input 
                            autoFocus
                            className="h-8 text-xs min-w-[120px]"
                            value={inlineValue}
                            onChange={(e) => setInlineValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') updateInline(uc.id, 'supervisor_name', inlineValue);
                              if (e.key === 'Escape') setInlineEditingId(null);
                            }}
                          />
                          <button onClick={() => updateInline(uc.id, 'supervisor_name', inlineValue)} className="text-emerald-500 hover:opacity-70"><Save className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setInlineEditingId(null)} className="text-destructive hover:opacity-70"><CloseIcon className="w-3.5 h-3.5" /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>{uc.supervisor_name || "Not set"}</span>
                          <button 
                            onClick={() => {
                              setInlineEditingId(`${uc.id}-supervisor`);
                              setInlineValue(uc.supervisor_name || "");
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-accent rounded transition-all"
                          >
                            <Pencil className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={uc.status}
                        onValueChange={(v) => updateInline(uc.id, 'status', v)}
                      >
                        <SelectTrigger className="h-8 border-none bg-transparent hover:bg-accent/50 transition-all p-0 w-auto gap-2">
                          <Badge
                            variant="outline"
                            className={`text-xs gap-1 cursor-pointer transition-all border-none ${s.color}`}
                          >
                            <s.icon className="w-3 h-3" />
                            {s.label}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <config.icon className="w-3.5 h-3.5" />
                                {config.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(uc)}
                        className="gap-1 hover:bg-primary hover:text-primary-foreground"
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
