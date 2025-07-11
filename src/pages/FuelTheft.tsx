"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
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
import { useCachedApi } from "@/hooks/use-cached-api"

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
  isMockup?: boolean // Add this flag to identify mockup vs real data
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

// Static demo data for when no real data is available
const demoFuelEvents: FuelEvent[] = [
  {
    id: "demo_001",
    event_type: "fill",
    vehicle: { license_plate: "KDA381X", name: "KDA381X" },
    timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(), // 23 hours ago
    location: { latitude: 40.7128, longitude: -74.006 },
    fuel_change: { amount_liters: 45.5, before_liters: 15.2, after_liters: 60.7 },
    vehicle_state: { speed: 0, ignition: false, stationary: true },
  },

  {
    id: "demo_002",
    event_type: "theft",
    vehicle: { license_plate: "KDE386N", name: "KDE386N" },
    timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(), // 18 hours ago
    location: { latitude: 40.7589, longitude: -73.9851 },
    fuel_change: { amount_liters: -8.7, before_liters: 55.4, after_liters: 46.7 },
    vehicle_state: { speed: 0, ignition: false, stationary: true },
  },
  {
    id: "demo_003",
    event_type: "theft",
    vehicle: { license_plate: "KDE366F", name: "KDE366F" },
    timestamp: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(), // 15 hours ago
    location: { latitude: 40.6892, longitude: -74.0445 },
    fuel_change: { amount_liters: 15.2, before_liters: 45.3, after_liters: 30.1 },
    vehicle_state: { speed: 0, ignition: false, stationary: true },
  },
  {
    id: "demo_004",
    event_type: "theft",
    vehicle: { license_plate: "KDA381X", name: "KDA381X" },
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    location: { latitude: 40.7505, longitude: -73.9934 },
    fuel_change: { amount_liters: -18.5, before_liters: 52.2, after_liters: 33.7 },
    vehicle_state: { speed: 0, ignition: false, stationary: true },
  },
  {
    id: "demo_005",
    event_type: "fill",
    vehicle: { license_plate: "KDE366F", name: "KDE366F" },
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
    location: { latitude: 40.7282, longitude: -73.7949 },
    fuel_change: { amount_liters: 38.2, before_liters: 22.1, after_liters: 60.3 },
    vehicle_state: { speed: 0, ignition: false, stationary: true },
  },
  {
    id: "demo_006",
    event_type: "theft",
    vehicle: { license_plate: "KDE386N", name: "KDE386N" },
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    location: { latitude: 40.7831, longitude: -73.9712 },
    fuel_change: { amount_liters: -22.1, before_liters: 68.3, after_liters: 46.2 },
    vehicle_state: { speed: 0, ignition: false, stationary: true },
  },
  {
    id: "demo_007",
    event_type: "fill",
    vehicle: { license_plate: "KDE366F", name: "KDE366F" },
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    location: { latitude: 40.7614, longitude: -73.9776 },
    fuel_change: { amount_liters: 35.8, before_liters: 20.1, after_liters: 55.9 },
    vehicle_state: { speed: 0, ignition: false, stationary: true },
  },
  {
    id: "demo_008",
    event_type: "theft",
    vehicle: { license_plate: "KDA381X", name: "KDA381X" },
    timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(), // 23 hours ago
    location: { latitude: 40.7128, longitude: -74.006 },
    fuel_change: { amount_liters: 12.3, before_liters: 48.5, after_liters: 36.2 },
    vehicle_state: { speed: 0, ignition: false, stationary: true },
  },
  {
    id: "demo_009",
    event_type: "fill",
    vehicle: { license_plate: "KDA381X", name: "KDA381X" },
    timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(), // 23 hours ago
    location: { latitude: 40.7128, longitude: -74.006 },
    fuel_change: { amount_liters: 42.8, before_liters: 18.9, after_liters: 61.7 },
    vehicle_state: { speed: 0, ignition: false, stationary: true },
  },
  {
    id: "demo_010",
    event_type: "fill",
    vehicle: { license_plate: "KDE386N", name: "KDE386N" },
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    location: { latitude: 40.7831, longitude: -73.9712 },
    fuel_change: { amount_liters: 50.3, before_liters: 25.4, after_liters: 75.7 },
    vehicle_state: { speed: 0, ignition: false, stationary: true },
  },
]

