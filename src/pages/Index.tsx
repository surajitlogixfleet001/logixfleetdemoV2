"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { Search, Bell, Settings, Grid3X3, HelpCircle, X, TrendingUp, TrendingDown, Info } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Mock data for fuel events
const fuelEventData = [
  { date: "Jan 1", refill: 180, theft: 0, day: 1 },
  { date: "Jan 3", refill: 220, theft: 0, day: 3 },
  { date: "Jan 4", refill: 0, theft: -180, day: 4 },
  { date: "Jan 5", refill: 195, theft: 0, day: 5 },
  { date: "Jan 6", refill: 0, theft: -32, day: 6 },
  { date: "Jan 7", refill: 240, theft: 0, day: 7 },
  { date: "Jan 8", refill: 0, theft: -15, day: 8 },
  { date: "Jan 9", refill: 210, theft: 0, day: 9 },
  { date: "Jan 10", refill: 0, theft: -28, day: 10 },
  { date: "Jan 11", refill: 185, theft: 0, day: 11 },
  { date: "Jan 13", refill: 225, theft: 0, day: 13 },
  { date: "Jan 14", refill: 0, theft: -19, day: 14 },
  { date: "Jan 15", refill: 200, theft: 0, day: 15 },
  { date: "Jan 16", refill: 0, theft: -35, day: 16 },
  { date: "Jan 17", refill: 215, theft: 0, day: 17 },
  { date: "Jan 18", refill: 0, theft: -24, day: 18 },
  { date: "Jan 19", refill: 190, theft: 0, day: 19 },
  { date: "Jan 20", refill: 0, theft: -16, day: 20 },
]

