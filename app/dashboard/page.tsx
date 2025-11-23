import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, Activity, DollarSign } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, Dr. Martin.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Appointments Today" value="8" icon={<Calendar className="h-4 w-4 text-muted-foreground" />} description="3 remaining" />
        <StatCard title="Active Patients" value="342" icon={<Users className="h-4 w-4 text-muted-foreground" />} description="+12 this month" />
        <StatCard title="Revenue (Month)" value="€4,250" icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} description="+8% from last month" />
        <StatCard title="Consultations" value="24" icon={<Activity className="h-4 w-4 text-muted-foreground" />} description="This week" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-sm">Calendar View Placeholder</p>
                {/* TODO: Add Mini Calendar or List */}
            </CardContent>
        </Card>
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
             <CardContent className="space-y-2">
                {/* Todo: Add Buttons */}
             </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, description }: { title: string, value: string, icon: React.ReactNode, description?: string }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </CardContent>
        </Card>
    )
}
