import { Suspense } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import MobileNav from '@/components/layout/MobileNav'
import MapView from '@/components/map/MapView'

function DashboardShell() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 relative overflow-hidden">
        <MapView />
      </main>
      <MobileNav />
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-screen items-center justify-center bg-background text-muted-foreground text-sm">
        Loading dashboard...
      </div>
    }>
      <DashboardShell />
    </Suspense>
  )
}