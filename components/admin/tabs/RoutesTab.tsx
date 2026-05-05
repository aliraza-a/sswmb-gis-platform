"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Switch } from "@/components/ui/switch";
import { Plus, CheckCircle, Clock, Upload, Edit } from "lucide-react";

export default function RoutesTab() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [ucs, setUcs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    vehicle_id: "",
    uc_id: "",
    geojson: "",
    length_label: "medium",
    verified: false,
  });

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: rData }, { data: vData }, { data: uData }] =
      await Promise.all([
        supabase
          .from("route")
          .select("*, vehicle(reg_number, vehicle_type), uc(uc_number)")
          .order("created_at", { ascending: false }),
        supabase
          .from("vehicle")
          .select("id, reg_number, vehicle_type, status, uc(uc_number)")
          .order("reg_number"),
        supabase.from("uc").select("id, uc_number, name").order("uc_number"),
      ]);
    setRoutes(rData || []);
    setVehicles(vData || []);
    setUcs(uData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const save = async () => {
    if (!form.vehicle_id || !form.uc_id || !form.geojson) {
      toast.error("Vehicle, UC and GeoJSON are required");
      return;
    }
    let parsedGeoJSON;
    try {
      parsedGeoJSON = JSON.parse(form.geojson);
    } catch {
      toast.error("Invalid GeoJSON — check the format");
      return;
    }
    setSaving(true);
    
    if (editId) {
      const { error } = await supabase.from("route").update({
        vehicle_id: form.vehicle_id,
        uc_id: form.uc_id,
        geojson: parsedGeoJSON,
        length_label: form.length_label,
        verified: form.verified,
      }).eq("id", editId);

      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
      toast.success("Route updated successfully");
    } else {
      const { error } = await supabase.from("route").insert({
        vehicle_id: form.vehicle_id,
        uc_id: form.uc_id,
        geojson: parsedGeoJSON,
        length_label: form.length_label,
        verified: form.verified,
      });
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
      toast.success("Route added successfully");
    }
    setSaving(false);
    setOpen(false);
    setEditId(null);
    setForm({
      vehicle_id: "",
      uc_id: "",
      geojson: "",
      length_label: "medium",
      verified: false,
    });
    fetchAll();
  };

  const openEdit = (r: any) => {
    setEditId(r.id);
    setForm({
      vehicle_id: r.vehicle_id,
      uc_id: r.uc_id,
      geojson: JSON.stringify(r.geojson),
      length_label: r.length_label,
      verified: r.verified,
    });
    setOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Routes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Upload GeoJSON routes from QGIS per vehicle
          </p>
        </div>
        <Dialog open={open} onOpenChange={(v) => {
          setOpen(v);
          if (!v) {
            setEditId(null);
            setForm({
              vehicle_id: "",
              uc_id: "",
              geojson: "",
              length_label: "medium",
              verified: false,
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Add Route
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editId ? "Edit Vehicle Route" : "Add Vehicle Route"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Union Council</Label>
                  <Select
                    value={form.uc_id}
                    onValueChange={(v) => setForm((p) => ({ ...p, uc_id: v }))}
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
                <div className="space-y-2">
                  <Label>Vehicle</Label>
                  <Select
                    value={form.vehicle_id}
                    onValueChange={(v) =>
                      setForm((p) => ({ ...p, vehicle_id: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.reg_number} — UC-{v.uc?.uc_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Route Length</Label>
                <Select
                  value={form.length_label}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, length_label: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="long">Long</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Verified Status</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Switch
                    checked={form.verified}
                    onCheckedChange={(c) =>
                      setForm((p) => ({ ...p, verified: c }))
                    }
                  />
                  <span className="text-sm text-muted-foreground">
                    {form.verified ? "Verified route" : "Pending verification"}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>GeoJSON</Label>
                <div className="text-xs text-muted-foreground mb-2">
                  Export from QGIS → Layer → Save As → GeoJSON → paste here
                </div>
                <Textarea
                  value={form.geojson}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, geojson: e.target.value }))
                  }
                  placeholder='{"type":"LineString","coordinates":[[67.18,24.89]...]}'
                  className="font-mono text-xs h-40 resize-none"
                />
              </div>
              <Button className="w-full gap-2" onClick={save} disabled={saving}>
                <Upload className="w-4 h-4" />
                {saving ? "Saving..." : editId ? "Save Changes" : "Upload Route"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info box */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 mb-6 text-sm text-blue-400">
        <div className="font-semibold mb-1 flex items-center gap-2">
          <Upload className="w-4 h-4" /> How to get GeoJSON from QGIS
        </div>
        <ol className="space-y-1 text-xs text-blue-300/80 list-decimal list-inside">
          <li>Digitize the vehicle route as a line layer in QGIS</li>
          <li>Right-click layer → Export → Save Features As</li>
          <li>Format: GeoJSON → OK</li>
          <li>Open the file, copy the geometry object, paste above</li>
        </ol>
      </div>

      {/* Table */}
      <div className="border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {["Vehicle", "UC", "Length", "Verified", "Added", ""].map((h, idx) => (
                <th
                  key={idx}
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
            ) : routes.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-16 text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 opacity-30" />
                    <div>No routes yet — digitize in QGIS and upload here</div>
                  </div>
                </td>
              </tr>
            ) : (
              routes.map((r, i) => (
                <motion.tr
                  key={r.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors"
                >
                  <td className="px-4 py-3 font-mono font-bold">
                    {r.vehicle?.reg_number}
                  </td>
                  <td className="px-4 py-3 text-blue-500">
                    UC-{r.uc?.uc_number}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="capitalize text-xs">
                      {r.length_label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {r.verified ? (
                      <span className="flex items-center gap-1 text-emerald-500 text-xs">
                        <CheckCircle className="w-3 h-3" /> Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-500 text-xs">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(r.created_at).toLocaleDateString("en-PK")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>
                      <Edit className="w-4 h-4 text-muted-foreground" />
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
