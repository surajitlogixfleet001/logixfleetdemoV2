"use client"

import { useState, useEffect, useMemo } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChartContainer } from "@/components/ui/chart"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { ShieldAlert, Download, Eye, MapPin, Fuel, Clock, AlertTriangle, Loader2, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/api"

interface Vehicle {
  id: number
  name: string
  imei: string
  type: string
  license_plate: string
  fuel_capacity: string
  is_active: boolean
  driver_name: string
  driver_phone: string
  notes: string
}

interface FuelEvent {
  id: string
  event_type: string
  vehicle: {
    license_plate: string
    name: string
  }
  timestamp: string
  location: {
    latitude: number
    longitude: number
  }
  fuel_change: {
    amount_liters: number
    before_liters: number
    after_liters: number
  }
  vehicle_state: {
    speed: number
    ignition: boolean
    stationary: boolean
  }
  fill_details?: {
    time_since_last_reading_minutes: number
    previous_timestamp: string | null
  }
  theft_details?: {
    time_window_minutes: number
    previous_timestamp: string
  }
}

interface FuelEventsResponse {
  filters?: {
    license_plate: string
    start_date: string
    end_date: string
    event_type: string
    min_fill_liters: number
    min_theft_liters: number
    theft_time_window_minutes: number
  }
  summary?: {
    period: {
      start: string
      end: string
      days: number
    }
    fill_events: {
      count: number
      total_liters: number
      vehicles_affected: number
      average_fill_liters: number
    }
    theft_events: {
      count: number
      total_liters: number
      vehicles_affected: number
      average_theft_liters: number
    }
    total_events: number
  }
  pagination?: {
    page: number
    page_size: number
    total_events: number
    total_pages: number
    has_next: boolean
    has_previous: boolean
  }
  events: FuelEvent[]
}

interface FuelLevelDataPoint {
  timestamp: string
  displayTime: string
  level: number
  event?: {
    type: string
    display: string
    color: string
    id: string
  }
}

interface PaginationState {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  hasNext: boolean
  hasPrevious: boolean
}

type TimePeriod = "day" | "week"

const FuelTheft = () => {
  // State
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [allEvents, setAllEvents] = useState<FuelEvent[]>([]) // All events for chart
  const [tableEvents, setTableEvents] = useState<FuelEvent[]>([]) // Current page events for table
  const [filteredEvents, setFilteredEvents] = useState<FuelEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<FuelEvent | null>(null)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [eventTypeFilter, setEventTypeFilter] = useState("all")
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [tableLoading, setTableLoading] = useState(false)
  const [chartLoading, setChartLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fuelLevelData, setFuelLevelData] = useState<FuelLevelDataPoint[]>([])
  const [chartTimePeriod, setChartTimePeriod] = useState<TimePeriod>("day")
  const [paginationState, setPaginationState] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: 50,
    hasNext: false,
    hasPrevious: false,
  })
  const { toast } = useToast()

  // Add these state variables after the existing state declarations
  const [reportPeriod, setReportPeriod] = useState<"daily" | "weekly" | "monthly">("daily")

  // Get unique vehicles from the data
  const uniqueVehicles = useMemo(() => {
    return vehicles.map((v) => ({
      license_plate: v.license_plate,
      name: v.name,
    }))
  }, [vehicles])

  // Fetch vehicles
  const fetchVehicles = async () => {
    try {
      console.log("🚗 Fetching vehicles...")
      const response = await api.get("/vehicles/")
      console.log("🚗 Vehicles response:", response.data)
      const vehiclesData = response.data.fleet_overview || []
      setVehicles(vehiclesData)
      console.log("🚗 Vehicles set:", vehiclesData.length, "vehicles")
      return vehiclesData
    } catch (err: any) {
      console.error("❌ Error fetching vehicles:", err)
      setError("Failed to fetch vehicles data")
      return []
    }
  }

  // Fetch all events for chart (company-wide or vehicle-specific)
  const fetchAllEventsForChart = async () => {
    try {
      setChartLoading(true)
      console.log("📊 Fetching chart data for vehicle filter:", selectedVehicleFilter)

      // Build URL - always start with base endpoint
      let url = "/fuel-events/"
      const params = new URLSearchParams()

      // Add vehicle filter if not "all"
      if (selectedVehicleFilter && selectedVehicleFilter !== "all") {
        params.append("license_plate", selectedVehicleFilter)
      }

      // Add params to URL if any
      if (params.toString()) {
        url += "?" + params.toString()
      }

      console.log("📊 Chart API URL:", url)

      const response = await api.get(url)
      console.log("📊 Chart API response:", response.data)

      // Handle different response formats
      let eventsData: FuelEvent[] = []

      if (response.data.events && Array.isArray(response.data.events)) {
        eventsData = response.data.events
      } else if (Array.isArray(response.data)) {
        eventsData = response.data
      } else {
        console.warn("📊 Unexpected chart data format:", response.data)
        eventsData = []
      }

      console.log("📊 Chart events loaded:", eventsData.length)
      setAllEvents(eventsData)
      setError(null)

      if (eventsData.length > 0) {
        toast({
          title: "Chart Data Loaded",
          description: `Successfully loaded ${eventsData.length} fuel events for chart.`,
        })
      }

      return eventsData
    } catch (err: any) {
      console.error("❌ Error fetching chart events:", err)
      setError(err.message || "Failed to fetch fuel events data")
      toast({
        title: "Error",
        description: "Failed to fetch fuel events data. Please try again.",
        variant: "destructive",
      })
      return []
    } finally {
      setChartLoading(false)
    }
  }

  // Fetch table data with pagination (company-wide or vehicle-specific)
  const fetchTableData = async (page: number) => {
    try {
      setTableLoading(true)
      console.log("📋 Fetching table data for page:", page, "vehicle filter:", selectedVehicleFilter)

      // Build URL - always start with base endpoint
      let url = "/fuel-events/"
      const params = new URLSearchParams()
      params.append("page", page.toString())

      // Add vehicle filter if not "all"
      if (selectedVehicleFilter && selectedVehicleFilter !== "all") {
        params.append("license_plate", selectedVehicleFilter)
      }

      url += "?" + params.toString()
      console.log("📋 Table API URL:", url)

      const response = await api.get(url)
      console.log("📋 Table API response:", response.data)

      // Handle different response formats
      let eventsData: FuelEvent[] = []
      let paginationData = {
        page: page,
        page_size: 50,
        total_events: 0,
        total_pages: 1,
        has_next: false,
        has_previous: false,
      }

      if (response.data.events && Array.isArray(response.data.events)) {
        eventsData = response.data.events
        if (response.data.pagination) {
          paginationData = response.data.pagination
        }
      } else if (Array.isArray(response.data)) {
        eventsData = response.data
        paginationData.total_events = eventsData.length
      } else {
        console.warn("📋 Unexpected table data format:", response.data)
        eventsData = []
      }

      console.log("📋 Table events loaded:", eventsData.length)

      // Update table data
      setTableEvents(eventsData)
      setFilteredEvents(eventsData)

      // Update pagination state
      setPaginationState({
        currentPage: paginationData.page,
        totalPages: paginationData.total_pages,
        totalItems: paginationData.total_events,
        pageSize: paginationData.page_size,
        hasNext: paginationData.has_next,
        hasPrevious: paginationData.has_previous,
      })

      setError(null)
      return eventsData
    } catch (err: any) {
      console.error("❌ Error fetching table data:", err)
      setError(err.message || "Failed to fetch table data")
      toast({ title: "Error", description: "Failed to fetch table data. Please try again.", variant: "destructive" })
      return []
    } finally {
      setTableLoading(false)
    }
  }

  // Initial data fetch - ALWAYS load company-wide data first
  useEffect(() => {
    const initializeData = async () => {
      console.log("🚀 INITIALIZING FUEL THEFT PAGE...")
      setLoading(true)
      setError(null)

      try {
        // Step 1: Fetch vehicles
        const vehiclesData = await fetchVehicles()
        console.log("✅ Step 1 complete - Vehicles:", vehiclesData.length)

        // Step 2: Fetch chart data (all company events)
        const chartData = await fetchAllEventsForChart()
        console.log("✅ Step 2 complete - Chart events:", chartData.length)

        // Step 3: Fetch table data (first page of company events)
        const tableData = await fetchTableData(1)
        console.log("✅ Step 3 complete - Table events:", tableData.length)

        console.log("🎉 INITIALIZATION COMPLETE!")

        if (chartData.length === 0 && tableData.length === 0) {
          console.warn("⚠️ No data loaded - this might indicate API issues")
          setError("No fuel events data available. Please check your API endpoints.")
        }
      } catch (error) {
        console.error("💥 Initialization failed:", error)
        setError("Failed to initialize page. Please refresh and try again.")
      } finally {
        setLoading(false)
      }
    }

    initializeData()
  }, []) // Only run once on mount

  // When vehicle filter changes, reload data
  useEffect(() => {
    if (!loading && vehicles.length > 0) {
      console.log("🔄 Vehicle filter changed to:", selectedVehicleFilter)
      fetchAllEventsForChart()
      fetchTableData(1) // Reset to page 1 when vehicle changes
    }
  }, [selectedVehicleFilter])

  // Generate fuel level data for the selected vehicle filter
  useEffect(() => {
    console.log("📈 Generating fuel level data from", allEvents.length, "events")

    if (!allEvents.length) {
      setFuelLevelData([])
      return
    }

    // Filter events by selected vehicle if not "all"
    let eventsToProcess = allEvents
    if (selectedVehicleFilter !== "all") {
      eventsToProcess = allEvents.filter((e) => e.vehicle.license_plate === selectedVehicleFilter)
      console.log("📈 Filtered to", eventsToProcess.length, "events for vehicle", selectedVehicleFilter)
    }

    // Sort events by timestamp
    const sortedEvents = [...eventsToProcess].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    )

    // Apply time period filter
    const now = new Date()
    let startTime: Date

    switch (chartTimePeriod) {
      case "day":
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case "week":
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    }

    const filteredByTime = sortedEvents.filter((e) => new Date(e.timestamp) >= startTime)
    console.log("📈 Time filtered to", filteredByTime.length, "events")

    // Generate fuel level data points with events
    const dataPoints: FuelLevelDataPoint[] = []

    // Create initial data point if needed
    if (filteredByTime.length > 0) {
      const firstEvent = filteredByTime[0]
      const firstTimestamp = new Date(firstEvent.timestamp)
      // Add a data point 24 hours before the first event
      const initialTimestamp = new Date(firstTimestamp.getTime() - 24 * 60 * 60 * 1000)

      dataPoints.push({
        timestamp: initialTimestamp.toISOString(),
        displayTime: initialTimestamp.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        level: firstEvent.fuel_change.before_liters,
      })
    }

    // Add data points for each event
    filteredByTime.forEach((event) => {
      const eventTimestamp = new Date(event.timestamp)
      const level = event.fuel_change.after_liters

      let eventColor = "gray"
      let eventDisplay = event.event_type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())

      switch (event.event_type) {
        case "theft":
          eventColor = "red"
          eventDisplay = "Theft"
          break
        case "fill":
          eventColor = "green"
          eventDisplay = "Refuel"
          break
        default:
          eventColor = "gray"
      }

      dataPoints.push({
        timestamp: event.timestamp,
        displayTime: eventTimestamp.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        level,
        event: {
          type: event.event_type,
          display: eventDisplay,
          color: eventColor,
          id: event.id,
        },
      })
    })

    console.log("📈 Generated", dataPoints.length, "chart data points")
    setFuelLevelData(dataPoints)
  }, [allEvents, selectedVehicleFilter, chartTimePeriod])

  // Helper Functions
  const getEventIcon = (type: string) => {
    switch (type) {
      case "theft":
        return <ShieldAlert className="h-4 w-4 text-red-500" />
      case "fill":
        return <Fuel className="h-4 w-4 text-green-500" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getSeverityBadge = (eventType: string) => {
    switch (eventType) {
      case "theft":
        return "destructive"
      case "fill":
        return "default"
      default:
        return "outline"
    }
  }

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload

      if (data.event) {
        const event = data.event
        const eventDetails = allEvents.find((e) => e.id === event.id)

        return (
          <div className="bg-background border rounded-lg shadow-lg p-4 max-w-xs">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getEventColor(event.type) }} />
              <span className="font-bold">{event.display}</span>
            </div>

            <div className="space-y-1 text-sm">
              <div>
                <span className="font-medium">Vehicle:</span> {eventDetails?.vehicle.license_plate}
              </div>
              <div>
                <span className="font-medium">Time:</span> {data.displayTime}
              </div>
              <div>
                <span className="font-medium">Fuel Level:</span> {data.level}L
              </div>

              {eventDetails && (
                <>
                  <div>
                    <span className="font-medium">Previous Level:</span> {eventDetails.fuel_change.before_liters}L
                  </div>
                  <div>
                    <span className="font-medium">Change:</span> {eventDetails.fuel_change.amount_liters}L
                  </div>
                </>
              )}
            </div>
          </div>
        )
      } else {
        // Regular tooltip for non-event points
        return (
          <div className="bg-background border rounded-lg shadow-lg p-3">
            <p className="font-medium">{data.displayTime}</p>
            <p className="text-sm">
              <span className="text-blue-600 font-medium">Fuel Level: {payload[0].value.toFixed(1)}L</span>
            </p>
          </div>
        )
      }
    }

    return null
  }

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case "theft":
        return "#ef4444" // red
      case "fill":
        return "#22c55e" // green
      default:
        return "#6b7280" // gray
    }
  }

  // Custom dot for the chart
  const CustomizedDot = (props: any) => {
    const { cx, cy, payload } = props

    if (!payload.event) {
      return null
    }

    return <circle cx={cx} cy={cy} r={8} stroke={getEventColor(payload.event.type)} strokeWidth={3} fill="white" />
  }

  // Filters
  const handleFilter = () => {
    let filtered = tableEvents

    // Date filter
    if (startDate) filtered = filtered.filter((e) => new Date(e.timestamp) >= new Date(startDate))
    if (endDate) filtered = filtered.filter((e) => new Date(e.timestamp) <= new Date(endDate))

    // Event type filter
    if (eventTypeFilter !== "all") filtered = filtered.filter((e) => e.event_type === eventTypeFilter)

    setFilteredEvents(filtered)
  }

  const clearFilters = () => {
    setStartDate("")
    setEndDate("")
    setEventTypeFilter("all")
    setReportPeriod("daily")
    setFilteredEvents(tableEvents)
  }

  // CSV download
  const downloadCSV = () => {
    const headers = [
      "ID",
      "Vehicle",
      "Event Type",
      "Timestamp",
      "Previous Level (L)",
      "Current Level (L)",
      "Change Amount (L)",
      "Latitude",
      "Longitude",
      "Speed",
      "Ignition",
    ]
    const rows = filteredEvents.map((e) =>
      [
        e.id,
        `"${e.vehicle.license_plate}"`,
        `"${e.event_type}"`,
        e.timestamp,
        e.fuel_change.before_liters,
        e.fuel_change.after_liters,
        e.fuel_change.amount_liters,
        e.location.latitude,
        e.location.longitude,
        e.vehicle_state.speed,
        e.vehicle_state.ignition ? "Yes" : "No",
      ].join(","),
    )
    const csvContent = [headers.join(","), ...rows].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `fuel-events-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast({ title: "Download Complete", description: `Downloaded ${filteredEvents.length} records.` })
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    fetchTableData(page)
  }

  const theftCount = filteredEvents.filter((e) => e.event_type === "theft").length
  const fillCount = filteredEvents.filter((e) => e.event_type === "fill").length

  // Find max fuel level for chart
  const maxFuelLevel = useMemo(() => {
    if (!fuelLevelData.length) return 300
    return Math.max(...fuelLevelData.map((d) => d.level)) * 1.2
  }, [fuelLevelData])

  // Show loading screen
  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading fuel theft data...</p>
                <p className="text-sm text-muted-foreground">Please wait while we fetch your data</p>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    )
  }

  // Show error screen
  if (error && allEvents.length === 0 && tableEvents.length === 0) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <main className="flex-1 p-6 flex items-center justify-center">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-center text-destructive">Error Loading Data</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p>{error}</p>
                <Button
                  onClick={() => {
                    setError(null)
                    setLoading(true)
                    fetchVehicles().then(() => {
                      fetchAllEventsForChart().then(() => {
                        fetchTableData(1).then(() => {
                          setLoading(false)
                        })
                      })
                    })
                  }}
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <ShieldAlert className="h-8 w-8 text-destructive" />
                Fuel Analysis Detection
              </h1>
              <p className="text-muted-foreground">Monitor and detect suspicious fuel activities across your fleet</p>
              {/* Debug info */}
              <p className="text-xs text-muted-foreground mt-1">
                Debug: {allEvents.length} chart events, {tableEvents.length} table events, {vehicles.length} vehicles
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchAllEventsForChart} variant="outline" disabled={chartLoading}>
                {chartLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh Chart Data
              </Button>
              <Button
                onClick={() => fetchTableData(paginationState.currentPage)}
                variant="outline"
                disabled={tableLoading}
              >
                {tableLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh Table
              </Button>
            </div>
          </div>

          {error && (
            <Card className="border-orange-500">
              <CardContent className="pt-6">
                <div className="text-center text-orange-600">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                  <p className="font-medium">Warning</p>
                  <p className="text-sm">{error}</p>
                  <p className="text-xs mt-2">Showing available data below</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                <ShieldAlert className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredEvents.length}</div>
                <p className="text-xs text-muted-foreground">
                  {selectedVehicleFilter === "all" ? "All vehicles" : `Vehicle: ${selectedVehicleFilter}`}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Theft Events</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{theftCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fill Events</CardTitle>
                <Fuel className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{fillCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Page</CardTitle>
                <ShieldAlert className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-primary">
                  {paginationState.currentPage} of {paginationState.totalPages}
                </div>
                <p className="text-xs text-muted-foreground">Page size: {paginationState.pageSize}</p>
              </CardContent>
            </Card>
          </div>

          {/* Fuel Level Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                Fuel Level Timeline
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({chartTimePeriod === "day" ? "Last 24 hours" : "Last 7 days"})
                </span>
                {chartLoading && <span className="text-xs text-orange-600 ml-2">(Loading chart data...)</span>}
              </CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="time-period">Time Period:</Label>
                  <Select value={chartTimePeriod} onValueChange={(v: TimePeriod) => setChartTimePeriod(v)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">24 Hours</SelectItem>
                      <SelectItem value="week">7 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="chart-vehicle">Vehicle:</Label>
                  <Select value={selectedVehicleFilter} onValueChange={setSelectedVehicleFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All Vehicles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Vehicles</SelectItem>
                      {uniqueVehicles.map((v) => (
                        <SelectItem key={v.license_plate} value={v.license_plate}>
                          {v.name} ({v.license_plate})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {fuelLevelData.length > 0 ? (
                <ChartContainer
                  className="h-[600px] w-full"
                  config={{
                    level: { label: "Fuel Level", color: "hsl(var(--chart-1))" },
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={fuelLevelData} margin={{ top: 30, right: 40, left: 40, bottom: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="displayTime" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        domain={[0, maxFuelLevel]}
                        label={{ value: "Fuel Level (L)", angle: -90, position: "insideLeft" }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="top" height={36} />

                      {/* Low fuel warning reference line */}
                      <ReferenceLine
                        y={50}
                        stroke="#f97316"
                        strokeDasharray="3 3"
                        label={{
                          value: "Low Fuel Warning (50L)",
                          position: "right",
                          fill: "#f97316",
                          fontWeight: "bold",
                          fontSize: 12,
                        }}
                      />

                      <Line
                        type="monotone"
                        dataKey="level"
                        name="Fuel Level"
                        stroke="#2563eb"
                        strokeWidth={4}
                        dot={<CustomizedDot />}
                        activeDot={{ r: 8, stroke: "#2563eb", strokeWidth: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-[600px] flex items-center justify-center border border-dashed rounded-lg">
                  <div className="text-center text-muted-foreground">
                    <p>No fuel level data available for chart</p>
                    <p className="text-sm">
                      {allEvents.length === 0
                        ? "No events loaded from API"
                        : "Try selecting a different time period or vehicle"}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
            <div className="px-6 pb-6">
              <div className="flex flex-wrap gap-4 justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm">Theft</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm">Fill</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Advanced Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div>
                  <Label htmlFor="vehicle-filter">Filter by Vehicle</Label>
                  <Select value={selectedVehicleFilter} onValueChange={setSelectedVehicleFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All vehicles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Vehicles</SelectItem>
                      {uniqueVehicles.map((v) => (
                        <SelectItem key={v.license_plate} value={v.license_plate}>
                          {v.name} ({v.license_plate})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="report-period">Period</Label>
                  <Select
                    value={reportPeriod}
                    onValueChange={(v: "daily" | "weekly" | "monthly") => setReportPeriod(v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="event-type">Event Type</Label>
                  <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Events" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Events</SelectItem>
                      <SelectItem value="theft">Theft</SelectItem>
                      <SelectItem value="fill">Fill</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 items-end">
                  <Button onClick={handleFilter}>Apply Filters</Button>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Events Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Fuel Events (Page {paginationState.currentPage} of {paginationState.totalPages}, showing{" "}
                  {paginationState.pageSize} records per page, total {paginationState.totalItems} records)
                  {tableLoading && (
                    <span className="text-sm font-normal text-orange-600 ml-2">(Loading table data...)</span>
                  )}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {tableLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading table data...</p>
                  </div>
                </div>
              ) : filteredEvents.length > 0 ? (
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Fuel Change</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEvents.map((event) => (
                        <TableRow key={event.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getEventIcon(event.event_type)}
                              <span className="font-medium">
                                {event.event_type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{event.vehicle.license_plate}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {new Date(event.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span
                                className={`font-semibold ${
                                  event.event_type === "theft" ? "text-destructive" : "text-green-600"
                                }`}
                              >
                                {event.event_type === "theft" ? "-" : "+"}
                                {event.fuel_change.amount_liters}L
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {event.fuel_change.before_liters}L → {event.fuel_change.after_liters}L
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location.latitude.toFixed(4)}, {event.location.longitude.toFixed(4)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setSelectedEvent(event)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    {getEventIcon(event.event_type)}
                                    Event Details -{" "}
                                    {event.event_type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                                  </DialogTitle>
                                </DialogHeader>
                                {selectedEvent && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label className="text-sm font-medium">Vehicle</Label>
                                        <p className="text-sm">{selectedEvent.vehicle.license_plate}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Timestamp</Label>
                                        <p className="text-sm font-mono">
                                          {new Date(selectedEvent.timestamp).toLocaleString()}
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Previous Level</Label>
                                        <p className="text-sm">{selectedEvent.fuel_change.before_liters}L</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Current Level</Label>
                                        <p className="text-sm">{selectedEvent.fuel_change.after_liters}L</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Change Amount</Label>
                                        <p
                                          className={`text-sm font-semibold ${
                                            selectedEvent.event_type === "theft" ? "text-destructive" : "text-green-600"
                                          }`}
                                        >
                                          {selectedEvent.event_type === "theft" ? "-" : "+"}
                                          {selectedEvent.fuel_change.amount_liters}L
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Event Type</Label>
                                        <Badge variant={getSeverityBadge(selectedEvent.event_type) as any}>
                                          {selectedEvent.event_type
                                            .replace("_", " ")
                                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                                        </Badge>
                                      </div>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Location</Label>
                                      <p className="text-sm font-mono">
                                        {selectedEvent.location.latitude.toFixed(6)},{" "}
                                        {selectedEvent.location.longitude.toFixed(6)}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Vehicle State</Label>
                                      <div className="flex gap-2 mt-1">
                                        <Badge variant={selectedEvent.vehicle_state.ignition ? "default" : "secondary"}>
                                          {selectedEvent.vehicle_state.ignition ? "Ignition ON" : "Ignition OFF"}
                                        </Badge>
                                        <Badge variant="outline">Speed: {selectedEvent.vehicle_state.speed} km/h</Badge>
                                        <Badge
                                          variant={selectedEvent.vehicle_state.stationary ? "secondary" : "outline"}
                                        >
                                          {selectedEvent.vehicle_state.stationary ? "Stationary" : "Moving"}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <div className="h-[400px] flex items-center justify-center border border-dashed rounded-lg">
                  <div className="text-center text-muted-foreground">
                    <p>No fuel events available</p>
                    <p className="text-sm">
                      {tableEvents.length === 0 ? "No events loaded from API" : "Try adjusting your filters"}
                    </p>
                  </div>
                </div>
              )}

              {/* API-based Pagination */}
              {paginationState.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Page {paginationState.currentPage} of {paginationState.totalPages} ({paginationState.totalItems}{" "}
                    total records, {paginationState.pageSize} per page)
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            if (paginationState.hasPrevious) handlePageChange(paginationState.currentPage - 1)
                          }}
                          className={!paginationState.hasPrevious ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>

                      {/* Show first page */}
                      {paginationState.currentPage > 3 && (
                        <>
                          <PaginationItem>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault()
                                handlePageChange(1)
                              }}
                            >
                              1
                            </PaginationLink>
                          </PaginationItem>
                          {paginationState.currentPage > 4 && <span className="px-2">...</span>}
                        </>
                      )}

                      {/* Show pages around current page */}
                      {Array.from({ length: Math.min(5, paginationState.totalPages) }, (_, i) => {
                        const pageNum =
                          Math.max(1, Math.min(paginationState.totalPages - 4, paginationState.currentPage - 2)) + i
                        if (pageNum <= paginationState.totalPages) {
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault()
                                  handlePageChange(pageNum)
                                }}
                                isActive={pageNum === paginationState.currentPage}
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          )
                        }
                        return null
                      })}

                      {/* Show last page */}
                      {paginationState.currentPage < paginationState.totalPages - 2 && (
                        <>
                          {paginationState.currentPage < paginationState.totalPages - 3 && (
                            <span className="px-2">...</span>
                          )}
                          <PaginationItem>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault()
                                handlePageChange(paginationState.totalPages)
                              }}
                            >
                              {paginationState.totalPages}
                            </PaginationLink>
                          </PaginationItem>
                        </>
                      )}

                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            if (paginationState.hasNext) handlePageChange(paginationState.currentPage + 1)
                          }}
                          className={!paginationState.hasNext ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}

              {/* Download Button */}
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={downloadCSV}
                  className="flex items-center gap-2"
                  disabled={filteredEvents.length === 0}
                >
                  <Download className="h-4 w-4" />
                  Download CSV Report ({filteredEvents.length} records)
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </SidebarProvider>
  )
}

export default FuelTheft
