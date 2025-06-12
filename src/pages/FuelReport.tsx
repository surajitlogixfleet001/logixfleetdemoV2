"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Fuel, Download, AlertTriangle, TrendingUp, TrendingDown, Gauge, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"

interface SensorData {
  id: number
  vehicle: number
  vehicle_name: string
  timestamp: string
  timestamp_display: string
  fuel_level: string
  location: string
  speed: number
  notes: string
  latitude: string
  longitude: string
  altitude: string | null
  satellites: number
  ignition: boolean
  movement: boolean
}

interface ApiResponse {
  sensor_data: SensorData[]
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

const FuelReport: React.FC = () => {
  const [sensorData, setSensorData] = useState<SensorData[]>([])
  const [filteredData, setFilteredData] = useState<SensorData[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all")
  const [selectedChartVehicle, setSelectedChartVehicle] = useState<string>("")
  const [chartTimePeriod, setChartTimePeriod] = useState<TimePeriod>("day")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRecords, setSelectedRecords] = useState<number[]>([])
  const { toast } = useToast()

  const itemsPerPage = 10
  const API_URL = "https://palmconnect.co/telematry/fuel-data/"
  const API_TOKEN = localStorage.getItem("authToken")

  const fetchFuelData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Authorization: `Token ${API_TOKEN}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: ApiResponse = await response.json()
      if (data.sensor_data && Array.isArray(data.sensor_data)) {
        setSensorData(data.sensor_data)
        setFilteredData(data.sensor_data)
        if (data.sensor_data.length > 0) {
          setSelectedChartVehicle((prev) => prev || data.sensor_data[0].vehicle_name)
        }
      } else {
        throw new Error("Invalid data format received from API")
      }
    } catch (err: any) {
      console.error("Error fetching fuel data:", err)
      setError(err.message || "Failed to fetch fuel data")
      toast({ title: "Error", description: "Failed to fetch fuel data. Please try again.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFuelData()
  }, [])

  const handleFilter = () => {
    let filtered = sensorData
    if (selectedVehicle !== "all") filtered = filtered.filter((d) => d.vehicle_name === selectedVehicle)
    if (startDate) filtered = filtered.filter((d) => new Date(d.timestamp) >= new Date(startDate))
    if (endDate) filtered = filtered.filter((d) => new Date(d.timestamp) <= new Date(endDate))
    setFilteredData(filtered)
    setCurrentPage(1)
    setSelectedRecords([])
  }

  const clearFilters = () => {
    setSelectedVehicle("all")
    setStartDate("")
    setEndDate("")
    setFilteredData(sensorData)
    setCurrentPage(1)
    setSelectedRecords([])
  }

  const handleRecordSelection = (recordId: number, checked: boolean) => {
    setSelectedRecords((prev) => (checked ? [...prev, recordId] : prev.filter((id) => id !== recordId)))
  }

  const toggleSelectAllPage = (checked: boolean) => {
    const ids = currentData.map((d) => d.id)
    setSelectedRecords((prev) =>
      checked ? Array.from(new Set([...prev, ...ids])) : prev.filter((id) => !ids.includes(id)),
    )
  }

  const downloadCSV = (downloadAll = false) => {
    const dataToDownload = downloadAll ? filteredData : filteredData.filter((d) => selectedRecords.includes(d.id))
    if (!downloadAll && dataToDownload.length === 0) {
      toast({
        title: "No records selected",
        description: "Please select records or use Download All.",
        variant: "destructive",
      })
      return
    }
    const headers = [
      "ID",
      "Vehicle",
      "Timestamp",
      "Fuel Level",
      "Location",
      "Speed (km/h)",
      "Satellites",
      "Ignition",
      "Movement",
      "Notes",
    ]
    const csvRows = [headers.join(",")]
    dataToDownload.forEach((d) => {
      const row = [
        d.id,
        `"${d.vehicle_name}"`,
        d.timestamp,
        d.fuel_level,
        `"${d.location}"`,
        d.speed,
        d.satellites,
        d.ignition ? "Yes" : "No",
        d.movement ? "Yes" : "No",
        `"${d.notes || ""}"`,
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
  const getChartDataForVehicle = (vehicleName: string, period: TimePeriod): ChartDataPoint[] => {
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

    const filteredData = sensorData
      .filter((d) => d.vehicle_name === vehicleName && new Date(d.timestamp) >= startTime)
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

        const levels = slotData.map((d) => Number.parseFloat(d.fuel_level.replace(/L/i, "")) || 0)
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

        const levels = dayData.map((d) => Number.parseFloat(d.fuel_level.replace(/L/i, "")) || 0)
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

  const currentVehicleData = selectedChartVehicle ? getChartDataForVehicle(selectedChartVehicle, chartTimePeriod) : []

  // Stats calculations
  const lastIndex = currentVehicleData.length - 1
  const currentLevel = lastIndex >= 0 ? currentVehicleData[lastIndex].level : 0
  const prevLevel = lastIndex > 0 ? currentVehicleData[lastIndex - 1].level : currentLevel
  const averageLevel = currentVehicleData.reduce((sum, d) => sum + d.level, 0) / (currentVehicleData.length || 1)
  const maxLevel = Math.max(...currentVehicleData.map((d) => d.level), 0)
  const minLevel = Math.min(...currentVehicleData.map((d) => d.level), 0)
  const isLowFuel = currentLevel <= 15
  const trend = currentLevel > prevLevel ? "up" : "down"

  // Pagination
  const totalCount = filteredData.length
  const totalPages = Math.ceil(totalCount / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount)
  const currentData = filteredData.slice(startIndex, endIndex)

  const availableVehicles = Array.from(new Set(sensorData.map((d) => d.vehicle_name)))
  const allCurrentPageSelected = currentData.length > 0 && currentData.every((d) => selectedRecords.includes(d.id))

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading fuel data...</span>
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
                <Button onClick={fetchFuelData}>Try Again</Button>
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
            <Button onClick={fetchFuelData} variant="outline">
              Refresh Data
            </Button>
          </div>

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
          {selectedChartVehicle && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    Fuel Level Over Time - {selectedChartVehicle}
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ({chartTimePeriod === "day" ? "Last 24 hours (4-hour intervals)" : "Last 7 days"})
                    </span>
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
                          <SelectValue placeholder="Select Vehicle" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableVehicles.map((v) => (
                            <SelectItem key={v} value={v}>
                              {v}
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
          )}

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="vehicle">Vehicle</Label>
                  <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Vehicles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Vehicles</SelectItem>
                      {availableVehicles.map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
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
                  Fuel Data (Showing {startIndex + 1}-{endIndex} of {totalCount} Records)
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{selectedRecords.length} selected</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
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
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Fuel Level</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Speed</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentData.map((data) => (
                      <TableRow key={data.id} className="hover:bg-muted/50">
                        <TableCell>
                          <Checkbox
                            checked={selectedRecords.includes(data.id)}
                            onCheckedChange={(checked) => handleRecordSelection(data.id, checked as boolean)}
                            aria-label={`Select record ${data.id}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{data.vehicle_name}</TableCell>
                        <TableCell className="font-mono text-xs">{data.timestamp_display}</TableCell>
                        <TableCell
                          className={
                            Number.parseFloat(data.fuel_level.replace(/L/i, "")) <= 15
                              ? "text-red-600 font-semibold"
                              : ""
                          }
                        >
                          {data.fuel_level}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{data.location}</TableCell>
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
                        <TableCell>{data.notes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4">
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
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault()
                              setCurrentPage(page)
                            }}
                            isActive={page === currentPage}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
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
                  <Download className="h-4 w-4" /> Download All Records
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
