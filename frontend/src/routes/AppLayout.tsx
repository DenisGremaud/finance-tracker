import { Outlet } from "react-router-dom"

import { DesktopSidebar, MobileTabBar, MobileTopbar } from "@/components/app-shell"

export function AppLayout() {
  return (
    <div className="bg-background min-h-svh">
      <DesktopSidebar />
      <div className="lg:pl-64">
        <MobileTopbar />
        {/* Bottom padding clears the fixed tab bar on phones. */}
        <main className="mx-auto w-full max-w-5xl px-4 pt-2 pb-28 sm:px-6 lg:py-10">
          <Outlet />
        </main>
      </div>
      <MobileTabBar />
    </div>
  )
}
