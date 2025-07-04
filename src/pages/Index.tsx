"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { Bell, Settings, Calendar, CalendarDays, CalendarClock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Label, Line } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { InfoTooltip } from "@/components/InfoTooltip"
import { useCachedApi } from "@/hooks/use-cached-api"

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

  const { cachedApi, clearCache } = useCachedApi()

  const fetchDashboardData = async () => {
    try {
      // Fetch various dashboard metrics with different cache TTLs
      const [vehiclesData, fuelEventsData, efficiencyData] = await Promise.all([
        cachedApi("/vehicles/", { ttl: 10 * 60 * 1000 }), // 10 minutes
        cachedApi("/fuel-events/", { ttl: 5 * 60 * 1000 }), // 5 minutes
        cachedApi("/fleet-efficiency/", { ttl: 15 * 60 * 1000 }), // 15 minutes
      ])

      // Process and set the data as needed
      console.log("Dashboard data loaded from cache/API")
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleDashboardRefresh = () => {
    clearCache()
    fetchDashboardData()
  }

  useEffect(() => {
    setTimeout(() => {
      const stored = localStorage.getItem("userFname")
      if (stored) {
        setEmail(stored)
      }
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
            <div className="min-h-screen bg-background p-4 md:p-6">
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
            <div className="border-b bg-background px-4 md:px-6 py-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2 md:gap-4">
                  <SidebarTrigger />
                  <h1 className="text-xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Welcome{" "}
                    {email
                      .split(" ")
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(" ")}
                  </h1>
                </div>

                {/* Search and Actions */}
                <div className="flex items-center gap-2 md:gap-4">
                  <div className="flex items-center gap-2 md:gap-3">
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
                        <div className="notification-dropdown absolute right-0 top-full mt-2 w-80 md:w-96 bg-background border border-muted rounded-lg shadow-lg z-50">
                          <div className="p-4 border-b border-muted">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-base font-medium text-foreground">Notifications</h3>
                              <button className="text-sm text-blue-600 hover:text-blue-700 font-normal border border-blue-200 px-2 md:px-3 py-1 rounded-md">
                                View preferences
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <button className="flex-1 px-3 md:px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-sm font-medium">
                                Unread
                              </button>
                              <button className="text-sm text-muted-foreground font-normal hover:text-foreground px-3 md:px-4 py-2">
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
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
                {/* Fuel Events Chart - Full width on mobile, 2/3 on desktop */}
                <div className="xl:col-span-2">
                  <Card className="h-[400px] md:h-[500px] border-0 shadow-sm">
                    <CardHeader className="pb-4">
                      <h2 className="text-xl md:text-2xl font-bold text-gray-800">Refill and Theft Graph</h2>
                    </CardHeader>
                    <CardContent className="h-[320px] md:h-[420px]">
                      <ChartContainer
                        config={{
                          refill: { label: "Fuel Refill", color: "#fbbf24" },
                          theft: { label: "Fuel Theft", color: "#ef4444" },
                        }}
                        className="h-full w-full"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart
                            data={fuelEventData}
                            margin={{ top: 20, right: 15, left: 10, bottom: 40 }} // room for the X label
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />

                            {/* X-Axis: visible line/ticks + “Date” label */}
                            <XAxis
                              dataKey="date"
                              axisLine={true}
                              tickLine={true}
                              tick={{ fontSize: 12, fill: "#334155" }}
                              interval="preserveStartEnd"
                              angle={-45}
                              textAnchor="end"
                              height={60}
                              interval={0}
                            >
                              <Label
                                value="Date"
                                position="insideBottom"
                                offset={-10}
                                style={{ fill: "#334155", fontSize: 12, fontWeight: 600 }}
                              />
                            </XAxis>

                            {/* Y-Axis: visible line/ticks + main label + original Refill/Theft labels */}
                            <YAxis axisLine={true} tickLine={true} tick={{ fontSize: 12, fill: "#334155" }}>
                              {/* Main descriptive label */}
                              <Label
                                value="Volume (Liters)"
                                angle={-90}
                                position="insideLeft"
                                offset={20}
                                style={{ fill: "#334155", fontSize: 12, fontWeight: 600 }}
                              />
                              {/* Your original two labels */}
                            </YAxis>

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
                      {/* Legend */}
                      <div className="flex items-center justify-center gap-6 mt-4">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-[#fbbf24] rounded"></div>
                          <span className="text-sm text-muted-foreground">Fuel Refill</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-[#ef4444] rounded"></div>
                          <span className="text-sm text-muted-foreground">Fuel Theft</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* ROI Section */}
                <div className="space-y-4 md:space-y-6">
                  <Card className="border border-gray-300 ring-1 ring-gray-200 shadow-lg rounded-2xl bg-white hover:shadow-xl transition-shadow">
                    <CardHeader className="pb-4 md:pb-6 border-b border-gray-100">
                      <div className="text-center pt-4">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-800">Fuel Savings Performance</h2>
                      </div>
                    </CardHeader>

                    <CardContent className="py-6 px-4 md:px-6 space-y-4">
                      {/* Year-to-Date Savings */}
                      <div className="flex items-center p-4 rounded-lg bg-green-50 border border-green-200 shadow-sm">
                        <Calendar className="h-6 w-6 text-green-600 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-green-800">Yearly Savings</div>
                          <div className="text-lg font-semibold text-green-700">Kshs.47,230</div>
                        </div>
                      </div>

                      {/* Quarterly Savings */}
                      <div className="flex items-center p-4 rounded-lg bg-blue-50 border border-blue-200 shadow-sm">
                        <CalendarDays className="h-6 w-6 text-blue-600 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-blue-800">Quarterly Savings</div>
                          <div className="text-lg font-semibold text-blue-700">Kshs.12,450</div>
                        </div>
                      </div>

                      {/* Monthly Savings */}
                      <div className="flex items-center p-4 rounded-lg bg-orange-50 border border-orange-200 shadow-sm">
                        <CalendarClock className="h-6 w-6 text-orange-600 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-orange-800">Monthly Savings</div>
                          <div className="text-lg font-semibold text-orange-700">Kshs.4,125</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Fuel Overview Section */}
            <div className="px-4 md:px-6 mt-8 md:mt-12">
              <div className="mb-4 md:mb-6">
                <h2 className="text-xl md:text-2xl font-normal text-foreground mb-4 md:mb-6">Your fuel overview</h2>
              </div>

              {/* Fuel Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {/* Fuel Theft Analytics */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-bold text-foreground">Fuel Theft Amount</CardTitle>
                      <InfoTooltip content="Total Amount of fuel stolen from your fleet vehicles. This includes detected unauthorized fuel drainage, siphoning, and tank tampering incidents. Calculated using sensor data and fuel level monitoring." />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="text-2xl md:text-3xl font-normal text-foreground">156L</div>
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-xs">
                          +12.5%
                        </Badge>
                        <span className="text-sm text-muted-foreground">247L previous month</span>
                      </div>
                    </div>

                    <div className="h-16 md:h-24">
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
                        href="/dashboard/fuel-events?filter=theft&scrollTo=table"
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
                      <CardTitle className="text-base font-bold text-foreground">Fuel Fill Volume</CardTitle>
                      <InfoTooltip content="Total volume of all fuel events including refills, consumption, and thefts across your entire fleet. This gives you a comprehensive view of fuel activity and helps track overall fuel management performance." />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="text-2xl md:text-3xl font-normal text-foreground">4,247L</div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                          +8.2%
                        </Badge>
                        <span className="text-sm text-muted-foreground">3,925L previous month</span>
                      </div>
                    </div>

                    <div className="h-16 md:h-24">
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
                        href="/dashboard/fuel-events?filter=fill&scrollTo=table"
                        className="text-sm text-blue-600 hover:text-blue-700 font-normal"
                      >
                        View more
                      </a>
                      <div className="text-xs text-muted-foreground mt-1">Updated 3:09 PM</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Fuel Efficiency Score */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-bold text-foreground">Fleet Fuel Efficiency</CardTitle>
                      <InfoTooltip content="Average fuel efficiency score across your fleet, calculated based on fuel consumption per kilometer, vehicle performance metrics, and driving patterns. Higher scores indicate better fuel utilization and cost savings." />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="text-2xl md:text-3xl font-normal text-foreground">87.3%</div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                          +2.1%
                        </Badge>
                        <span className="text-sm text-muted-foreground">85.2% previous month</span>
                      </div>
                    </div>

                    <div className="h-16 md:h-24">
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
                      <div className="text-xs text-muted-foreground mt-1">Updated 3:09 PM</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Vehicle Analytics Section */}
            <div className="mt-8 md:mt-12 px-4 md:px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {/* Vehicle Theft Rankings */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-bold text-foreground">Top vehicles by fuel theft</CardTitle>
                      <InfoTooltip content="Ranking of vehicles with the highest fuel theft incidents and volumes. Helps identify which vehicles require enhanced security measures or monitoring. Data includes theft volume and incident frequency." />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-100">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-red-700">1</span>
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">KDA381X</div>
                            <div className="text-xs text-muted-foreground truncate">353691842162892</div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-medium text-red-700">89L</div>
                          <div className="text-xs text-muted-foreground">5 incidents</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 border border-orange-100">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-orange-700">2</span>
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">KDE386N</div>
                            <div className="text-xs text-muted-foreground truncate">353691842162894</div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-medium text-orange-700">67L</div>
                          <div className="text-xs text-muted-foreground">4 incidents</div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-muted mt-4">
                      <div className="text-xs text-muted-foreground">
                        Total stolen: 156L across 9 incidents this month
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* New Vehicles */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-bold text-foreground">New vehicles added</CardTitle>
                      <InfoTooltip content="Number of new vehicles added to your fleet monitoring system. Track fleet expansion and ensure all new vehicles are properly configured with fuel monitoring sensors and tracking systems." />
                      <Badge variant="secondary" className="text-xs ml-auto"></Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="text-2xl md:text-3xl font-normal text-foreground">2</div>
                      <div className="text-sm text-muted-foreground">1 previous month</div>
                    </div>

                    <div className="h-12 md:h-16">
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
                      <a href="/dashboard/vehicles" className="text-sm text-blue-600 hover:text-blue-700 font-normal">
                        View more
                      </a>
                      <div className="text-xs text-muted-foreground mt-1">Updated 3:42 PM</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Top Performing Vehicles */}
                <Card className="border-0 shadow-sm md:col-span-2 xl:col-span-1">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-bold text-foreground">
                          Top vehicles by efficiency
                        </CardTitle>
                        <InfoTooltip content="Ranking of your most fuel-efficient vehicles based on consumption per kilometer, maintenance records, and driving patterns. Use this data to identify best practices and optimize fleet performance." />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-100">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-green-700">1</span>
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">KDE366F</div>
                            <div className="text-xs text-muted-foreground truncate">353691842162893</div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-medium text-green-700">94.2%</div>
                          <div className="text-xs text-muted-foreground">efficiency</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-100">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-blue-700">2</span>
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">KDE386N</div>
                            <div className="text-xs text-muted-foreground truncate">353691842162894</div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-medium text-blue-700">91.8%</div>
                          <div className="text-xs text-muted-foreground">efficiency</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 border border-purple-100">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-purple-700">3</span>
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">KDA381X</div>
                            <div className="text-xs text-muted-foreground truncate">353691842162892</div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
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
