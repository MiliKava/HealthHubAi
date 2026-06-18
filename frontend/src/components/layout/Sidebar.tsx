import { Activity, LayoutDashboard, Calendar, FileText, Pill, Video, Settings, LogOut, MessageSquare } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "../../lib/utils"

export function Sidebar() {
  const location = useLocation()
  
  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Calendar, label: "Appointments", path: "/dashboard/appointments" },
    { icon: FileText, label: "Lab Reports", path: "/dashboard/reports" },
    { icon: Pill, label: "Medications", path: "/dashboard/medications" },
    { icon: MessageSquare, label: "AI Assistant", path: "/dashboard/ai" },
    { icon: Video, label: "Telemedicine", path: "/dashboard/telemedicine" },
  ]

  return (
    <aside className="w-64 border-r border-border bg-white flex flex-col h-screen fixed top-0 left-0">
      <div className="h-20 flex items-center px-6 border-b border-border">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-gradient-health p-2 rounded-lg">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900">HealthHub</span>
        </Link>
      </div>
      
      <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">Menu</div>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-health-blue/10 text-health-blue" 
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "text-health-blue" : "text-slate-400")} />
              {item.label}
            </Link>
          )
        })}
      </div>
      
      <div className="p-4 border-t border-border">
        <div className="space-y-1">
          <Link
            to="/dashboard/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <Settings className="h-5 w-5 text-slate-400" />
            Settings
          </Link>
          <button
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-5 w-5 text-red-400" />
            Logout
          </button>
        </div>
      </div>
    </aside>
  )
}