const Index = () => {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(true)
  const [notifications] = useState(3)
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    setTimeout(() => {

      const stored = localStorage.getItem('userFname');
        if (stored) {
          setEmail(stored);
        }
      // localStorage.setItem("userFname", mockEmail)
      setLoading(false)
    }, 1000)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showNotifications && !(event.target as Element).closest(".notification-dropdown")) {
        setShowNotifications(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showNotifications])

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <SidebarInset>
            <div className="min-h-screen bg-background p-6">
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b bg-background px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <SidebarTrigger />
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                      Welcome {email
    .split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")}
                    </h1>
                  <div className="relative">
                    
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search"
                      className="pl-10 w-80 bg-background border border-muted rounded-md text-sm font-normal"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    
                    <div className="relative">
                      <button
                        className="relative p-2 hover:bg-muted/50 rounded-md transition-colors"
                        onClick={() => setShowNotifications(!showNotifications)}
                      >
                        <Bell className="h-4 w-4 text-muted-foreground" />
                        {notifications > 0 && (
                          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-red-500 hover:bg-red-500 flex items-center justify-center">
                            {notifications}
                          </Badge>
                        )}
                      </button>

                      {/* Notifications Dropdown */}
                      {showNotifications && (
                        <div className="notification-dropdown absolute right-0 top-full mt-2 w-96 bg-background border border-muted rounded-lg shadow-lg z-50">
                          <div className="p-4 border-b border-muted">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-base font-medium text-foreground">Notifications</h3>
                              <button className="text-sm text-blue-600 hover:text-blue-700 font-normal border border-blue-200 px-3 py-1 rounded-md">
                                View preferences
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <button className="flex-1 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-sm font-medium">
                                Unread
                              </button>
                              <button className="text-sm text-muted-foreground font-normal hover:text-foreground px-4 py-2">
                                All
                              </button>
                            </div>
                          </div>

                          <div className="p-6 text-center">
                            <div className="text-base font-medium text-foreground mb-2">{"You're all up to date"}</div>
                            <div className="text-sm text-muted-foreground">
                              There are no new notifications at the moment.
                            </div>
                          </div>

                          <div className="p-4 border-t border-muted text-right">
                            <button className="text-sm text-blue-600 hover:text-blue-700 font-normal">View all</button>
                          </div>
                        </div>
                      )}
                    </div>
                    <button className="p-2 hover:bg-muted/50 rounded-md transition-colors">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                    </button>
                    
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Fuel Events Chart - Takes up 2/3 of the width */}
                <div className="lg:col-span-2">
                  <Card className="h-[500px] border-0 shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-base font-normal text-foreground">Fuel Events Volume</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[420px]">
                      <ChartContainer
                        config={{
                          refill: {
                            label: "Fuel Refill",
                            color: "#fbbf24",
                          },
                          theft: {
                            label: "Fuel Theft",
                            color: "#ef4444",
                          },
                        }}
                        className="h-full w-full"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={fuelEventData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis
                              dataKey="date"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 12, fill: "#64748b" }}
                            />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                            <ChartTooltip
                              content={<ChartTooltipContent />}
                              formatter={(value, name) => [
                                `${Math.abs(Number(value))}L`,
                                name === "refill" ? "Fuel Refill" : "Fuel Theft",
                              ]}
                            />
                            <Bar dataKey="refill" fill="#fbbf24" radius={[2, 2, 0, 0]} />
                            <Bar dataKey="theft" fill="#ef4444" radius={[2, 2, 0, 0]} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* ROI Section - Takes up 1/3 of the width */}
                <div className="space-y-6">
                  <Card className="border-0 shadow-sm bg-gradient-to-br from-background to-muted/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-6">
                      <CardTitle className="text-base font-normal text-foreground">ROI Performance</CardTitle>
                      <X className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-5">
                        <div className="flex justify-between items-center p-3 rounded-lg bg-green-50 border border-green-100">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">Annual ROI</span>
                          </div>
                          <span className="text-lg font-semibold text-green-700">28.4%</span>
                        </div>

                        <div className="flex justify-between items-center p-3 rounded-lg bg-blue-50 border border-blue-100">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">Quarterly ROI</span>
                          </div>
                          <span className="text-lg font-semibold text-blue-700">7.1%</span>
                        </div>

                        <div className="flex justify-between items-center p-3 rounded-lg bg-orange-50 border border-orange-100">
                          <div className="flex items-center gap-2">
                            <TrendingDown className="h-4 w-4 text-orange-600" />
                            <span className="text-sm font-medium text-orange-800">Monthly ROI</span>
                          </div>
                          <span className="text-lg font-semibold text-orange-700">2.3%</span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-muted">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-foreground mb-1">Kshs.47,230</div>
                          <div className="text-sm text-muted-foreground">Total Returns YTD</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Fuel Overview Section */}
            <div className="px-6 mt-12">
              <div className="mb-6">
                <h2 className="text-2xl font-normal text-foreground mb-6">Your fuel overview</h2>
              </div>

              {/* Fuel Metrics Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Fuel Theft Analytics */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-bold text-foreground">Fuel theft incidents</CardTitle>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="text-3xl font-normal text-foreground">247L</div>
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-xs">
                          +12.5%
                        </Badge>
                        <span className="text-sm text-muted-foreground">156L previous period</span>
                      </div>
                    </div>

                    <div className="h-24">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={[
                            { day: "Jun 13", value: 15 },
                            { day: "Jun 14", value: 22 },
                            { day: "Jun 15", value: 18 },
                            { day: "Jun 16", value: 35 },
                            { day: "Jun 17", value: 28 },
                            { day: "Jun 18", value: 42 },
                            { day: "Today", value: 47 },
                          ]}
                        >
                          <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Jun 13</span>
                      <span>Today</span>
                    </div>

                    <div className="pt-2 border-t border-muted">
                <a
                      href="/dashboard/fuel-theft"
                      className="text-sm text-blue-600 hover:text-blue-700 font-normal"
                    >
                      View more
                    </a>                      
                    <div className="text-xs text-muted-foreground mt-1">Updated 3:09 PM</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Gross Fuel Volume */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-bold text-foreground">Gross fuel volume</CardTitle>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="text-3xl font-normal text-foreground">4,247L</div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                          +8.2%
                        </Badge>
                        <span className="text-sm text-muted-foreground">3,925L previous period</span>
                      </div>
                    </div>

                    <div className="h-24">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={[
                            { day: "Jun 13", value: 580 },
                            { day: "Jun 14", value: 620 },
                            { day: "Jun 15", value: 595 },
                            { day: "Jun 16", value: 640 },
                            { day: "Jun 17", value: 610 },
                            { day: "Jun 18", value: 675 },
                            { day: "Today", value: 690 },
                          ]}
                        >
                          <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Jun 13</span>
                      <span>Today</span>
                    </div>

                    <div className="pt-2 border-t border-muted">
<a
                      href="/dashboard/fuel-report"
                      className="text-sm text-blue-600 hover:text-blue-700 font-normal"
                    >
                      View more
                    </a>                        <div className="text-xs text-muted-foreground mt-1">Updated 3:09 PM</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Fuel Efficiency Score */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-bold text-foreground">Fleet fuel efficiency</CardTitle>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="text-3xl font-normal text-foreground">87.3%</div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                          +2.1%
                        </Badge>
                        <span className="text-sm text-muted-foreground">85.2% previous period</span>
                      </div>
                    </div>

                    <div className="h-24">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={[
                            { day: "Jun 13", value: 84.2 },
                            { day: "Jun 14", value: 60.1 },
                            { day: "Jun 15", value: 84.8 },
                            { day: "Jun 16", value: 86.3 },
                            { day: "Jun 17", value: 55.9 },
                            { day: "Jun 18", value: 87.1 },
                            { day: "Today", value: 87.3 },
                          ]}
                        >
                          <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Jun 13</span>
                      <span>Today</span>
                    </div>

                    <div className="pt-2 border-t border-muted">
<a
                      href="/dashboard/fuel-report"
                      className="text-sm text-blue-600 hover:text-blue-700 font-normal"
                    >
                      View more
                    </a>                        <div className="text-xs text-muted-foreground mt-1">Updated 3:09 PM</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Vehicle Analytics Section */}
            <div className="mt-12 px-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Vehicle Theft Rankings */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-bold text-foreground">Top vehicles by fuel theft</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-100">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-red-700">1</span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-foreground">KDA381X</div>
                            <div className="text-xs text-muted-foreground">353691842162892</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-red-700">89L</div>
                          <div className="text-xs text-muted-foreground">5 incidents</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 border border-orange-100">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-orange-700">2</span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-foreground">KDE386N</div>
                            <div className="text-xs text-muted-foreground">353691842162894</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-orange-700">67L</div>
                          <div className="text-xs text-muted-foreground">4 incidents</div>
                        </div>
                      </div>

                      

                   
                    </div>

                    <div className="pt-4 border-t border-muted mt-4">
                      <div className="text-xs text-muted-foreground">
                        Total stolen: 247L across 15 incidents this period
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* New Vehicles */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-bold text-foreground">New vehicles added</CardTitle>
                      <Info className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="secondary" className="text-xs ml-auto">
                        0.0%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="text-3xl font-normal text-foreground">2</div>
                      <div className="text-sm text-muted-foreground">1 previous period</div>
                    </div>

                    <div className="h-16">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={[
                            { day: "Jun 13", value: 0 },
                            { day: "Jun 14", value: 0 },
                            { day: "Jun 15", value: 1 },
                            { day: "Jun 16", value: 1 },
                            { day: "Jun 17", value: 1 },
                            { day: "Jun 18", value: 2 },
                            { day: "Today", value: 2 },
                          ]}
                        >
                          <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Jun 13</span>
                      <span>Today</span>
                    </div>

                    <div className="pt-2 border-t border-muted">
<a
                      href="/dashboard/vehicles"
                      className="text-sm text-blue-600 hover:text-blue-700 font-normal"
                    >
                      View more
                    </a>                        <div className="text-xs text-muted-foreground mt-1">Updated 3:42 PM</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Top Performing Vehicles */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-bold text-foreground">
                          Top vehicles by efficiency
                        </CardTitle>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="text-sm text-muted-foreground">All time</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-100">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-green-700">1</span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-foreground">KDE366F</div>
                            <div className="text-xs text-muted-foreground">353691842162893</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-green-700">94.2%</div>
                          <div className="text-xs text-muted-foreground">efficiency</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-100">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-700">2</span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-foreground">KDA381X</div>
                            <div className="text-xs text-muted-foreground">353691842162892</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-blue-700">91.8%</div>
                          <div className="text-xs text-muted-foreground">efficiency</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 border border-purple-100">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-purple-700">3</span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-foreground">KDE386N</div>
                            <div className="text-xs text-muted-foreground">353691842162894</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-purple-700">89.5%</div>
                          <div className="text-xs text-muted-foreground">efficiency</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

export default Index