const demoVehicles: Vehicle[] = [
  {
    id: 1,
    name: "Fleet Truck 001",
    imei: "123456789012345",
    type: "truck",
    license_plate: "KDA381X",
    fuel_capacity: "300",
    is_active: true,
    driver_name: "John Doe",
    driver_phone: "+1234567890",
    notes: "Demo vehicle",
  },
  {
    id: 2,
    name: "Fleet Van 002",
    imei: "123456789012346",
    type: "van",
    license_plate: "KDE386N",
    fuel_capacity: "200",
    is_active: true,
    driver_name: "Jane Smith",
    driver_phone: "+1234567891",
    notes: "Demo vehicle",
  },
  {
    id: 3,
    name: "Fleet Truck 003",
    imei: "123456789012347",
    type: "truck",
    license_plate: "KDE366F",
    fuel_capacity: "300",
    is_active: true,
    driver_name: "Bob Johnson",
    driver_phone: "+1234567892",
    notes: "Demo vehicle",
  },
  {
    id: 4,
    name: "Fleet Car 004",
    imei: "123456789012348",
    type: "car",
    license_plate: "JKL-012",
    fuel_capacity: "180",
    is_active: true,
    driver_name: "Alice Brown",
    driver_phone: "+1234567893",
    notes: "Demo vehicle",
  },
  {
    id: 5,
    name: "Fleet Truck 005",
    imei: "123456789012349",
    type: "truck",
    license_plate: "MNO-345",
    fuel_capacity: "300",
    is_active: true,
    driver_name: "Charlie Wilson",
    driver_phone: "+1234567894",
    notes: "Demo vehicle",
  },
]

// Enhanced function to generate realistic mockup fuel data for gaps in real data
const generateMockupFuelData = (timePeriod: TimePeriod, vehiclePlate?: string): FuelLevelDataPoint[] => {
  const now = new Date()
  const hoursBack = timePeriod === "day" ? 24 : 168 // 24 hours or 7 days
  const intervalHours = timePeriod === "day" ? 1 : 4 // Every hour for day, every 4 hours for week

  const dataPoints: FuelLevelDataPoint[] = []
  let currentLevel = 180 // Start with a reasonable fuel level

  // Generate data points going backwards in time
  for (let i = hoursBack; i >= 0; i -= intervalHours) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000)

    // Simulate natural fuel consumption (1-3 liters per hour when driving)
    const consumption = Math.random() * 2 + 0.5 // 0.5-2.5L per interval
    currentLevel = Math.max(20, currentLevel - consumption)

    // Add some random events
    const shouldAddEvent = Math.random() < 0.15 // 15% chance of event
    let eventData = undefined

    if (shouldAddEvent && i > 2) {
      // Don't add events too close to current time
      const eventType = Math.random() < 0.3 ? "theft" : "fill" // 30% theft, 70% fill

      if (eventType === "theft" && currentLevel > 50) {
        // Theft event - remove 20-50L
        const stolenAmount = Math.random() * 30 + 20
        const beforeLevel = currentLevel
        currentLevel = Math.max(10, currentLevel - stolenAmount)

        eventData = {
          type: "theft",
          display: "Theft",
          color: "red",
          id: `mockup_theft_${i}`,
        }
      } else if (eventType === "fill" && currentLevel < 200) {
        // Fill event - add fuel to near capacity
        const beforeLevel = currentLevel
        currentLevel = Math.min(250, currentLevel + Math.random() * 100 + 100)

        eventData = {
          type: "fill",
          display: "Refuel",
          color: "green",
          id: `mockup_fill_${i}`,
        }
      }
    }

    dataPoints.push({
      timestamp: timestamp.toISOString(),
      displayTime: timestamp.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      level: Math.round(currentLevel * 10) / 10, // Round to 1 decimal
      event: eventData,
      isMockup: true, // Mark as mockup data
    })
  }

  // Reverse to get chronological order
  return dataPoints.reverse()
}

// Enhanced function to fill data gaps with mockup data
const fillDataGapsWithMockup = (
  realData: FuelLevelDataPoint[],
  timePeriod: TimePeriod,
  vehiclePlate?: string,
): FuelLevelDataPoint[] => {
  if (!realData.length) {
    // No real data at all, return full mockup
    return generateMockupFuelData(timePeriod, vehiclePlate)
  }

  const now = new Date()
  const hoursBack = timePeriod === "day" ? 24 : 168
  const startTime = new Date(now.getTime() - hoursBack * 60 * 60 * 1000)
  const intervalHours = timePeriod === "day" ? 1 : 4

  // Sort real data by timestamp
  const sortedRealData = [...realData].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  const combinedData: FuelLevelDataPoint[] = []
  let lastRealLevel = 150 // Default starting level
  let currentMockupLevel = 150

  // Generate time slots for the entire period
  for (let i = 0; i <= hoursBack; i += intervalHours) {
    const currentTime = new Date(startTime.getTime() + i * 60 * 60 * 1000)
    const currentTimeStr = currentTime.toISOString()

    // Check if we have real data for this time slot (within 30 minutes)
    const realDataPoint = sortedRealData.find((point) => {
      const pointTime = new Date(point.timestamp)
      const timeDiff = Math.abs(pointTime.getTime() - currentTime.getTime())
      return timeDiff <= 30 * 60 * 1000 // Within 30 minutes
    })

    if (realDataPoint) {
      // Use real data
      combinedData.push({
        ...realDataPoint,
        isMockup: false,
      })
      lastRealLevel = realDataPoint.level
      currentMockupLevel = realDataPoint.level
    } else {
      // Generate mockup data for this gap
      // Simulate natural consumption
      const consumption = Math.random() * 2 + 0.5
      currentMockupLevel = Math.max(20, currentMockupLevel - consumption)

      // Occasionally add events to make it interesting
      const shouldAddEvent = Math.random() < 0.1 // 10% chance
      let eventData = undefined

      if (shouldAddEvent) {
        const eventType = Math.random() < 0.3 ? "theft" : "fill"

        if (eventType === "theft" && currentMockupLevel > 50) {
          const stolenAmount = Math.random() * 30 + 20
          currentMockupLevel = Math.max(10, currentMockupLevel - stolenAmount)
          eventData = {
            type: "theft",
            display: "Theft",
            color: "red",
            id: `gap_theft_${i}`,
          }
        } else if (eventType === "fill" && currentMockupLevel < 200) {
          currentMockupLevel = Math.min(250, currentMockupLevel + Math.random() * 100 + 100)
          eventData = {
            type: "fill",
            display: "Refuel",
            color: "green",
            id: `gap_fill_${i}`,
          }
        }
      }

      combinedData.push({
        timestamp: currentTimeStr,
        displayTime: currentTime.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        level: Math.round(currentMockupLevel * 10) / 10,
        event: eventData,
        isMockup: true,
      })
    }
  }

  return combinedData
}

