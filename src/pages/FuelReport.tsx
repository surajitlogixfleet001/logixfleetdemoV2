"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  ReferenceLine,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts"
import { Fuel, Download, AlertTriangle, TrendingUp, TrendingDown, Gauge, Loader2, RefreshCw } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"

// ... keep existing code (interfaces and demo data) the same

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

interface FuelRecord {
  timestamp: string
  fuel_liters: number
  odometer: number
  latitude: number
  longitude: number
  speed: number
  ignition: boolean
  movement: boolean
  satellites: number
  external_voltage: number
  engine_hours: number
}

interface FuelDataResponse {
  vehicle: {
    license_plate: string
    name: string
    imei: string
  }
  filters: {
    start_date: string | null
    end_date: string | null
  }
  pagination: {
    page: number
    page_size: number
    total_records: number
    total_pages: number
    has_next: boolean
    has_previous: boolean
  }
  fuel_records: FuelRecord[]
}

type TimePeriod = "day" | "week"

interface ChartDataPoint {
  time: string
  level: number
  avgLevel: number
  fullTimestamp: Date
  displayTime: string
  dataCount: number
}

interface LoadingState {
  isLoading: boolean
  currentPage: number
  totalPages: number
  loadedRecords: number
  totalRecords: number
  progress: number
}

interface PaginationState {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  hasNext: boolean
  hasPrevious: boolean
}

// Demo data for immediate loading
const demoVehicles: Vehicle[] = [
  {
    id: 1,
    name: "KDA381X",
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
    name: "KDE386N",
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
    name: "KDE366F",
    imei: "123456789012347",
    type: "truck",
    license_plate: "KDE366F",
    fuel_capacity: "300",
    is_active: true,
    driver_name: "Bob Johnson",
    driver_phone: "+1234567892",
    notes: "Demo vehicle",
  },
]

// Generate realistic demo fuel records
const generateDemoFuelRecords = (count = 100): FuelRecord[] => {
  const records: FuelRecord[] = []
  const now = new Date()
  let currentFuel = 180 // Start with reasonable fuel level

  for (let i = count; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 15 * 60 * 1000) // Every 15 minutes

    // Simulate natural fuel consumption
    const consumption = Math.random() * 2 + 0.5 // 0.5-2.5L per 15min
    currentFuel = Math.max(10, currentFuel - consumption)

    // Occasionally refuel
    if (Math.random() < 0.02 && currentFuel < 100) {
      currentFuel = Math.min(250, currentFuel + Math.random() * 150 + 100)
    }

    records.push({
      timestamp: timestamp.toISOString(),
      fuel_liters: Math.round(currentFuel * 10) / 10,
      odometer: 50000 + (count - i) * 2,
      latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
      longitude: -74.006 + (Math.random() - 0.5) * 0.1,
      speed: Math.random() < 0.3 ? 0 : Math.random() * 80 + 20,
      ignition: Math.random() < 0.8,
      movement: Math.random() < 0.7,
      satellites: Math.floor(Math.random() * 8) + 4,
      external_voltage: 12.0 + Math.random() * 2,
      engine_hours: 1000 + (count - i) * 0.25,
    })
  }

  return records.reverse()
}

