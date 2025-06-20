"use client"

import { Home, Car, Fuel, ShieldAlert, Bell, MessageSquare, Phone, LogOut, ChevronDown, Building2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Link } from "react-router-dom"
import { useState } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

const navigationItems = [
  {
    title: "Home",
    icon: Home,
    url: "/dashboard",
    isActive: true,
  },
  {
    title: "Vehicles",
    icon: Car,
    url: "/dashboard/vehicles",
  },
  {
    title: "Fuel Report",
    icon: Fuel,
    url: "/dashboard/fuel-report",
  },
  {
    title: "Fuel Analysis",
    icon: ShieldAlert,
    url: "/dashboard/fuel-theft",
  },
]

export function AppSidebar() {
  const navigate = useNavigate()
  const [notificationOpen, setNotificationOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn")
    localStorage.removeItem("userEmail")
    navigate("/login")
  }

  return (
    <Sidebar className="border-r border-border/40">
      <SidebarHeader className="px-4 py-3 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-100 h-25 bg-gradient-to-br rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                  <img src="/si.png" alt="logo" className="md:h-full object-cover" />
                </div>
              </div>
              <span className="text-3xl font-bold text-indigo-700"></span>
            </div>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={`h-8 px-3 text-sm font-light rounded-md transition-colors ${
                      item.isActive
                        ? "bg-blue-50 text-blue-600 hover:bg-blue-50 hover:text-blue-600"
                        : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="font-light">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="px-3 text-xs font-light text-gray-500 mb-1">System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0">
              {/* Notifications with SMS/WhatsApp */}
              <SidebarMenuItem>
                <Collapsible open={notificationOpen} onOpenChange={setNotificationOpen}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="h-8 px-3 text-sm font-light text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors">
                      <div className="flex items-center gap-3 w-full">
                        <Bell className="h-4 w-4 flex-shrink-0" />
                        <span className="font-light">Notifications</span>
                        <ChevronDown
                          className={`h-3 w-3 ml-auto transition-transform ${notificationOpen ? "rotate-180" : ""}`}
                        />
                      </div>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="ml-7 mt-1 space-y-0">
                      <SidebarMenuButton
                        asChild
                        className="h-7 px-3 text-xs font-light text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors"
                      >
                        <Link to ="/dashboard/sms-notifications" className="flex items-center gap-2">
                          <MessageSquare className="h-3 w-3" />
                          <span className="font-light">SMS Alerts</span>
                        </Link>
                      </SidebarMenuButton>
                      <SidebarMenuButton
                        asChild
                        className="h-7 px-3 text-xs font-light text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors"
                      >
                        <Link to="/dashboard/whatsapp"
                       
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <Phone className="h-3 w-3" />
                          <span className="font-light">WhatsApp</span>
                        </Link>
                      </SidebarMenuButton>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-border/40 mt-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="h-8 px-3 text-sm font-light text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors justify-start"
        >
          <LogOut className="h-4 w-4 mr-3" />
          <span className="font-light">Logout</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
