import { Sidebar } from "@/components/dashboard/Sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-muted/20">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="flex h-14 items-center border-b bg-background px-6 md:hidden">
             <span className="font-bold">TheraFlow</span>
        </header>
        
        <main className="flex-1 overflow-auto p-6">
            {children}
        </main>
      </div>
    </div>
  )
}