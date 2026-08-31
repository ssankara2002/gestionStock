import { AppSidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { SidebarProvider } from "@/components/ui/sidebar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/40">
        <AppSidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <Header showSidebar />
          <main className="flex-1 w-full p-4 sm:p-6 overflow-x-hidden">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}