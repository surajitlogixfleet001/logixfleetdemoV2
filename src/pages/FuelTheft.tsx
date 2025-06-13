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
import {
  ShieldAlert,
  Download,
  Eye,
  MapPin,
  Fuel,
  Clock,
  AlertTriangle,
  CircleCheck,
  CircleAlert,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/api"

interface FuelEvent {
  id: number
  vehicle: number
  vehicle_name: string
  event_type: string
  event_display: string
  event_icon: string
  timestamp: string
  timestamp_display: string
  previous_level: string
  current_level: string
  change_amount: string
  fuel_change: {
    text: string
    color: string
    details: string
  }
  location_latitude: string
  location_longitude: string
  location: string
  severity: string
  notes: string
  created_at: string
}

interface FuelLevelDataPoint {
  timestamp: string
  displayTime: string
  level: number
  event?: {
    type: string
    display: string
    color: string
    id: number
  }
}

interface ApiResponse {
  fuel_events: FuelEvent[]
  pagination?: {
    current_page: number
    total_pages: number
    total_items: number
    page_size: number
    has_next: boolean
    has_previous: boolean
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

type TimePeriod = "day" | "week" | "month"

const FuelTheft = () => {
  // State
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
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all")
  const [fuelLevelData, setFuelLevelData] = useState<FuelLevelDataPoint[]>([])
  const [chartTimePeriod, setChartTimePeriod] = useState<TimePeriod>("day")
  const itemsPerPage = 10
  const { toast } = useToast()

  // Get unique event types from the data
  const uniqueEventTypes = useMemo(() => {
    const types = [...new Set(events.map((event) => event.event_type))]
    return types.map((type) => {
      const event = events.find((e) => e.event_type === type)
      return {
        value: type,
        display: event?.event_display || type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      }
    })
  }, [events])

  // Get unique vehicles from the data
  const uniqueVehicles = useMemo(() => {
    return [...new Set(events.map((event) => event.vehicle_name))]
  }, [events])

  // Fetch data with pagination
  const fetchFuelEvents = async () => {
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
      const firstResponse = await api.get("/fuel-events/?page=1")
      const firstData: ApiResponse = firstResponse.data

      if (!firstData.fuel_events || !Array.isArray(firstData.fuel_events)) {
        throw new Error("Invalid data format received from API")
      }

      const totalPages = firstData.pagination?.total_pages || 1
      const totalRecords = firstData.pagination?.total_items || firstData.fuel_events.length

      // Show first page data immediately
      setEvents(firstData.fuel_events)
      setFilteredEvents(firstData.fuel_events)

      // Set default selected vehicle if available
      if (firstData.fuel_events.length > 0) {
        setSelectedVehicle((prev) => (prev === "all" ? firstData.fuel_events[0].vehicle_name : prev))
      }

      setLoadingState({
        isLoading: totalPages > 1,
        currentPage: 1,
        totalPages,
        loadedRecords: firstData.fuel_events.length,
        totalRecords,
        progress: totalPages > 1 ? (1 / totalPages) * 100 : 100,
      })

      // If there are more pages, load them progressively
      if (totalPages > 1) {
        const batchSize = 3 // Smaller batches for more frequent updates
        const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2)

        for (let i = 0; i < remainingPages.length; i += batchSize) {
          const batch = remainingPages.slice(i, i + batchSize)

          const batchPromises = batch.map((page) => api.get(`/fuel-events/?page=${page}`).then((res) => res.data))

          const batchResults = await Promise.all(batchPromises)

          // Update data progressively
          setEvents((prevData) => {
            const newData = [...prevData]
            batchResults.forEach((data: ApiResponse) => {
              if (data.fuel_events && Array.isArray(data.fuel_events)) {
                newData.push(...data.fuel_events)
              }
            })
            return newData
          })

          // Update filtered data if no filters are applied
          setFilteredEvents((prevFiltered) => {
            const newFiltered = [...prevFiltered]
            batchResults.forEach((data: ApiResponse) => {
              if (data.fuel_events && Array.isArray(data.fuel_events)) {
                newFiltered.push(...data.fuel_events)
              }
            })
            return newFiltered
          })

          // Update loading state
          const loadedPages = 1 + i + batch.length
          const newLoadedRecords =
            firstData.fuel_events.length + batchResults.reduce((sum, data) => sum + (data.fuel_events?.length || 0), 0)

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
    fetchFuelEvents()
  }, [])

  // Generate fuel level data for the selected vehicle
  useEffect(() => {
    if (selectedVehicle === "all" || !events.length) {
      setFuelLevelData([])
      return
    }

    // Filter events for the selected vehicle
    const vehicleEvents = events.filter((e) => e.vehicle_name === selectedVehicle)

    if (!vehicleEvents.length) {
      setFuelLevelData([])
      return
    }

    // Sort events by timestamp
    const sortedEvents = [...vehicleEvents].sort(
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
      case "month":
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
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
        level: Number.parseFloat(firstEvent.previous_level),
      })
    }

    // Add data points for each event
    filteredByTime.forEach((event) => {
      const eventTimestamp = new Date(event.timestamp)
      const level = Number.parseFloat(event.current_level)

      let eventColor = "gray"
      switch (event.event_type) {
        case "theft":
          eventColor = "red"
          break
        case "rapid_drop":
          eventColor = "orange"
          break
        case "refuel":
          eventColor = "green"
          break
        case "sensor_lost":
          eventColor = "gray"
          break
        case "sensor_restored":
          eventColor = "blue"
          break
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
          display: event.event_display,
          color: eventColor,
          id: event.id,
        },
      })
    })

    // Add a final data point if needed
    if (filteredByTime.length > 0) {
      const lastEvent = filteredByTime[filteredByTime.length - 1]
      const lastTimestamp = new Date(lastEvent.timestamp)
      // Add a data point 24 hours after the last event
      const finalTimestamp = new Date(lastTimestamp.getTime() + 24 * 60 * 60 * 1000)

      // Calculate projected level based on average consumption
      const projectedLevel = Math.max(0, Number.parseFloat(lastEvent.current_level) - 20)

      dataPoints.push({
        timestamp: finalTimestamp.toISOString(),
        displayTime: finalTimestamp.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        level: projectedLevel,
        event:
          projectedLevel <= 50
            ? {
                type: "low_fuel",
                display: "Low Fuel",
                color: "red",
                id: -2,
              }
            : undefined,
      })
    }

    setFuelLevelData(dataPoints)
  }, [selectedVehicle, events, chartTimePeriod])

  // Helper Functions
  const getEventIcon = (iconName: string, type: string) => {
    switch (iconName) {
      case "shield-alert":
        return <ShieldAlert className="h-4 w-4" />
      case "circle-alert":
        return <CircleAlert className="h-4 w-4 text-orange-500" />
      case "circle-check":
        return <CircleCheck className="h-4 w-4 text-green-500" />
      default:
        // Fallback based on event type
        switch (type) {
          case "theft":
            return <ShieldAlert className="h-4 w-4" />
          case "rapid_drop":
            return <AlertTriangle className="h-4 w-4" />
          case "refuel":
            return <Fuel className="h-4 w-4" />
          case "sensor_lost":
            return <AlertTriangle className="h-4 w-4 text-orange-500" />
          case "sensor_restored":
            return <Clock className="h-4 w-4 text-green-500" />
          default:
            return <Clock className="h-4 w-4" />
        }
    }
  }

  const getSeverityBadge = (severity: string) => {
    const variants = { HIGH: "destructive", MEDIUM: "secondary", LOW: "outline" }
    return variants[severity as keyof typeof variants] || "outline"
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
                    <span className="font-medium">Previous Level:</span> {eventDetails.previous_level}L
                  </div>
                  <div>
                    <span className="font-medium">Change:</span> {eventDetails.change_amount}L
                  </div>
                  {eventDetails.notes && (
                    <div>
                      <span className="font-medium">Note:</span> {eventDetails.notes}
                    </div>
                  )}
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
      case "rapid_drop":
        return "#f97316" // orange
      case "refuel":
        return "#22c55e" // green
      case "sensor_lost":
        return "#6b7280" // gray
      case "sensor_restored":
        return "#3b82f6" // blue
      case "low_fuel":
        return "#ef4444" // red
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

    // Severity filter
    if (severityFilter !== "all") filtered = filtered.filter((e) => e.severity === severityFilter)

    setFilteredEvents(filtered)
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setStartDate("")
    setEndDate("")
    setEventTypeFilter("all")
    setSeverityFilter("all")
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
      "Severity",
      "Notes",
    ]
    const rows = filteredEvents.map((e) =>
      [
        e.id,
        `"${e.vehicle_name}"`,
        `"${e.event_display}"`,
        e.timestamp,
        e.previous_level,
        e.current_level,
        e.change_amount,
        e.location_latitude,
        e.location_longitude,
        e.severity,
        `"${e.notes}"`,
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
  const rapidDropCount = filteredEvents.filter((e) => e.event_type === "rapid_drop").length
  const highSeverityCount = filteredEvents.filter((e) => e.severity === "HIGH").length

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

          {error ? (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="text-center text-destructive">
                  <AlertTriangle className="h-10 w-10 mx-auto mb-2" />
                  <p>{error}</p>
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
                    <CardTitle className="text-sm font-medium">Theft Alerts</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-destructive">{theftCount}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Rapid Drops</CardTitle>
                    <Fuel className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-500">{rapidDropCount}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">High Severity</CardTitle>
                    <ShieldAlert className="h-4 w-4 text-destructive" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-destructive">{highSeverityCount}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Fuel Level Chart */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>
                    Fuel Level Timeline
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      (
                      {chartTimePeriod === "day"
                        ? "Last 24 hours"
                        : chartTimePeriod === "week"
                          ? "Last 7 days"
                          : "Last 30 days"}
                      )
                    </span>
                    {loadingState.isLoading && (
                      <span className="text-xs text-orange-600 ml-2">(Updating as data loads...)</span>
                    )}
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
                      <Label htmlFor="vehicle-select">Vehicle:</Label>
                      <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Select vehicle" />
                        </SelectTrigger>
                        <SelectContent>
                          {uniqueVehicles.map((vehicle) => (
                            <SelectItem key={vehicle} value={vehicle}>
                              {vehicle}
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

                          {/* Tank capacity reference line */}
                          <ReferenceLine
                            y={300}
                            stroke="#dc2626"
                            strokeDasharray="5 5"
                            label={{
                              value: "Tank Capacity (300L)",
                              position: "right",
                              fill: "#dc2626",
                              fontWeight: "bold",
                              fontSize: 12,
                            }}
                          />

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
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span className="text-sm">Rapid Drop</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-sm">Refuel</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                      <span className="text-sm">Sensor Lost</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm">Sensor Restored</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                      <Label htmlFor="event-type">Event Type</Label>
                      <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Events" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Events</SelectItem>
                          {uniqueEventTypes.map((eventType) => (
                            <SelectItem key={eventType.value} value={eventType.value}>
                              {eventType.display}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="severity">Severity</Label>
                      <Select value={severityFilter} onValueChange={setSeverityFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Severities" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Severities</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="LOW">Low</SelectItem>
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
                          <TableHead>Severity</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentEvents.map((event) => (
                          <TableRow key={event.id} className="hover:bg-muted/50">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getEventIcon(event.event_icon, event.event_type)}
                                <span className="font-medium">{event.event_display}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{event.vehicle_name}</TableCell>
                            <TableCell className="font-mono text-xs">{event.timestamp_display}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span
                                  className={`font-semibold ${
                                    event.fuel_change.color === "red" ? "text-destructive" : "text-green-600"
                                  }`}
                                >
                                  {event.fuel_change.text}
                                </span>
                                <span className="text-xs text-muted-foreground">{event.fuel_change.details}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {event.location}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getSeverityBadge(event.severity) as any}>{event.severity}</Badge>
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
                                      {getEventIcon(event.event_icon, event.event_type)}
                                      Event Details - {event.event_display}
                                    </DialogTitle>
                                  </DialogHeader>
                                  {selectedEvent && (
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label className="text-sm font-medium">Vehicle</Label>
                                          <p className="text-sm">{selectedEvent.vehicle_name}</p>
                                        </div>
                                        <div>
                                          <Label className="text-sm font-medium">Timestamp</Label>
                                          <p className="text-sm font-mono">{selectedEvent.timestamp_display}</p>
                                        </div>
                                        <div>
                                          <Label className="text-sm font-medium">Previous Level</Label>
                                          <p className="text-sm">{selectedEvent.previous_level}L</p>
                                        </div>
                                        <div>
                                          <Label className="text-sm font-medium">Current Level</Label>
                                          <p className="text-sm">{selectedEvent.current_level}L</p>
                                        </div>
                                        <div>
                                          <Label className="text-sm font-medium">Change Amount</Label>
                                          <p
                                            className={`text-sm font-semibold ${
                                              selectedEvent.fuel_change.color === "red"
                                                ? "text-destructive"
                                                : "text-green-600"
                                            }`}
                                          >
                                            {selectedEvent.fuel_change.text}
                                          </p>
                                        </div>
                                        <div>
                                          <Label className="text-sm font-medium">Severity</Label>
                                          <Badge variant={getSeverityBadge(selectedEvent.severity) as any}>
                                            {selectedEvent.severity}
                                          </Badge>
                                        </div>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Location</Label>
                                        <p className="text-sm font-mono">{selectedEvent.location}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Notes</Label>
                                        <p className="text-sm">{selectedEvent.notes || "No notes available"}</p>
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
