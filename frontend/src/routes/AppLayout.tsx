import { Outlet } from "react-router-dom"

import { DesktopSidebar, MobileTopbar } from "@/components/app-shell"

export function AppLayout() {
  return (
    <div className="bg-background min-h-svh">
      <DesktopSidebar />
      <div className="lg:pl-64">
        <MobileTopbar />
        <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
