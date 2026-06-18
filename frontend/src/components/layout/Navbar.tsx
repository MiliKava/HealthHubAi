import { Link } from "react-router-dom"
import { Button } from "../ui/button"
import { Activity, Menu, Lock } from "lucide-react"

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-100 shadow-sm">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        
        {/* Left: Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-brand-teal p-2 rounded-full">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-extrabold text-brand-teal tracking-wider uppercase">HealthHub</span>
        </Link>
        
        {/* Center: Links */}
        <div className="hidden md:flex flex-1 items-center justify-center gap-10">
          <Link to="#features" className="text-sm font-semibold text-slate-600 hover:text-brand-teal transition-colors">Features</Link>
          <Link to="#doctors" className="text-sm font-semibold text-slate-600 hover:text-brand-teal transition-colors">Top Doctors</Link>
          <Link to="#testimonials" className="text-sm font-semibold text-slate-600 hover:text-brand-teal transition-colors">Testimonials</Link>
        </div>

        {/* Right: Actions */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/login" className="flex items-center gap-2 text-slate-600 hover:text-brand-teal transition-colors px-3 py-2">
            <Lock className="w-4 h-4" />
            <span className="text-sm font-semibold">Log in</span>
          </Link>
          <Link to="/dashboard">
            <Button className="font-semibold px-6 rounded-full bg-brand-teal hover:bg-brand-teal-dark text-white border-0">
              Get Started
            </Button>
          </Link>
        </div>
        
        {/* Mobile Menu */}
        <Button variant="ghost" size="icon" className="md:hidden text-brand-teal">
          <Menu className="h-6 w-6" />
        </Button>
      </div>
    </nav>
  )
}
