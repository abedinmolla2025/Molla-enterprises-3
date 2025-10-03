import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  Menu, 
  X
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Settings as SettingsType } from "@shared/schema";

export default function Navigation() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: settings } = useQuery<SettingsType[]>({
    queryKey: ["/api/settings"],
  });

  const getSettingValue = (key: string, defaultValue: string): string => {
    const setting = settings?.find(s => s.key === key);
    return setting?.value || defaultValue;
  };

  const companyName = getSettingValue("companyName", "MOLLA ENTERPRISES");

  useEffect(() => {
    document.title = `${companyName} - Invoice Generator`;
  }, [companyName]);

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/clients", label: "Clients", icon: Users },
    { path: "/invoices", label: "Invoices", icon: FileText },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  const isActive = (path: string) => {
    return location === path || (path === "/dashboard" && location === "/");
  };

  return (
    <nav className="gradient-bg shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="text-white">
              <h1 className="font-lora text-4xl font-black tracking-wide" data-testid="company-name">
                {companyName}
              </h1>
              <p className="text-blue-100 text-sm font-medium">Professional Invoice Generator</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} href={item.path}>
                  <button
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 border-b-2 ${
                      isActive(item.path)
                        ? "text-white border-white"
                        : "text-blue-100 hover:text-white border-transparent hover:border-blue-100"
                    }`}
                    data-testid={`nav-${item.label.toLowerCase()}`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </button>
                </Link>
              );
            })}
          </div>
          
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white hover:text-blue-100 p-2"
              data-testid="mobile-menu-toggle"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-blue-800 border-t border-blue-600">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} href={item.path}>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                      isActive(item.path)
                        ? "text-white bg-blue-700"
                        : "text-blue-100 hover:text-white hover:bg-blue-700"
                    }`}
                    data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </button>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