// Check if data has significant gaps or is mostly zeros
const hasSignificantDataGaps = (events: FuelEvent[], timePeriod: TimePeriod): boolean => {
  if (!events || events.length === 0) return true

  const now = new Date()
  const hoursBack = timePeriod === "day" ? 24 : 168
  const startTime = new Date(now.getTime() - hoursBack * 60 * 60 * 1000)

  // Filter events within the time period
  const recentEvents = events.filter((e) => new Date(e.timestamp) >= startTime)

  // Check if we have very few data points or mostly zeros
  const hasVeryFewPoints = recentEvents.length < 3
  const mostlyZeros =
    recentEvents.filter((e) => e.fuel_change.before_liters <= 0.1 && e.fuel_change.after_liters <= 0.1).length >
    recentEvents.length * 0.8

  console.log("🔍 Data gap analysis:", {
    totalEvents: events.length,
    recentEvents: recentEvents.length,
    hasVeryFewPoints,
    mostlyZeros,
    timePeriod,
  })

  return hasVeryFewPoints || mostlyZeros
}

interface ApiError {
  message?: string
  response?: {
    data?: unknown
    status?: number
  }
}

const FuelTheft = () => {
  // State
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [allEvents, setAllEvents] = useState<FuelEvent[]>([]) // All events for chart
  const [tableEvents, setTableEvents] = useState<FuelEvent[]>([]) // Current page events for table
  const [filteredEvents, setFilteredEvents] = useState<FuelEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<FuelEvent | null>(null)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [eventTypeFilter, setEventTypeFilter] = useState("all") // default to "all"
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState("all")
  const [minFillLiters, setMinFillLiters] = useState("")
  const [minTheftLiters, setMinTheftLiters] = useState("")
  const [maxSpeed, setMaxSpeed] = useState("")
  const [ignitionFilter, setIgnitionFilter] = useState("all")
  const [loading, setLoading] = useState(false)
  const [tableLoading, setTableLoading] = useState(false)
  const [chartLoading, setChartLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fuelLevelData, setFuelLevelData] = useState<FuelLevelDataPoint[]>([])
  const [chartTimePeriod, setChartTimePeriod] = useState<TimePeriod>("day")
  const [isUsingDemoData, setIsUsingDemoData] = useState(false)
  const [isUsingMockupChart, setIsUsingMockupChart] = useState(false)
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
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [reportPeriod, setReportPeriod] = useState<"daily" | "weekly" | "monthly">("daily")

  const { cachedApi, clearCache } = useCachedApi()

  // Get unique vehicles from the data
  const uniqueVehicles = useMemo(() => {
    return vehicles.map((v) => ({
      license_plate: v.license_plate,
      name: v.name,
    }))
  }, [vehicles])

  // Load demo data
  const loadDemoData = useCallback(() => {
    setVehicles(demoVehicles)
    setAllEvents(demoFuelEvents)
    setTableEvents(demoFuelEvents)
    setFilteredEvents(demoFuelEvents)
    setIsUsingDemoData(true)
    setIsUsingMockupChart(false)
    setPaginationState({
      currentPage: 1,
      totalPages: 1,
      totalItems: demoFuelEvents.length,
      pageSize: 50,
      hasNext: false,
      hasPrevious: false,
    })
  }, [])

  // Check if fuel data is all zeros or empty
  const isDataAllZeros = useCallback((events: FuelEvent[]): boolean => {
    if (!events || events.length === 0) return true

    // Check if all fuel levels are zero or very close to zero
    const allZeros = events.every(
      (event) => event.fuel_change.before_liters <= 0.1 && event.fuel_change.after_liters <= 0.1,
    )

    console.log("🔍 Checking if data is all zeros:", {
      eventsCount: events.length,
      allZeros,
      sampleEvent: events[0]
        ? {
            before: events[0].fuel_change.before_liters,
            after: events[0].fuel_change.after_liters,
          }
        : null,
    })

    return allZeros
  }, [])

  // Fetch vehicles
  const fetchVehicles = useCallback(async () => {
    try {
      console.log("🚗 Fetching vehicles...")
      const vehiclesData = await cachedApi("/vehicles/", { ttl: 10 * 60 * 1000 }) // 10 minutes
      console.log("🚗 Vehicles response:", vehiclesData)
      const vehicles = vehiclesData.fleet_overview || []
      setVehicles(vehicles)
      console.log("🚗 Vehicles set:", vehicles.length, "vehicles")
      return vehicles
    } catch (err: unknown) {
      console.error("❌ Error fetching vehicles:", err)
      setError("Failed to fetch vehicles data")
      return []
    }
  }, [cachedApi])

  // Fetch all events for chart (company-wide or vehicle-specific)
  const fetchAllEventsForChart = useCallback(async () => {
    try {
      setChartLoading(true)
      console.log("📊 Fetching chart data for vehicle filter:", selectedVehicleFilter)

      let url = "/fuel-events/"
      const params = new URLSearchParams()

      if (selectedVehicleFilter && selectedVehicleFilter !== "all") {
        params.append("license_plate", selectedVehicleFilter)
      }

      if (params.toString()) {
        url += "?" + params.toString()
      }

      console.log("📊 Chart API URL:", url)

      // Use cached API with 5 minute TTL for fuel events
      const response = await cachedApi(url, { ttl: 5 * 60 * 1000 })
      console.log("📊 Chart API response:", response)

      let eventsData: FuelEvent[] = []

      if (response.events && Array.isArray(response.events)) {
        eventsData = response.events
      } else if (Array.isArray(response)) {
        eventsData = response
      } else {
        console.warn("📊 Unexpected chart data format:", response)
        eventsData = []
      }

      console.log("📊 Chart events loaded:", eventsData.length)
      setAllEvents(eventsData)
      setError(null)
      setIsUsingDemoData(false)

      if (eventsData.length > 0 && !isDataAllZeros(eventsData)) {
        setIsUsingMockupChart(false)
      } else if (eventsData.length > 0 && isDataAllZeros(eventsData)) {
        setIsUsingMockupChart(true)
      }

      return eventsData
    } catch (err: unknown) {
      console.error("❌ Error fetching chart events:", err)
      if (err instanceof Error) {
        setError(err.message || "Failed to fetch fuel events data")
      } else {
        setError("Failed to fetch fuel events data")
      }

      loadDemoData()
      return []
    } finally {
      setChartLoading(false)
    }
  }, [selectedVehicleFilter, toast, isDataAllZeros, loadDemoData, cachedApi])

  // Fetch table data with pagination (company-wide or vehicle-specific)
  const fetchTableData = useCallback(async (page: number): Promise<FuelEvent[]> => {
    // For now, return empty array since the function is commented out
    return []
    // Uncomment and implement the actual logic when needed
  }, [])

  const handleManualRefresh = () => {
    clearCache() // Clear all cache
    fetchAllEventsForChart() // Fetch fresh data
    fetchVehicles() // Refresh vehicles too
  }

  // Initial data fetch - ALWAYS load company-wide data first
  useEffect(() => {
    console.log("🚀 LOADING MOCKUP DATA FIRST...")
    loadDemoData() // Show mockup data immediately

    // Then load real data in the background
    const loadRealData = async () => {
      try {
        console.log("🔄 Loading real data in background...")
        const vehiclesData = await fetchVehicles()
        const chartData = await fetchAllEventsForChart()
        const tableData = await fetchTableData(1)

        // Only replace mockup if we got real data
        if (chartData.length > 0 || tableData.length > 0) {
          setIsUsingDemoData(false)
        }
      } catch (error) {
        console.error("Failed to load real data, keeping mockup:", error)
      } finally {
        setLoading(false)
      }
    }

    loadRealData()
  }, [fetchAllEventsForChart, fetchTableData, fetchVehicles, loadDemoData])

  // Handle URL parameters for filtering and scrolling
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const filterParam = urlParams.get("filter")
    const vehicleParam = urlParams.get("vehicle")
    const scrollToParam = urlParams.get("scrollTo")

    console.log("🔗 URL Parameters detected:", { filterParam, vehicleParam, scrollToParam })

    // Apply vehicle filter if specified
    if (vehicleParam && vehicleParam !== "all") {
      setSelectedVehicleFilter(vehicleParam)
      console.log("🚗 Applied vehicle filter from URL:", vehicleParam)
    }

    // Apply event type filter if specified
    if (filterParam === "fill") {
      setEventTypeFilter("fill")
      console.log("⛽ Applied fill filter from URL")
    } else if (filterParam === "theft") {
      setEventTypeFilter("theft")
      console.log("🚨 Applied theft filter from URL")
    }

    // Scroll to section if specified
    if (scrollToParam === "table") {
      // Wait for component to render then scroll
      setTimeout(() => {
        const tableElement = document.querySelector("[data-table-section]")
        if (tableElement) {
          tableElement.scrollIntoView({ behavior: "smooth", block: "start" })
          console.log("📜 Scrolled to table section")
        }
      }, 1000)
    }

    // Show toast notification about applied filters
    if (filterParam || vehicleParam) {
      setTimeout(() => {
        const appliedFilters = []
        if (vehicleParam && vehicleParam !== "all") appliedFilters.push(`Vehicle: ${vehicleParam}`)
        if (filterParam && filterParam !== "all") appliedFilters.push(`Event: ${filterParam}`)

        if (appliedFilters.length > 0) {
          toast({
            title: "Filters Applied from Navigation",
            description: `Applied filters: ${appliedFilters.join(", ")}`,
            duration: 3000,
          })
        }
      }, 1500)
    }
  }, [toast])

  // When vehicle filter changes, reload data
  useEffect(() => {
    // Only reload if not from URL parameters and not using demo data
    const urlParams = new URLSearchParams(window.location.search)
    const vehicleParam = urlParams.get("vehicle")

    if (!loading && vehicles.length > 0 && !isUsingDemoData && selectedVehicleFilter !== vehicleParam) {
      console.log("🔄 Vehicle filter changed to:", selectedVehicleFilter)
      fetchAllEventsForChart()
      fetchTableData(1) // Reset to page 1 when vehicle changes
    }
  }, [selectedVehicleFilter, loading, vehicles.length, isUsingDemoData, fetchAllEventsForChart, fetchTableData])

  // Enhanced filter function with all filter options
  const handleFilter = useCallback(() => {
    let filtered = tableEvents

    // Date filter
    if (startDate) {
      const startDateTime = new Date(startDate)
      filtered = filtered.filter((e) => new Date(e.timestamp) >= startDateTime)
    }
    if (endDate) {
      const endDateTime = new Date(endDate)
      filtered = filtered.filter((e) => new Date(e.timestamp) <= endDateTime)
    }

    // Event type filter
    if (eventTypeFilter !== "all") {
      filtered = filtered.filter((e) => e.event_type === eventTypeFilter)
    }

    // Vehicle filter (already handled at data fetch level, but can be applied here too)
    if (selectedVehicleFilter !== "all") {
      filtered = filtered.filter((e) => e.vehicle.license_plate === selectedVehicleFilter)
    }

    // Minimum fill liters filter
    if (minFillLiters && !isNaN(Number.parseFloat(minFillLiters))) {
      const minFill = Number.parseFloat(minFillLiters)
      filtered = filtered.filter((e) => {
        if (e.event_type === "fill") {
          return e.fuel_change.amount_liters >= minFill
        }
        return true // Keep non-fill events
      })
    }

    // Minimum theft liters filter
    if (minTheftLiters && !isNaN(Number.parseFloat(minTheftLiters))) {
      const minTheft = Number.parseFloat(minTheftLiters)
      filtered = filtered.filter((e) => {
        if (e.event_type === "theft") {
          return Math.abs(e.fuel_change.amount_liters) >= minTheft
        }
        return true // Keep non-theft events
      })
    }

    // Maximum speed filter
    if (maxSpeed && !isNaN(Number.parseFloat(maxSpeed))) {
      const maxSpeedValue = Number.parseFloat(maxSpeed)
      filtered = filtered.filter((e) => e.vehicle_state.speed <= maxSpeedValue)
    }

    // Ignition filter
    if (ignitionFilter !== "all") {
      const ignitionOn = ignitionFilter === "on"
      filtered = filtered.filter((e) => e.vehicle_state.ignition === ignitionOn)
    }

    // Report period filter (group by period)
    if (reportPeriod !== "daily") {
      // This could be used to group results by week/month
      // For now, we'll just apply the filter as-is
      // You could implement grouping logic here if needed
    }

    console.log("🔍 Applied filters:", {
      original: tableEvents.length,
      filtered: filtered.length,
      filters: {
        startDate,
        endDate,
        eventTypeFilter,
        selectedVehicleFilter,
        minFillLiters,
        minTheftLiters,
        maxSpeed,
        ignitionFilter,
        reportPeriod,
      },
    })

    setFilteredEvents(filtered)

    // Update select all state
    setSelectAll(false)
    setSelectedRecords(new Set())

  }, [
    tableEvents,
    startDate,
    endDate,
    eventTypeFilter,
    selectedVehicleFilter,
    minFillLiters,
    minTheftLiters,
    maxSpeed,
    ignitionFilter,
    reportPeriod,
    toast,
  ])

  // Auto-apply filters when eventTypeFilter changes
  useEffect(() => {
    handleFilter()
  }, [handleFilter])

  // Generate fuel level data for the selected vehicle filter
  useEffect(() => {
    console.log("📈 Generating fuel level data from", allEvents.length, "events")

    if (!allEvents.length) {
      // No events at all, generate full mockup
      const mockupData = generateMockupFuelData(
        chartTimePeriod,
        selectedVehicleFilter !== "all" ? selectedVehicleFilter : undefined,
      )
      setFuelLevelData(mockupData)
      setIsUsingMockupChart(true)
      return
    }

    // Filter events by selected vehicle if not "all"
    let eventsToProcess = allEvents
    if (selectedVehicleFilter !== "all") {
      eventsToProcess = allEvents.filter((e) => e.vehicle.license_plate === selectedVehicleFilter)
      console.log("📈 Filtered to", eventsToProcess.length, "events for vehicle", selectedVehicleFilter)
    }

    // Check if we have significant data gaps or mostly zero data
    const hasGaps = hasSignificantDataGaps(eventsToProcess, chartTimePeriod)

    if (hasGaps) {
      console.log("🎭 Detected data gaps - using hybrid real + mockup data")

      // Convert real events to data points first
      const realDataPoints: FuelLevelDataPoint[] = []

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
      console.log("📈 Time filtered to", filteredByTime.length, "real events")

      // Convert real events to data points
      filteredByTime.forEach((event) => {
        const eventTimestamp = new Date(event.timestamp)
        const level = event.fuel_change.after_liters

        // Skip zero or very low levels from real data
        if (level > 0.1) {
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

          realDataPoints.push({
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
            isMockup: false,
          })
        }
      })

      // Fill gaps with mockup data
      const hybridData = fillDataGapsWithMockup(
        realDataPoints,
        chartTimePeriod,
        selectedVehicleFilter !== "all" ? selectedVehicleFilter : undefined,
      )
      setFuelLevelData(hybridData)
      setIsUsingMockupChart(true)


      return
    }

    // We have good real data, use it normally
    setIsUsingMockupChart(false)

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
        isMockup: false,
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
        isMockup: false,
      })
    })

    console.log("📈 Generated", dataPoints.length, "chart data points")
    setFuelLevelData(dataPoints)
  }, [allEvents, selectedVehicleFilter, chartTimePeriod, toast])

  interface TooltipProps {
    active?: boolean
    payload?: Array<{
      payload: FuelLevelDataPoint
      value: number
    }>
  }

  // Checkbox selection functions
  const handleSelectRecord = (recordId: string) => {
    const newSelected = new Set(selectedRecords)
    if (newSelected.has(recordId)) {
      newSelected.delete(recordId)
    } else {
      newSelected.add(recordId)
    }
    setSelectedRecords(newSelected)
    setSelectAll(newSelected.size === filteredEvents.length && filteredEvents.length > 0)
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRecords(new Set())
      setSelectAll(false)
    } else {
      const allIds = new Set(filteredEvents.map((event) => event.id))
      setSelectedRecords(allIds)
      setSelectAll(true)
    }
  }

  // Download selected records
  const downloadSelectedCSV = () => {
    const selectedEvents = filteredEvents.filter((e) => selectedRecords.has(e.id))
    if (selectedEvents.length === 0) {
      toast({
        title: "No Records Selected",
        description: "Please select records to download.",
        variant: "destructive",
      })
      return
    }

    const headers = ["Event", "Vehicle", "Date and Time", "Fuel Change", "Location", "Vehicle State"]
    const data = selectedEvents.map((e) => ({
      Event: e.event_type.charAt(0).toUpperCase() + e.event_type.slice(1),
      Vehicle: e.vehicle.license_plate,
      "Date and Time": new Date(e.timestamp).toLocaleString(),
      "Fuel Change": `${e.event_type === "theft" ? "-" : "+"}${Math.abs(e.fuel_change.amount_liters)}L`,
      Location: `${e.location.latitude.toFixed(4)}, ${e.location.longitude.toFixed(4)}`,
      "Vehicle State": `${e.vehicle_state.ignition ? "ON" : "OFF"}, ${e.vehicle_state.speed} km/h`,
    }))

    if (data.length === 0) {
      toast({
        title: "No Data",
        description: "No fuel events available for download.",
        variant: "destructive",
      })
      return
    }

    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header as keyof typeof row]
            return typeof value === "string" && value.includes(",") ? `"${value}"` : value
          })
          .join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `selected-fuel-events-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Download Complete",
      description: `Downloaded ${data.length} records.`,
    })
  }

  // Download all records (rename existing function)
  const downloadAllCSV = () => {
    const headers = ["Event", "Vehicle", "Date and Time", "Fuel Change", "Location", "Vehicle State"]
    const data = filteredEvents.map((e) => ({
      Event: e.event_type.charAt(0).toUpperCase() + e.event_type.slice(1),
      Vehicle: e.vehicle.license_plate,
      "Date and Time": new Date(e.timestamp).toLocaleString(),
      "Fuel Change": `${e.event_type === "theft" ? "-" : "+"}${Math.abs(e.fuel_change.amount_liters)}L`,
      Location: `${e.location.latitude.toFixed(4)}, ${e.location.longitude.toFixed(4)}`,
      "Vehicle State": `${e.vehicle_state.ignition ? "ON" : "OFF"}, ${e.vehicle_state.speed} km/h`,
    }))

    if (data.length === 0) {
      toast({
        title: "No Data",
        description: "No fuel events available for download.",
        variant: "destructive",
      })
      return
    }

    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header as keyof typeof row]
            return typeof value === "string" && value.includes(",") ? `"${value}"` : value
          })
          .join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `all-fuel-events-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Download Complete",
      description: `Downloaded ${data.length} records.`,
    })
  }

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

  interface DotProps {
    cx?: number
    cy?: number
    payload?: FuelLevelDataPoint
  }

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload }: TooltipProps) => {
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
              {data.isMockup && <span className="text-xs text-blue-600">(Simulated)</span>}
            </div>

            <div className="space-y-1 text-sm">
              <div>
                <span className="font-medium">Vehicle:</span>{" "}
                {eventDetails?.vehicle.license_plate || selectedVehicleFilter}
              </div>
              <div>
                <span className="font-medium">Time:</span> {data.displayTime}
              </div>
              <div>
                <span className="font-medium">Fuel Level:</span> {data.level}L
              </div>

              {eventDetails && !data.isMockup && (
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
              {data.isMockup && <span className="text-xs text-blue-600 block">(Simulated Data)</span>}
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
  const CustomizedDot = (props: DotProps) => {
    const { cx, cy, payload } = props

    if (!payload.event) {
      return null
    }

    return <circle cx={cx} cy={cy} r={8} stroke={getEventColor(payload.event.type)} strokeWidth={3} fill="white" />
  }

  const clearFilters = () => {
    setStartDate("")
    setEndDate("")
    setEventTypeFilter("all")
    setSelectedVehicleFilter("all")
    setMinFillLiters("")
    setMinTheftLiters("")
    setMaxSpeed("")
    setIgnitionFilter("all")
    setReportPeriod("daily")
    setFilteredEvents(tableEvents)
    setSelectAll(false)
    setSelectedRecords(new Set())

    toast({
      title: "Filters Cleared",
      description: "All filters have been reset",
    })
  }

  // Calculate theft and fill event counts
  const theftCount = filteredEvents.filter((e) => e.event_type === "theft").length
  const fillCount = filteredEvents.filter((e) => e.event_type === "fill").length

  // Show loading screen
  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <main className="flex-1 p-4 sm:p-6 flex items-center justify-center">
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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
                <ShieldAlert className="h-6 w-6 sm:h-8 sm:w-8 text-destructive" />
                Fuel Analysis Detection
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Monitor and detect suspicious fuel activities across your fleet
              </p>
            </div>
          </div>

          {error && !isUsingDemoData && (
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                <ShieldAlert className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{filteredEvents.length}</div>
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
                <div className="text-xl sm:text-2xl font-bold text-destructive">{theftCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fill Events</CardTitle>
                <Fuel className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-green-500">{fillCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Page</CardTitle>
                <ShieldAlert className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-xl font-bold text-primary">
                  {paginationState.currentPage} of {paginationState.totalPages}
                </div>
                <p className="text-xs text-muted-foreground">Page size: {paginationState.pageSize}</p>
              </CardContent>
            </Card>
          </div>

          {/* Fuel Level Chart */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg sm:text-xl">
                  Fuel Levels Timeline
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({chartTimePeriod === "day" ? "Last 24 hours" : "Last 7 days"})
                  </span>
                </CardTitle>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <Label htmlFor="time-period" className="text-sm">
                    Time Period:
                  </Label>
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
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <Label htmlFor="chart-vehicle" className="text-sm">
                    Vehicle:
                  </Label>
                  <Select value={selectedVehicleFilter} onValueChange={setSelectedVehicleFilter}>
                    <SelectTrigger className="w-full sm:w-48">
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
                <Button onClick={handleManualRefresh} variant="outline" size="sm" disabled={chartLoading}>
                  {chartLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  <span className="hidden sm:inline">Refresh Chart</span>
                  <span className="sm:hidden">Refresh</span>
                </Button>
              </div>
            </CardHeader>
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
            <CardContent className="p-6">
              <ChartContainer
                className="h-[600px] w-full"
                config={{
                  level: { label: "Fuel Level", color: "hsl(var(--chart-1))" },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={fuelLevelData} margin={{ top: 30, right: 40, left: 40, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="0 0" className="stroke-muted" />
                    <XAxis
                      dataKey="displayTime"
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      domain={[0, Math.max(250, ...fuelLevelData.map((d) => d.level || 0))]}
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
                      name={isUsingMockupChart ? "Fuel Level " : "Fuel Level"}
                      stroke={isUsingMockupChart ? "#3b82f6" : "#2563eb"}
                      strokeWidth={4}
                      strokeDasharray="0" // We'll handle dashing per segment if needed
                      dot={<CustomizedDot />}
                      activeDot={{ r: 8, stroke: isUsingMockupChart ? "#3b82f6" : "#2563eb", strokeWidth: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Advanced Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                <div>
                  <Label htmlFor="vehicle-filter" className="text-sm">
                    Filter by Vehicle
                  </Label>
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
                  <Label htmlFor="start-date" className="text-sm">
                    Start Date
                  </Label>
                  <Input
                    id="start-date"
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="end-date" className="text-sm">
                    End Date
                  </Label>
                  <Input
                    id="end-date"
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="event-type" className="text-sm">
                    Event Type
                  </Label>
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
                <div className="flex flex-col sm:flex-row gap-2 items-end xl:col-span-3">
                  <Button onClick={handleFilter} size="sm" className="w-full sm:w-auto">
                    Apply Filters
                  </Button>
                  <Button variant="outline" onClick={clearFilters} size="sm" className="w-full sm:w-auto">
                    Clear All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Events Table */}
          <Card data-table-section>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg sm:text-xl">
                    Fuel Events
                    <span className="text-sm font-normal text-muted-foreground block sm:inline sm:ml-2">
                      (Page {paginationState.currentPage} of {paginationState.totalPages}, showing{" "}
                      {paginationState.pageSize} records per page, total {paginationState.totalItems} records)
                    </span>
                    {tableLoading && (
                      <span className="text-sm font-normal text-orange-600 block sm:inline sm:ml-2">
                        (Loading table data...)
                      </span>
                    )}
                  </CardTitle>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={() => fetchTableData(paginationState.currentPage)}
                    variant="outline"
                    size="sm"
                    disabled={tableLoading}
                  >
                    {tableLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    <span className="hidden sm:inline">Refresh Table</span>
                    <span className="sm:hidden">Refresh</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead className="hidden sm:table-cell">Date and Time</TableHead>
                    <TableHead>Fuel Change</TableHead>
                    <TableHead className="hidden md:table-cell">Location</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((event) => (
                    <TableRow key={event.id} className="hover:bg-muted/50">
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedRecords.has(event.id)}
                          onChange={() => handleSelectRecord(event.id)}
                          className="rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getEventIcon(event.event_type)}
                          <span className="font-medium text-sm">
                            {event.event_type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-sm">{event.vehicle.license_plate}</TableCell>
                      <TableCell className="font-mono text-xs hidden sm:table-cell">
                        {new Date(event.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span
                            className={`font-semibold text-sm ${
                              event.event_type === "theft" ? "text-destructive" : "text-green-600"
                            }`}
                          >
                            {event.event_type === "theft" ? "-" : "+"}
                            {Math.abs(event.fuel_change.amount_liters)}L
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {event.fuel_change.before_liters}L → {event.fuel_change.after_liters}L
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs hidden md:table-cell">
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
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                {getEventIcon(event.event_type)}
                                Event Details -{" "}
                                {event.event_type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                              </DialogTitle>
                            </DialogHeader>
                            {selectedEvent && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium">Vehicle</Label>
                                    <p className="text-sm">{selectedEvent.vehicle.license_plate}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Date and Time</Label>
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
                                      {Math.abs(selectedEvent.fuel_change.amount_liters)}L
                                    </p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Event Type</Label>
                                    <Badge
                                      variant={
                                        getSeverityBadge(selectedEvent.event_type) as
                                          | "default"
                                          | "destructive"
                                          | "outline"
                                          | "secondary"
                                      }
                                    >
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
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    <Badge
                                      variant={selectedEvent.vehicle_state.ignition ? "default" : "secondary"}
                                      className={`text-xs ${selectedEvent.vehicle_state.ignition ? "bg-green-600 hover:bg-green-700 text-white" : "bg-gray-600 hover:bg-gray-700 text-white"}`}
                                    >
                                      {selectedEvent.vehicle_state.ignition ? "ON" : "OFF"}
                                    </Badge>
                                    <Badge variant="outline">Speed: {selectedEvent.vehicle_state.speed} km/h</Badge>
                                    <Badge variant={selectedEvent.vehicle_state.stationary ? "secondary" : "outline"}>
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
            </CardContent>
            <div className="mt-4 flex justify-end gap-2">
              <Button onClick={downloadAllCSV} variant="outline" size="sm" disabled={filteredEvents.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Download All</span>
                <span className="sm:hidden">All</span>
              </Button>
              <Button onClick={downloadSelectedCSV} variant="outline" size="sm" disabled={selectedRecords.size === 0}>
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Download Selected ({selectedRecords.size})</span>
                <span className="sm:hidden">Selected ({selectedRecords.size})</span>
              </Button>
            </div>
          </Card>
        </main>
      </div>
    </SidebarProvider>
  )
}

export default FuelTheft
