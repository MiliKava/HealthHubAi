import { Activity, Globe, ExternalLink, Mail } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-white border-t border-border pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-gradient-health p-2 rounded-lg">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gradient">HealthHub</span>
            </div>
            <p className="text-muted-foreground mb-6">
              AI-powered healthcare platform delivering modern, personalized, and efficient medical experiences.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-health-blue transition-colors">
                <Globe className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-health-blue transition-colors">
                <Mail className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-health-blue transition-colors">
                <ExternalLink className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-lg mb-6">Platform</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-muted-foreground hover:text-health-blue transition-colors">Features</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-health-blue transition-colors">AI Assistant</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-health-blue transition-colors">Telemedicine</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-health-blue transition-colors">Pricing</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-lg mb-6">Company</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-muted-foreground hover:text-health-blue transition-colors">About Us</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-health-blue transition-colors">Careers</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-health-blue transition-colors">Blog</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-health-blue transition-colors">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-lg mb-6">Legal</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-muted-foreground hover:text-health-blue transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-health-blue transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-health-blue transition-colors">HIPAA Compliance</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border pt-8 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} HealthHub AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
