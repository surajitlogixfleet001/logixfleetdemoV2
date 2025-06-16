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
import { Progress } from "@/components/ui/progress"
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
  filters: {
    license_plate: string
    start_date: string
    end_date: string
    event_type: string
    min_fill_liters: number
    min_theft_liters: number
    theft_time_window_minutes: number
  }
  summary: {
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
  pagination: {
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

interface LoadingState {
  isLoading: boolean
  currentPage: number
  totalPages: number
  loadedRecords: number
  totalRecords: number
  progress: number
}

type TimePeriod = "day" | "week"

const FuelTheft = () => {
  // State
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [events, setEvents] = useState<FuelEvent[]>([])
  const [filteredEvents, setFilteredEvents] = useState<FuelEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<FuelEvent | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [eventTypeFilter, setEventTypeFilter] = useState("all")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    currentPage: 0,
    totalPages: 0,
    loadedRecords: 0,
    totalRecords: 0,
    progress: 0,
  })
  const [error, setError] = useState<string | null>(null)
  const [selectedVehicle, setSelectedVehicle] = useState<string>("")
  const [fuelLevelData, setFuelLevelData] = useState<FuelLevelDataPoint[]>([])
  const [chartTimePeriod, setChartTimePeriod] = useState<TimePeriod>("day")
  const itemsPerPage = 10
  const { toast } = useToast()

  // Add these state variables after the existing state declarations
  const [reportPeriod, setReportPeriod] = useState<"daily" | "weekly" | "monthly">("daily")
  const [filterByLicensePlate, setFilterByLicensePlate] = useState("")
  const [filterByIMEI, setFilterByIMEI] = useState("")

  // Get unique event types from the data
  const uniqueEventTypes = useMemo(() => {
    const types = [...new Set(events.map((event) => event.event_type))]
    return types.map((type) => ({
      value: type,
      display: type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    }))
  }, [events])

  // Get unique vehicles from the data
  const uniqueVehicles = useMemo(() => {
    return vehicles.map((v) => v.license_plate)
  }, [vehicles])

  // Fetch vehicles
  const fetchVehicles = async () => {
    try {
      const response = await api.get("/vehicles/")
      const vehiclesData = response.data.fleet_overview || []
      setVehicles(vehiclesData)
    } catch (err: any) {
      console.error("Error fetching vehicles:", err)
      setError("Failed to fetch vehicles data")
    }
  }

  // Fetch data with pagination
  const fetchFuelEvents = async () => {
    if (!selectedVehicle) return

    try {
      setLoadingState({
        isLoading: true,
        currentPage: 0,
        totalPages: 0,
        loadedRecords: 0,
        totalRecords: 0,
        progress: 0,
      })
      setError(null)

      // First, get the first page to know total pages and show initial data
      const firstResponse = await api.get(`/fuel-events?license_plate=${selectedVehicle}&event_type=all&page=1`)
      const firstData: FuelEventsResponse = firstResponse.data

      if (!firstData.events || !Array.isArray(firstData.events)) {
        throw new Error("Invalid data format received from API")
      }

      const totalPages = firstData.pagination?.total_pages || 1
      const totalRecords = firstData.pagination?.total_events || firstData.events.length

      // Show first page data immediately
      setEvents(firstData.events)
      setFilteredEvents(firstData.events)

      setLoadingState({
        isLoading: totalPages > 1,
        currentPage: 1,
        totalPages,
        loadedRecords: firstData.events.length,
        totalRecords,
        progress: totalPages > 1 ? (1 / totalPages) * 100 : 100,
      })

      // If there are more pages, load them progressively
      if (totalPages > 1) {
        const batchSize = 3
        const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2)

        for (let i = 0; i < remainingPages.length; i += batchSize) {
          const batch = remainingPages.slice(i, i + batchSize)

          const batchPromises = batch.map((page) =>
            api
              .get(`/fuel-events?license_plate=${selectedVehicle}&event_type=all&page=${page}`)
              .then((res) => res.data),
          )

          const batchResults = await Promise.all(batchPromises)

          // Update data progressively
          setEvents((prevData) => {
            const newData = [...prevData]
            batchResults.forEach((data: FuelEventsResponse) => {
              if (data.events && Array.isArray(data.events)) {
                newData.push(...data.events)
              }
            })
            return newData
          })

          // Update filtered data if no filters are applied
          setFilteredEvents((prevFiltered) => {
            const newFiltered = [...prevFiltered]
            batchResults.forEach((data: FuelEventsResponse) => {
              if (data.events && Array.isArray(data.events)) {
                newFiltered.push(...data.events)
              }
            })
            return newFiltered
          })

          // Update loading state
          const loadedPages = 1 + i + batch.length
          const newLoadedRecords =
            firstData.events.length + batchResults.reduce((sum, data) => sum + (data.events?.length || 0), 0)

          setLoadingState({
            isLoading: loadedPages < totalPages,
            currentPage: loadedPages,
            totalPages,
            loadedRecords: newLoadedRecords,
            totalRecords,
            progress: (loadedPages / totalPages) * 100,
          })

          // Small delay to prevent overwhelming the API
          if (i + batchSize < remainingPages.length) {
            await new Promise((resolve) => setTimeout(resolve, 100))
          }
        }

        toast({
          title: "Data Loading Complete",
          description: `Successfully loaded all ${totalRecords} fuel events.`,
        })
      }
    } catch (err: any) {
      console.error("Error fetching fuel events:", err)
      setError(err.message || "Failed to fetch fuel events data")
      setLoadingState((prev) => ({ ...prev, isLoading: false }))
      toast({
        title: "Error",
        description: "Failed to fetch fuel events data. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchVehicles()
  }, [])

  useEffect(() => {
    if (selectedVehicle !== "all") {
      fetchFuelEvents()
    }
  }, [selectedVehicle])

  // Generate fuel level data for the selected vehicle
  useEffect(() => {
    if (selectedVehicle === "all" || !events.length) {
      setFuelLevelData([])
      return
    }

    // Sort events by timestamp
    const sortedEvents = [...events].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

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

    setFuelLevelData(dataPoints)
  }, [selectedVehicle, events, chartTimePeriod])

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
        const eventDetails = events.find((e) => e.id === event.id)

        return (
          <div className="bg-background border rounded-lg shadow-lg p-4 max-w-xs">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getEventColor(event.type) }} />
              <span className="font-bold">{event.display}</span>
            </div>

            <div className="space-y-1 text-sm">
              <div>
                <span className="font-medium">Vehicle:</span> {selectedVehicle}
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
    let filtered = events

    // Date filter
    if (startDate) filtered = filtered.filter((e) => new Date(e.timestamp) >= new Date(startDate))
    if (endDate) filtered = filtered.filter((e) => new Date(e.timestamp) <= new Date(endDate))

    // Event type filter
    if (eventTypeFilter !== "all") filtered = filtered.filter((e) => e.event_type === eventTypeFilter)

    setFilteredEvents(filtered)
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setStartDate("")
    setEndDate("")
    setEventTypeFilter("all")
    setSeverityFilter("all")
    setReportPeriod("daily")
    setFilterByLicensePlate("")
    setFilterByIMEI("")
    setFilteredEvents(events)
    setCurrentPage(1)
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

  // Pagination
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentEvents = filteredEvents.slice(startIndex, startIndex + itemsPerPage)

  const theftCount = filteredEvents.filter((e) => e.event_type === "theft").length
  const fillCount = filteredEvents.filter((e) => e.event_type === "fill").length

  // Find max fuel level for chart
  const maxFuelLevel = useMemo(() => {
    if (!fuelLevelData.length) return 300
    return Math.max(...fuelLevelData.map((d) => d.level)) * 1.2
  }, [fuelLevelData])

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
            </div>
            <Button onClick={fetchFuelEvents} variant="outline" disabled={loadingState.isLoading}>
              {loadingState.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh Data
            </Button>
          </div>

          {/* Loading Progress */}
          {loadingState.isLoading && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading Data...
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>
                      Progress: {loadingState.currentPage} of {loadingState.totalPages} pages
                    </span>
                    <span>
                      {loadingState.loadedRecords} of {loadingState.totalRecords} records
                    </span>
                  </div>
                  <Progress value={loadingState.progress} className="w-full" />
                </div>
                <p className="text-sm text-muted-foreground">
                  You can view and filter the data below while more records are being loaded in the background.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Filters - Always visible */}
          <Card>
            <CardHeader>
              <CardTitle>Advanced Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div>
                  <Label htmlFor="vehicle-select-main">Select Vehicle</Label>
                  <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((v) => (
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

          {/* Conditional content based on error, vehicle selection, etc. */}
          {error ? (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="text-center text-destructive">
                  <AlertTriangle className="h-10 w-10 mx-auto mb-2" />
                  <p>{error}</p>
                </div>
              </CardContent>
            </Card>
          ) : !selectedVehicle ? (
            <Card>
              <CardHeader>
                <CardTitle>Select a Vehicle</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <ShieldAlert className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Vehicle Selected</h3>
                  <p className="text-muted-foreground">
                    Please select a vehicle from the dropdown above to view fuel events and analytics.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                    <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{filteredEvents.length}</div>
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
                    <CardTitle className="text-sm font-medium">Selected Vehicle</CardTitle>
                    <ShieldAlert className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold text-primary">{selectedVehicle}</div>
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
                    {loadingState.isLoading && (
                      <span className="text-xs text-orange-600 ml-2">(Updating as data loads...)</span>
                    )}
                  </CardTitle>
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
                          <XAxis
                            dataKey="displayTime"
                            tick={{ fontSize: 11 }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
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
                        <p>No fuel level data available for the selected vehicle</p>
                        <p className="text-sm">Select a different vehicle or check your data</p>
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

              {/* Events Table */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      Fuel Events (Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredEvents.length)}{" "}
                      of {filteredEvents.length} Records)
                      {loadingState.isLoading && (
                        <span className="text-sm font-normal text-orange-600 ml-2">
                          (Loading more data... {loadingState.loadedRecords}/{loadingState.totalRecords})
                        </span>
                      )}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
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
                        {currentEvents.map((event) => (
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
                                              selectedEvent.event_type === "theft"
                                                ? "text-destructive"
                                                : "text-green-600"
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
                                          <Badge
                                            variant={selectedEvent.vehicle_state.ignition ? "default" : "secondary"}
                                          >
                                            {selectedEvent.vehicle_state.ignition ? "Ignition ON" : "Ignition OFF"}
                                          </Badge>
                                          <Badge variant="outline">
                                            Speed: {selectedEvent.vehicle_state.speed} km/h
                                          </Badge>
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

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages} ({filteredEvents.length} total records)
                      </div>
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              href="#"
                              onClick={(e) => {
                                e.preventDefault()
                                if (currentPage > 1) setCurrentPage(currentPage - 1)
                              }}
                              className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                            />
                          </PaginationItem>

                          {/* Show first page */}
                          {currentPage > 3 && (
                            <>
                              <PaginationItem>
                                <PaginationLink
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    setCurrentPage(1)
                                  }}
                                >
                                  1
                                </PaginationLink>
                              </PaginationItem>
                              {currentPage > 4 && <span className="px-2">...</span>}
                            </>
                          )}

                          {/* Show pages around current page */}
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                            if (pageNum <= totalPages) {
                              return (
                                <PaginationItem key={pageNum}>
                                  <PaginationLink
                                    href="#"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      setCurrentPage(pageNum)
                                    }}
                                    isActive={pageNum === currentPage}
                                  >
                                    {pageNum}
                                  </PaginationLink>
                                </PaginationItem>
                              )
                            }
                            return null
                          })}

                          {/* Show last page */}
                          {currentPage < totalPages - 2 && (
                            <>
                              {currentPage < totalPages - 3 && <span className="px-2">...</span>}
                              <PaginationItem>
                                <PaginationLink
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    setCurrentPage(totalPages)
                                  }}
                                >
                                  {totalPages}
                                </PaginationLink>
                              </PaginationItem>
                            </>
                          )}

                          <PaginationItem>
                            <PaginationNext
                              href="#"
                              onClick={(e) => {
                                e.preventDefault()
                                if (currentPage < totalPages) setCurrentPage(currentPage + 1)
                              }}
                              className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}

                  {/* Download Button */}
                  <div className="mt-4 flex justify-end">
                    <Button onClick={downloadCSV} className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Download CSV Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </div>
    </SidebarProvider>
  )
}

export default FuelTheft
