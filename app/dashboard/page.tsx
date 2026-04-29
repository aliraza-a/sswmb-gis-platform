import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import MapView from "@/components/map/MapView";

export default function DashboardPage() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 relative overflow-hidden">
        <MapView />
      </main>
      <MobileNav />
    </div>
  );
}
