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
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import api from "@/lib/api"
import { Input } from "@/components/ui/input"

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

const FuelReport: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>([])
  const [tableData, setTableData] = useState<FuelRecord[]>([])
  const [filteredData, setFilteredData] = useState<FuelRecord[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all")
  const [selectedChartVehicle, setSelectedChartVehicle] = useState<string>("all")
  const [chartTimePeriod, setChartTimePeriod] = useState<TimePeriod>("day")
  const [dateFilter, setDateFilter] = useState<"day" | "week" | "month">("day")
  const [paginationState, setPaginationState] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: 50,
    hasNext: false,
    hasPrevious: false,
  })
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    currentPage: 0,
    totalPages: 0,
    loadedRecords: 0,
    totalRecords: 0,
    progress: 0,
  })
  const [tableLoading, setTableLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRecords, setSelectedRecords] = useState<string[]>([])
  const { toast } = useToast()

  // Add these state variables after the existing state declarations
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [reportPeriod, setReportPeriod] = useState<"daily" | "weekly" | "monthly">("daily")
  const [filterByLicensePlate, setFilterByLicensePlate] = useState("")
  const [filterByIMEI, setFilterByIMEI] = useState("")

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

  // Fetch chart data (company-wide or vehicle-specific)
  const fetchChartData = async () => {
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

      // Always start with company-wide data, then filter if needed
      let url = "/fuel-data/"
      if (selectedChartVehicle !== "all" && selectedChartVehicle !== "") {
        url = `/fuel-data/?license_plate=${selectedChartVehicle}`
      }

      // First, get the first page to know total pages and show initial data
      const firstResponse = await api.get(`${url}${url.includes("?") ? "&" : "?"}page=1`)
      const firstData: FuelDataResponse = firstResponse.data

      if (!firstData.fuel_records || !Array.isArray(firstData.fuel_records)) {
        throw new Error("Invalid data format received from API")
      }

      const totalPages = firstData.pagination?.total_pages || 1
      const totalRecords = firstData.pagination?.total_records || firstData.fuel_records.length

      // Show first page data immediately
      setFuelRecords(firstData.fuel_records)

      setLoadingState({
        isLoading: totalPages > 1,
        currentPage: 1,
        totalPages,
        loadedRecords: firstData.fuel_records.length,
        totalRecords,
        progress: totalPages > 1 ? (1 / totalPages) * 100 : 100,
      })

      // If there are more pages, load them progressively for the chart data
      if (totalPages > 1) {
        const batchSize = 3
        const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2)

        for (let i = 0; i < remainingPages.length; i += batchSize) {
          const batch = remainingPages.slice(i, i + batchSize)

          const batchPromises = batch.map((page) =>
            api.get(`${url}${url.includes("?") ? "&" : "?"}page=${page}`).then((res) => res.data),
          )

          const batchResults = await Promise.all(batchPromises)

          // Update data progressively
          setFuelRecords((prevData) => {
            const newData = [...prevData]
            batchResults.forEach((data: FuelDataResponse) => {
              if (data.fuel_records && Array.isArray(data.fuel_records)) {
                newData.push(...data.fuel_records)
              }
            })
            return newData
          })

          // Update loading state
          const loadedPages = 1 + i + batch.length
          const newLoadedRecords =
            firstData.fuel_records.length +
            batchResults.reduce((sum, data) => sum + (data.fuel_records?.length || 0), 0)

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
          title: "Chart Data Loading Complete",
          description: `Successfully loaded all ${totalRecords} fuel records for the chart.`,
        })
      }
    } catch (err: any) {
      console.error("Error fetching fuel data:", err)
      setError(err.message || "Failed to fetch fuel data")
      setLoadingState((prev) => ({ ...prev, isLoading: false }))
      toast({ title: "Error", description: "Failed to fetch fuel data. Please try again.", variant: "destructive" })
    }
  }

  // Fetch table data (paginated - company-wide or vehicle-specific)
  const fetchTableData = async (page: number) => {
    try {
      setTableLoading(true)
      setError(null)

      // Always start with company-wide data, then filter if needed
      let url = `/fuel-data/?page=${page}`
      if (selectedChartVehicle !== "all" && selectedChartVehicle !== "") {
        url = `/fuel-data/?license_plate=${selectedChartVehicle}&page=${page}`
      }

      const response = await api.get(url)
      const data: FuelDataResponse = response.data

      if (!data.fuel_records || !Array.isArray(data.fuel_records)) {
        throw new Error("Invalid data format received from API")
      }

      // Update table data
      setTableData(data.fuel_records)
      setFilteredData(data.fuel_records)

      // Update pagination state
      if (data.pagination) {
        setPaginationState({
          currentPage: data.pagination.page,
          totalPages: data.pagination.total_pages,
          totalItems: data.pagination.total_records,
          pageSize: data.pagination.page_size,
          hasNext: data.pagination.has_next,
          hasPrevious: data.pagination.has_previous,
        })
      }

      setSelectedRecords([]) // Clear selected records when changing pages
    } catch (err: any) {
      console.error("Error fetching table data:", err)
      setError(err.message || "Failed to fetch table data")
      toast({ title: "Error", description: "Failed to fetch table data. Please try again.", variant: "destructive" })
    } finally {
      setTableLoading(false)
    }
  }

  // Initial data fetch - load company-wide data
  useEffect(() => {
    const initializeData = async () => {
      setLoadingState({
        isLoading: true,
        currentPage: 0,
        totalPages: 0,
        loadedRecords: 0,
        totalRecords: 0,
        progress: 0,
      })
      await fetchVehicles()
      await fetchChartData() // Load all company fuel data initially
      await fetchTableData(1) // Load first page of company fuel data
      setLoadingState((prev) => ({ ...prev, isLoading: false }))
    }

    initializeData()
  }, [])

  // When vehicle selection changes, reload data
  useEffect(() => {
    // Always fetch data, whether vehicle is selected or not
    fetchChartData()
    fetchTableData(1) // Reset to page 1 when vehicle changes
  }, [selectedChartVehicle])

  const handleFilter = () => {
    let filtered = tableData

    // Date filter based on selection
    const now = new Date()
    let startTime: Date

    switch (dateFilter) {
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

    filtered = filtered.filter((d) => new Date(d.timestamp) >= startTime)

    setFilteredData(filtered)
    setSelectedRecords([])
  }

  const clearFilters = () => {
    setDateFilter("day")
    setStartDate("")
    setEndDate("")
    setReportPeriod("daily")
    setFilterByLicensePlate("")
    setFilterByIMEI("")
    setFilteredData(tableData)
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
    const dataToDownload = downloadAll
      ? filteredData
      : filteredData.filter((d) => selectedRecords.includes(d.timestamp))
    if (!downloadAll && dataToDownload.length === 0) {
      toast({
        title: "No records selected",
        description: "Please select records or use Download All.",
        variant: "destructive",
      })
      return
    }
    const headers = [
      "Timestamp",
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
    toast({ title: "Download Complete", description: `Downloaded ${dataToDownload.length} records.` })
  }

  // Enhanced chart data processing with proper aggregation
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

  // Stats calculations
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
    fetchTableData(page)
  }

  if (loadingState.isLoading && vehicles.length === 0) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading initial fuel data...</p>
                <p className="text-sm text-muted-foreground">Please wait while we fetch your data</p>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    )
  }

  if (error) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <main className="flex-1 p-6 flex items-center justify-center">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-center text-destructive">Error</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p>{error}</p>
                <Button
                  onClick={() => {
                    fetchVehicles()
                    fetchChartData()
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
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Fuel className="h-8 w-8 text-primary" />
                Fuel Monitoring Report
              </h1>
              <p className="text-muted-foreground">Analyze fuel consumption and sensor data across your fleet</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchChartData} variant="outline" disabled={loadingState.isLoading}>
                {loadingState.isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh Chart Data
              </Button>
            </div>
          </div>

          {/* Loading Progress */}
          {loadingState.isLoading && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading Chart Data...
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
                  You can view and filter the data below while more records are being loaded for the chart.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Advanced Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="end-date">End Date</Label>
                  <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
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
                  <Label htmlFor="vehicle-select">Select Vehicle</Label>
                  <Select value={selectedChartVehicle} onValueChange={setSelectedChartVehicle}>
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
                <div className="flex gap-2 items-end">
                  <Button onClick={handleFilter}>Apply Filters</Button>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Current Level</CardTitle>
                <Gauge className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className={`text-2xl font-bold ${isLowFuel ? "text-destructive" : "text-foreground"}`}>
                    {currentLevel.toFixed(1)}L
                  </div>
                  {trend === "up" ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </div>
                {isLowFuel && (
                  <div className="flex items-center gap-1 mt-1">
                    <AlertTriangle className="h-3 w-3 text-destructive" />
                    <span className="text-xs text-destructive">Low Fuel Alert</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {selectedChartVehicle === "all" ? "All vehicles" : `Vehicle: ${selectedChartVehicle}`}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Average Level</CardTitle>
                <Fuel className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averageLevel.toFixed(1)}L</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Max Level</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{maxLevel.toFixed(1)}L</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Min Level</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{minLevel.toFixed(1)}L</div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Fuel Level Over Time
                  {selectedChartVehicle !== "all" && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      - {vehicles.find((v) => v.license_plate === selectedChartVehicle)?.name || selectedChartVehicle}
                    </span>
                  )}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({chartTimePeriod === "day" ? "Last 24 hours (4-hour intervals)" : "Last 7 days"})
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
                    <Label htmlFor="chart-vehicle">Vehicle:</Label>
                    <Select value={selectedChartVehicle} onValueChange={setSelectedChartVehicle}>
                      <SelectTrigger className="w-48">
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
            <CardContent className="p-6">
              <ChartContainer
                className="h-[600px] w-full"
                config={{
                  level: { label: "Average Fuel Level", color: "hsl(var(--chart-1))" },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={currentVehicleData} margin={{ top: 30, right: 40, left: 40, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 11 }}
                      angle={0}
                      textAnchor="middle"
                      height={80}
                      interval={0}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
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
                        position: "topRight",
                        fill: "#dc2626",
                        fontWeight: "bold",
                        fontSize: 12,
                      }}
                    />
                    <ReferenceLine
                      y={5}
                      stroke="#991b1b"
                      strokeDasharray="3 3"
                      label={{
                        value: "Critical (5L)",
                        position: "bottomRight",
                        fill: "#991b1b",
                        fontWeight: "bold",
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="level"
                      name="Average Fuel Level"
                      stroke="#2563eb"
                      strokeWidth={4}
                      dot={{ fill: "#2563eb", strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, stroke: "#2563eb", strokeWidth: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="date-filter">Time Period</Label>
                  <Select value={dateFilter} onValueChange={(v: "day" | "week" | "month") => setDateFilter(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Last 24 Hours</SelectItem>
                      <SelectItem value="week">Last 7 Days</SelectItem>
                      <SelectItem value="month">Last 30 Days</SelectItem>
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

          {/* Data Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Fuel Data (Page {paginationState.currentPage} of {paginationState.totalPages}, showing{" "}
                  {paginationState.pageSize} records per page, total {paginationState.totalItems} records)
                  {tableLoading && <span className="text-sm font-normal text-orange-600 ml-2">(Loading data...)</span>}
                </CardTitle>
                <div className="flex items-center gap-2">
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
                    Refresh Table Data
                  </Button>
                  <span className="text-sm text-muted-foreground">{selectedRecords.length} selected</span>
                </div>
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
              ) : (
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={allCurrentPageSelected}
                            onCheckedChange={toggleSelectAllPage}
                            aria-label="Select all on page"
                          />
                        </TableHead>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Fuel Level</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Speed</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Engine Hours</TableHead>
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
                            {new Date(data.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell className={data.fuel_liters <= 15 ? "text-red-600 font-semibold" : ""}>
                            {data.fuel_liters}L
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {data.latitude.toFixed(4)}, {data.longitude.toFixed(4)}
                          </TableCell>
                          <TableCell>{data.speed} km/h</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
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
                          <TableCell>{data.engine_hours}h</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
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

              {/* Download Buttons */}
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  onClick={() => downloadCSV(false)}
                  className="flex items-center gap-2"
                  disabled={selectedRecords.length === 0}
                  variant="outline"
                >
                  <Download className="h-4 w-4" /> Download Selected ({selectedRecords.length})
                </Button>
                <Button onClick={() => downloadCSV(true)} className="flex items-center gap-2">
                  <Download className="h-4 w-4" /> Download Current Page
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