const FuelReport: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>([])
  const [tableData, setTableData] = useState<FuelRecord[]>([])
  const [filteredData, setFilteredData] = useState<FuelRecord[]>([])
  const [allFilteredData, setAllFilteredData] = useState<FuelRecord[]>([]) // Store all filtered data for download
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all")
  const [selectedChartVehicle, setSelectedChartVehicle] = useState<string>("all")
  const [chartTimePeriod, setChartTimePeriod] = useState<TimePeriod>("day")
  const [paginationState, setPaginationState] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: 50,
    hasNext: false,
    hasPrevious: false,
  })
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    currentPage: 0,
    totalPages: 0,
    loadedRecords: 0,
    totalRecords: 0,
    progress: 0,
  })
  const [tableLoading, setTableLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRecords, setSelectedRecords] = useState<string[]>([])
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

  // Table filter states (separate from chart)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [reportPeriod, setReportPeriod] = useState<"daily" | "weekly" | "monthly">("daily")
  const [filterByLicensePlate, setFilterByLicensePlate] = useState("")
  const [filterByIMEI, setFilterByIMEI] = useState("")

  // ... keep existing code (data loading and manipulation functions) the same

  // Load demo data immediately on component mount
  const loadDemoData = () => {
    const demoRecords = generateDemoFuelRecords(100)
    
    setVehicles(demoVehicles)
    setFuelRecords(demoRecords)
    setTableData(demoRecords.slice(0, 50)) // First 50 for table
    setFilteredData(demoRecords.slice(0, 50))

    setPaginationState({
      currentPage: 1,
      totalPages: Math.ceil(demoRecords.length / 50),
      totalItems: demoRecords.length,
      pageSize: 50,
      hasNext: demoRecords.length > 50,
      hasPrevious: false,
    })
  }

  // Simulate API call for real data
  const fetchRealData = async () => {
    setIsRefreshing(true)
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Simulate fetching real data (replace with actual API calls)
      const realRecords = generateDemoFuelRecords(150) // Simulate more real data
      
      setVehicles(demoVehicles) // In real app, fetch from API
      setFuelRecords(realRecords)
      setTableData(realRecords.slice(0, 50))
      setFilteredData(realRecords.slice(0, 50))

      setPaginationState({
        currentPage: 1,
        totalPages: Math.ceil(realRecords.length / 50),
        totalItems: realRecords.length,
        pageSize: 50,
        hasNext: realRecords.length > 50,
        hasPrevious: false,
      })
      
    } catch (error) {
      console.error("Failed to fetch real data:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Load demo data immediately when component mounts
  useEffect(() => {
    loadDemoData()
  }, [])

  // Apply filters only to table data
  const handleFilter = () => {
    let filtered = [...fuelRecords] // Start with all records

    // Date range filter
    if (startDate) {
      const start = new Date(startDate)
      filtered = filtered.filter((d) => new Date(d.timestamp) >= start)
    }

    if (endDate) {
      const end = new Date(endDate + "T23:59:59") // Include the entire end date
      filtered = filtered.filter((d) => new Date(d.timestamp) <= end)
    }

    // Vehicle filter by license plate
    if (filterByLicensePlate) {
      // In a real app, you'd filter by vehicle data associated with records
      // For demo, we'll simulate this
    }

    // Vehicle filter by IMEI
    if (filterByIMEI) {
      // In a real app, you'd filter by IMEI associated with records
      // For demo, we'll simulate this
    }

    // Store all filtered data for download
    setAllFilteredData(filtered)

    // Apply pagination to filtered results
    const startIndex = (paginationState.currentPage - 1) * 50
    const paginatedFiltered = filtered.slice(startIndex, startIndex + 50)
    
    setFilteredData(paginatedFiltered)
    setTableData(paginatedFiltered)
    
    // Update pagination state
    setPaginationState(prev => ({
      ...prev,
      totalItems: filtered.length,
      totalPages: Math.ceil(filtered.length / 50),
      hasNext: filtered.length > startIndex + 50,
      hasPrevious: startIndex > 0,
    }))
    
    setSelectedRecords([])
  }

  const clearFilters = () => {
    setStartDate("")
    setEndDate("")
    setReportPeriod("daily")
    setFilterByLicensePlate("")
    setFilterByIMEI("")
    
    // Reset to original data
    setAllFilteredData(fuelRecords)
    const startIndex = (paginationState.currentPage - 1) * 50
    const resetData = fuelRecords.slice(startIndex, startIndex + 50)
    setFilteredData(resetData)
    setTableData(resetData)
    
    setPaginationState(prev => ({
      ...prev,
      totalItems: fuelRecords.length,
      totalPages: Math.ceil(fuelRecords.length / 50),
      hasNext: fuelRecords.length > startIndex + 50,
      hasPrevious: startIndex > 0,
    }))
    
    setSelectedRecords([])
  }

  const handleRecordSelection = (recordId: string, checked: boolean) => {
    setSelectedRecords((prev) => (checked ? [...prev, recordId] : prev.filter((id) => id !== recordId)))
  }

  const toggleSelectAllPage = (checked: boolean) => {
    const ids = filteredData.map((d) => d.timestamp)
    setSelectedRecords((prev) =>
      checked ? Array.from(new Set([...prev, ...ids])) : prev.filter((id) => !ids.includes(id)),
    )
  }

  const downloadCSV = (downloadAll = false) => {
    // For "Download All", use all filtered data; for "Download Selected", use only selected records
    const dataToDownload = downloadAll
      ? allFilteredData.length > 0 ? allFilteredData : fuelRecords // Download all filtered data or all data if no filters applied
      : filteredData.filter((d) => selectedRecords.includes(d.timestamp))
    
    if (!downloadAll && dataToDownload.length === 0) {
      return
    }
    
    const headers = [
      "Date and Time",
      "Fuel Level (L)",
      "Odometer",
      "Latitude",
      "Longitude",
      "Speed (km/h)",
      "Ignition",
      "Movement",
      "Satellites",
      "External Voltage",
      "Engine Hours",
    ]
    
    const csvRows = [headers.join(",")]
    dataToDownload.forEach((d) => {
      const row = [
        d.timestamp,
        d.fuel_liters,
        d.odometer,
        d.latitude,
        d.longitude,
        d.speed,
        d.ignition ? "Yes" : "No",
        d.movement ? "Yes" : "No",
        d.satellites,
        d.external_voltage,
        d.engine_hours,
      ].join(",")
      csvRows.push(row)
    })
    
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = downloadAll
      ? `fuel-report-all-${new Date().toISOString().split("T")[0]}.csv`
      : `fuel-report-selected-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Chart data processing (independent of table filters)
  const getChartDataForVehicle = (period: TimePeriod): ChartDataPoint[] => {
    const now = new Date()
    let startTime: Date

    switch (period) {
      case "day":
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case "week":
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    }

    const filteredData = fuelRecords
      .filter((d) => new Date(d.timestamp) >= startTime)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    if (period === "day") {
      // Create 6 time slots for 24 hours (4-hour intervals)
      const timeSlots = [
        { start: 0, end: 4, label: "00:00-04:00" },
        { start: 4, end: 8, label: "04:00-08:00" },
        { start: 8, end: 12, label: "08:00-12:00" },
        { start: 12, end: 16, label: "12:00-16:00" },
        { start: 16, end: 20, label: "16:00-20:00" },
        { start: 20, end: 24, label: "20:00-24:00" },
      ]

      return timeSlots.map((slot) => {
        const slotData = filteredData.filter((d) => {
          const hour = new Date(d.timestamp).getHours()
          return hour >= slot.start && hour < slot.end
        })

        const levels = slotData.map((d) => d.fuel_liters || 0)
        const avgLevel = levels.length > 0 ? levels.reduce((sum, level) => sum + level, 0) / levels.length : 0

        return {
          time: slot.label,
          displayTime: slot.label,
          level: avgLevel,
          avgLevel: avgLevel,
          fullTimestamp: new Date(),
          dataCount: slotData.length,
        }
      })
    } else {
      // Week view - show all 7 days
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
      const weekData: ChartDataPoint[] = []

      // Create data for each day of the week
      for (let i = 6; i >= 0; i--) {
        const dayDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const dayStart = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate())
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

        const dayData = filteredData.filter((d) => {
          const timestamp = new Date(d.timestamp)
          return timestamp >= dayStart && timestamp < dayEnd
        })

        const levels = dayData.map((d) => d.fuel_liters || 0)
        const avgLevel = levels.length > 0 ? levels.reduce((sum, level) => sum + level, 0) / levels.length : 0

        weekData.push({
          time: dayNames[dayDate.getDay()],
          displayTime: `${dayNames[dayDate.getDay()]} ${dayDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}`,
          level: avgLevel,
          avgLevel: avgLevel,
          fullTimestamp: dayDate,
          dataCount: dayData.length,
        })
      }

      return weekData
    }
  }

  // Custom tooltip for better time display
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartDataPoint
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{data.displayTime}</p>
          <p className="text-sm">
            <span className="text-blue-600 font-medium">Avg Fuel Level: {payload[0].value.toFixed(1)}L</span>
          </p>
          <p className="text-xs text-muted-foreground">Data points: {data.dataCount}</p>
        </div>
      )
    }
    return null
  }

  const currentVehicleData = getChartDataForVehicle(chartTimePeriod)

  // Stats calculations (based on chart data, not filtered table data)
  const lastIndex = currentVehicleData.length - 1
  const currentLevel = lastIndex >= 0 ? currentVehicleData[lastIndex].level : 0
  const prevLevel = lastIndex > 0 ? currentVehicleData[lastIndex - 1].level : currentLevel
  const averageLevel = currentVehicleData.reduce((sum, d) => sum + d.level, 0) / (currentVehicleData.length || 1)
  const maxLevel = Math.max(...currentVehicleData.map((d) => d.level), 0)
  const minLevel = Math.min(...currentVehicleData.map((d) => d.level), 0)
  const isLowFuel = currentLevel <= 15
  const trend = currentLevel > prevLevel ? "up" : "down"

  const allCurrentPageSelected =
    filteredData.length > 0 && filteredData.every((d) => selectedRecords.includes(d.timestamp))

  // Handle page change
  const handlePageChange = (page: number) => {
    const dataSource = allFilteredData.length > 0 ? allFilteredData : fuelRecords
    const startIndex = (page - 1) * 50
    const endIndex = startIndex + 50
    const pageData = dataSource.slice(startIndex, endIndex)
    
    setTableData(pageData)
    setFilteredData(pageData)
    setPaginationState((prev) => ({ 
      ...prev, 
      currentPage: page,
      hasNext: dataSource.length > endIndex,
      hasPrevious: startIndex > 0,
    }))
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
                <Fuel className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                <span className="hidden sm:inline">Fuel Monitoring Report</span>
                <span className="sm:hidden">Fuel Monitor</span>
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">Analyze fuel consumption and sensor data across your fleet</p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={fetchRealData} 
                disabled={isRefreshing}
                className="flex items-center gap-2"
                size="sm"
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card>
              <CardHeader className="flex items-center justify-between pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Current Level</CardTitle>
                <Gauge className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className={`text-lg sm:text-2xl font-bold ${isLowFuel ? "text-destructive" : "text-foreground"}`}>
                    {currentLevel.toFixed(1)}L
                  </div>
                  {trend === "up" ? (
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                  )}
                </div>
                {isLowFuel && (
                  <div className="flex items-center gap-1 mt-1">
                    <AlertTriangle className="h-2 w-2 sm:h-3 sm:w-3 text-destructive" />
                    <span className="text-xs text-destructive">Low Fuel</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {selectedChartVehicle === "all" ? "All vehicles" : `Vehicle: ${selectedChartVehicle}`}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex items-center justify-between pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Average Level</CardTitle>
                <Fuel className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold">{averageLevel.toFixed(1)}L</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex items-center justify-between pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Max Level</CardTitle>
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold text-green-600">{maxLevel.toFixed(1)}L</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex items-center justify-between pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Min Level</CardTitle>
                <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold text-red-600">{minLevel.toFixed(1)}L</div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Chart */}
          <Card>
            <CardHeader>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <CardTitle className="text-base sm:text-lg">
                  Fuel Level Over Time
                  {selectedChartVehicle !== "all" && (
                    <span className="text-sm font-normal text-muted-foreground ml-2 block sm:inline">
                      - {vehicles.find((v) => v.license_plate === selectedChartVehicle)?.name || selectedChartVehicle}
                    </span>
                  )}
                  <span className="text-xs sm:text-sm font-normal text-muted-foreground ml-2 block sm:inline">
                    ({chartTimePeriod === "day" ? "Last 24 hours (4-hour intervals)" : "Last 7 days"})
                  </span>
                </CardTitle>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="time-period" className="text-xs sm:text-sm">Time Period:</Label>
                    <Select value={chartTimePeriod} onValueChange={(v: TimePeriod) => setChartTimePeriod(v)}>
                      <SelectTrigger className="w-24 sm:w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">24 Hours</SelectItem>
                        <SelectItem value="week">7 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="chart-vehicle" className="text-xs sm:text-sm">Vehicle:</Label>
                    <Select value={selectedChartVehicle} onValueChange={setSelectedChartVehicle}>
                      <SelectTrigger className="w-32 sm:w-48">
                        <SelectValue placeholder="All Vehicles" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Vehicles</SelectItem>
                        {vehicles.map((v) => (
                          <SelectItem key={v.license_plate} value={v.license_plate}>
                            {v.name} ({v.license_plate})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-6">
              <ChartContainer
                className="h-[300px] sm:h-[400px] lg:h-[600px] w-full"
                config={{
                  level: { label: "Average Fuel Level", color: "hsl(var(--chart-1))" },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={currentVehicleData} margin={{ top: 20, right: 20, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      interval={0}
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      label={{ value: "Fuel Level (L)", angle: -90, position: "insideLeft" }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" height={36} />
                    <ReferenceLine
                      y={15}
                      stroke="#dc2626"
                      strokeDasharray="5 5"
                      label={{
                        value: "Low Fuel (15L)",
                        position: "top",
                        fill: "#dc2626",
                        fontWeight: "bold",
                        fontSize: 10,
                      }}
                    />
                    <ReferenceLine
                      y={5}
                      stroke="#991b1b"
                      strokeDasharray="3 3"
                      label={{
                        value: "Critical (5L)",
                        position: "bottom",
                        fill: "#991b1b",
                        fontWeight: "bold",
                        fontSize: 10,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="level"
                      name="Average Fuel Level"
                      stroke="#2563eb"
                      strokeWidth={3}
                      dot={{ fill: "#2563eb", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: "#2563eb", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Data Table with Advanced Filters */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-base sm:text-lg">
                  <span className="block sm:hidden">Fuel Data</span>
                  <span className="hidden sm:block">
                    Fuel Data (Page {paginationState.currentPage} of {paginationState.totalPages}, showing{" "}
                    {paginationState.pageSize} records per page, total {paginationState.totalItems} records)
                  </span>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm text-muted-foreground">{selectedRecords.length} selected</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Advanced Filters for Table */}
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 border rounded-lg bg-muted/50">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Table Filters</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="start-date" className="text-xs sm:text-sm">Start Date</Label>
                    <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-xs sm:text-sm" />
                  </div>
                  <div>
                    <Label htmlFor="end-date" className="text-xs sm:text-sm">End Date</Label>
                    <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-xs sm:text-sm" />
                  </div>
                  <div>
                    <Label htmlFor="report-period" className="text-xs sm:text-sm">Period</Label>
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
                    <Label htmlFor="vehicle-select" className="text-xs sm:text-sm">Select Vehicle</Label>
                    <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Vehicles" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Vehicles</SelectItem>
                        {vehicles.map((v) => (
                          <SelectItem key={v.license_plate} value={v.license_plate}>
                            {v.name} ({v.license_plate})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 items-end sm:col-span-2 lg:col-span-4">
                    <Button onClick={handleFilter} size="sm">Apply Filters</Button>
                    <Button variant="outline" onClick={clearFilters} size="sm">
                      Clear
                    </Button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <ScrollArea className="h-[400px] sm:h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8 sm:w-12">
                          <Checkbox
                            checked={allCurrentPageSelected}
                            onCheckedChange={toggleSelectAllPage}
                            aria-label="Select all on page"
                          />
                        </TableHead>
                        <TableHead className="text-xs sm:text-sm">Date and Time</TableHead>
                        <TableHead className="text-xs sm:text-sm">Fuel Level</TableHead>
                        <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Location</TableHead>
                        <TableHead className="text-xs sm:text-sm">Speed</TableHead>
                        <TableHead className="text-xs sm:text-sm">Status</TableHead>
                        <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Engine Hours</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map((data) => (
                        <TableRow key={data.timestamp} className="hover:bg-muted/50">
                          <TableCell>
                            <Checkbox
                              checked={selectedRecords.includes(data.timestamp)}
                              onCheckedChange={(checked) => handleRecordSelection(data.timestamp, checked as boolean)}
                              aria-label={`Select record ${data.timestamp}`}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            <div className="flex flex-col">
                              <span>{new Date(data.timestamp).toLocaleDateString()}</span>
                              <span className="text-muted-foreground">{new Date(data.timestamp).toLocaleTimeString()}</span>
                            </div>
                          </TableCell>
                          <TableCell className={`text-xs sm:text-sm ${data.fuel_liters <= 15 ? "text-red-600 font-semibold" : ""}`}>
                            {data.fuel_liters}L
                          </TableCell>
                          <TableCell className="font-mono text-xs hidden sm:table-cell">
                            <div className="flex flex-col">
                              <span>{data.latitude.toFixed(4)}</span>
                              <span>{data.longitude.toFixed(4)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">{data.speed} km/h</TableCell>
                          <TableCell>
                            <div className="flex flex-col sm:flex-row gap-1">
                              <Badge variant={data.ignition ? "default" : "secondary"} className="text-xs">
                                {data.ignition ? "ON" : "OFF"}
                              </Badge>
                              {data.movement && (
                                <Badge variant="outline" className="text-xs">
                                  MOVING
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm hidden lg:table-cell">{data.engine_hours}h</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>

              {/* Pagination */}
              {paginationState.totalPages > 1 && (
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs sm:text-sm text-muted-foreground">
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

              {/* Download Buttons */}
              <div className="mt-4 flex flex-col sm:flex-row justify-end gap-2">
                <Button
                  onClick={() => downloadCSV(false)}
                  className="flex items-center gap-2"
                  disabled={selectedRecords.length === 0}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4" /> 
                  <span className="hidden sm:inline">Download Selected ({selectedRecords.length})</span>
                  <span className="sm:hidden">Selected ({selectedRecords.length})</span>
                </Button>
                <Button onClick={() => downloadCSV(true)} className="flex items-center gap-2" size="sm">
                  <Download className="h-4 w-4" /> 
                  <span className="hidden sm:inline">Download All</span>
                  <span className="sm:hidden">All</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </SidebarProvider>
  )
}

export default FuelReport