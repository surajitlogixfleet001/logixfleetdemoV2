"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer } from "@/components/ui/chart"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts"
import { Search, AlertTriangle, ArrowLeft, Car, Fuel, ShieldAlert, Eye, MapPin } from "lucide-react"
import { AppSidebar } from "@/components/AppSidebar"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/api"
import { Progress } from "@/components/ui/progress"
import { Satellite, Activity, Radio, Clock, CheckCircle, XCircle } from "lucide-react"

// ... (keep all the existing interfaces)

interface VehicleData {
  id: number
  name: string
  imei: string
  type: string
  license_plate: string
  is_active: boolean
  driver_name: string
  driver_phone: string
  status: string
}

interface VehicleDetail {
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
}

const Vehicles = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [vehicles, setVehicles] = useState<VehicleData[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleDetail | null>(null)
  const [vehicleFuelRecords, setVehicleFuelRecords] = useState<FuelRecord[]>([])
  const [vehicleFuelEvents, setVehicleFuelEvents] = useState<FuelEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const { toast } = useToast()

  // GPS Status States
  const [gpsStatus, setGpsStatus] = useState<"connecting" | "connected" | "disconnected" | "completed">("connecting")
  const [signalStrength, setSignalStrength] = useState(0)
  const [satelliteCount, setSatelliteCount] = useState(0)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [connectionProgress, setConnectionProgress] = useState(0)
  const [isSimulationComplete, setIsSimulationComplete] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)

  // Fetch vehicles list
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true)
        const response = await api.get("/vehicles/")
        setVehicles(response.data.fleet_overview)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching vehicles:", err)
        setError("Failed to fetch vehicle data. Please try again later.")
        setLoading(false)
      }
    }

    fetchVehicles()
  }, [])

  // GPS Connection Simulation Effect - Based on Vehicle Data
  useEffect(() => {
    if (selectedVehicle && !isSimulationComplete) {
      // Reset states
      setGpsStatus("connecting")
      setSignalStrength(0)
      setSatelliteCount(0)
      setConnectionProgress(0)
      setIsSimulationComplete(false)

      const runConnectionSimulation = async () => {
        // Phase 1: Initializing (20%)
        await new Promise((resolve) => setTimeout(resolve, 800))
        setConnectionProgress(20)
        setSignalStrength(15)
        setSatelliteCount(1)

        // Phase 2: Searching satellites (40%)
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setConnectionProgress(40)
        setSignalStrength(35)
        setSatelliteCount(3)

        // Phase 3: Acquiring signal (60%)
        await new Promise((resolve) => setTimeout(resolve, 1200))
        setConnectionProgress(60)
        setSignalStrength(55)
        setSatelliteCount(5)

        // Phase 4: Establishing connection (80%)
        await new Promise((resolve) => setTimeout(resolve, 900))
        setConnectionProgress(80)
        setSignalStrength(75)
        setSatelliteCount(7)

        // Phase 5: Final connection attempt (100%)
        await new Promise((resolve) => setTimeout(resolve, 700))
        setConnectionProgress(100)

        // Determine final status based on vehicle data
        const hasRecentData = vehicleFuelRecords.length > 0
        const isVehicleActive = selectedVehicle.is_active
        const hasEvents = vehicleFuelEvents.length > 0

        // Connection success logic based on actual data
        const connectionSuccess = hasRecentData && isVehicleActive && (hasEvents || Math.random() > 0.2)

        if (connectionSuccess) {
          setSignalStrength(92)
          setSatelliteCount(9)
          setGpsStatus("connected")
          setLastUpdate(new Date())
        } else {
          setSignalStrength(0)
          setSatelliteCount(0)
          setGpsStatus("disconnected")
        }

        setGpsStatus("completed")
        setIsSimulationComplete(true)
      }

      runConnectionSimulation()
    }
  }, [selectedVehicle, vehicleFuelRecords, vehicleFuelEvents, isSimulationComplete])

  // Fetch vehicle details when a vehicle is selected
  const fetchVehicleDetails = async (vehicle: VehicleData) => {
    try {
      setDetailLoading(true)
      setSelectedVehicle(null)
      setIsSimulationComplete(false)
      // Clear previous data
      setVehicleFuelRecords([])
      setVehicleFuelEvents([])

      // Fetch all data first before setting selectedVehicle
      const [vehicleResponse, fuelRecordsResponse, fuelEventsResponse] = await Promise.all([
        api.get(`/vehicles/${vehicle.imei}/`),
        api.get(`/vehicles/${vehicle.imei}/fuel-records/`),
        api.get(`/vehicles/${vehicle.imei}/fuel-events/`),
      ])

      // Set all data at once
      const vehicleData = vehicleResponse.data
      const fuelRecords = fuelRecordsResponse.data.fuel_records || []
      const fuelEvents = fuelEventsResponse.data.events || []

      setVehicleFuelRecords(fuelRecords)
      setVehicleFuelEvents(fuelEvents)
      setSelectedVehicle(vehicleData) // This triggers GPS simulation with all data available

      setActiveTab("overview")
      toast({
        title: "Vehicle Details Loaded",
        description: `Successfully loaded details for ${vehicle.name}`,
      })
    } catch (err: any) {
      console.error("Error fetching vehicle details:", err)
      toast({
        title: "Error",
        description: "Failed to fetch vehicle details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDetailLoading(false)
    }
  }

  // Generate chart data for fuel levels
  const generateChartData = () => {
    if (!vehicleFuelRecords.length) return []

    return vehicleFuelRecords
      .slice(-24) // Last 24 records
      .map((record) => ({
        time: new Date(record.timestamp).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        level: record.fuel_liters,
        timestamp: record.timestamp,
      }))
  }

  const filteredVehicles = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return vehicles.filter((v) => {
      return (
        v.name.toLowerCase().includes(term) ||
        v.imei.toLowerCase().includes(term) ||
        v.license_plate.toLowerCase().includes(term) ||
        v.type.toLowerCase().includes(term) ||
        v.driver_name.toLowerCase().includes(term) ||
        v.driver_phone.toLowerCase().includes(term) ||
        (v.is_active ? "active" : "inactive").includes(term)
      )
    })
  }, [searchTerm, vehicles])

  const getVehicleTypeDisplay = (type: string) => {
    const types = { car: "Car", truck: "Truck", bus: "Bus", motorcycle: "Motorcycle", other: "Other" }
    return types[type as keyof typeof types] || type.charAt(0).toUpperCase() + type.slice(1)
  }

  const getStatusBadge = (vehicle: VehicleData) => {
    if (!vehicle.is_active)
      return (
        <Badge variant="destructive" className="text-xs">
          INACTIVE
        </Badge>
      )
    return (
      <Badge variant="default" className="text-xs">
        ACTIVE
      </Badge>
    )
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "theft":
        return <ShieldAlert className="h-4 w-4 text-red-500" />
      case "fill":
        return <Fuel className="h-4 w-4 text-green-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
    }
  }

  const chartData = generateChartData()

  // Get final connection status
  const getFinalConnectionStatus = () => {
    if (!isSimulationComplete) return null

    const hasRecentData = vehicleFuelRecords.length > 0
    const isVehicleActive = selectedVehicle?.is_active
    const hasEvents = vehicleFuelEvents.length > 0

    return hasRecentData && isVehicleActive && (hasEvents || signalStrength > 50)
  }

  // GPS Status Panel Component
  const GPSStatusPanel = () => {
    const isConnected = getFinalConnectionStatus()
    const showFinalStatus = isSimulationComplete

    return (
      <Card className="mb-6 bg-white border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {/* Left Section - Back Button & Vehicle Info */}
            <div className="flex items-center gap-6">
              <Button variant="outline" onClick={() => setSelectedVehicle(null)} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Vehicles
              </Button>

              <div className="flex items-center gap-4">
                <div className="relative">
                  {/* Animated Vehicle Icon */}
                  <div
                    className={`relative p-3 rounded-full ${
                      showFinalStatus ? (isConnected ? "bg-green-100" : "bg-red-100") : "bg-blue-100"
                    }`}
                  >
                    {!showFinalStatus && <div className="absolute inset-0 rounded-full bg-blue-200 animate-ping"></div>}
                    <Car
                      className={`h-6 w-6 relative z-10 ${
                        showFinalStatus ? (isConnected ? "text-green-600" : "text-red-600") : "text-blue-600"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <div className="text-2xl font-bold text-gray-900">{selectedVehicle?.name}</div>
                  <div className="text-sm text-gray-500">{selectedVehicle?.license_plate}</div>
                </div>
              </div>
            </div>

            {/* Center Section - Status Indicators */}
            <div className="flex items-center gap-8">
              {/* GPS Signal */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Satellite
                    className={`h-5 w-5 ${
                      showFinalStatus ? (isConnected ? "text-green-600" : "text-red-600") : "text-blue-600"
                    } ${!showFinalStatus ? "animate-pulse" : ""}`}
                  />
                </div>
                <div>
                  <div className="text-xs text-gray-500">GPS Signal</div>
                  <div className="text-sm font-semibold text-gray-900">{signalStrength}%</div>
                </div>
              </div>

              {/* Satellites */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Radio
                    className={`h-5 w-5 ${
                      satelliteCount >= 4 ? "text-green-600" : "text-yellow-600"
                    } ${!showFinalStatus ? "animate-pulse" : ""}`}
                  />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Satellites</div>
                  <div className="text-sm font-semibold text-gray-900">{satelliteCount}/12</div>
                </div>
              </div>

              {/* Connection Status */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  {showFinalStatus ? (
                    isConnected ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )
                  ) : (
                    <Activity className="h-5 w-5 text-blue-600 animate-pulse" />
                  )}
                </div>
                <div>
                  <div className="text-xs text-gray-500">Status</div>
                  <div
                    className={`text-sm font-semibold ${
                      showFinalStatus ? (isConnected ? "text-green-600" : "text-red-600") : "text-blue-600"
                    }`}
                  >
                    {showFinalStatus ? (isConnected ? "CONNECTED" : "DISCONNECTED") : "CONNECTING"}
                  </div>
                </div>
              </div>

              {/* Last Update */}
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-600" />
                <div>
                  <div className="text-xs text-gray-500">Last Update</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {showFinalStatus && isConnected ? lastUpdate.toLocaleTimeString() : "--:--"}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section - Signal Bars & Status */}
            <div className="flex items-center gap-4">
              <div className="flex items-end gap-1">
                {[1, 2, 3, 4, 5].map((bar) => (
                  <div
                    key={bar}
                    className={`w-2 rounded-t transition-all duration-300 ${
                      signalStrength >= bar * 20
                        ? showFinalStatus
                          ? isConnected
                            ? "bg-green-500"
                            : "bg-red-500"
                          : "bg-blue-500"
                        : "bg-gray-300"
                    }`}
                    style={{ height: signalStrength >= bar * 20 ? `${bar * 4 + 8}px` : "8px" }}
                  />
                ))}
              </div>

              {/* Live Indicator */}
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    showFinalStatus
                      ? isConnected
                        ? "bg-green-500 animate-pulse"
                        : "bg-red-500"
                      : "bg-blue-500 animate-pulse"
                  }`}
                ></div>
                <span className="text-xs text-gray-600 font-medium">
                  {showFinalStatus ? (isConnected ? "LIVE" : "OFFLINE") : "SYNC"}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar for Connection */}
          {!showFinalStatus && (
            <div className="mt-4">
              <Progress value={connectionProgress} className="h-2" />
              <div className="text-center text-sm text-gray-600 mt-2">
                Establishing GPS connection... {connectionProgress}%
              </div>
            </div>
          )}

          {/* Final Status Message */}
          {showFinalStatus && (
            <div className="mt-4 text-center">
              <div className={`text-sm font-medium ${isConnected ? "text-green-600" : "text-red-600"}`}>
                {isConnected ? "✓ GPS connection established successfully" : "✗ Unable to establish GPS connection"}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // If a vehicle is selected, show the detail view with GPS panel
  if (selectedVehicle) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <SidebarInset>
            <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
              <div className="container mx-auto space-y-6">
                {/* GPS Status Panel */}
                <GPSStatusPanel />

                {/* Vehicle Details & Analytics Header */}
                <div className="text-center mb-6">
                  <p className="text-muted-foreground">Vehicle Details & Analytics</p>
                </div>

                {detailLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-4 text-muted-foreground">Loading vehicle details...</p>
                    </div>
                  </div>
                ) : (
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="fuel-report">Fuel Report</TabsTrigger>
                      <TabsTrigger value="fuel-events">Fuel Events</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                      {/* Vehicle Info Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Vehicle Info</CardTitle>
                            <Car className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="text-2xl font-bold">{selectedVehicle.name}</div>
                              <div className="text-sm text-muted-foreground">
                                <div>License: {selectedVehicle.license_plate}</div>
                                <div>IMEI: {selectedVehicle.imei}</div>
                                <div>Type: {getVehicleTypeDisplay(selectedVehicle.type)}</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Driver Info</CardTitle>
                            <Car className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="text-2xl font-bold">{selectedVehicle.driver_name}</div>
                              <div className="text-sm text-muted-foreground">
                                <div>Phone: {selectedVehicle.driver_phone}</div>
                                <div>Status: {getStatusBadge({ ...selectedVehicle, status: "ACTIVE" })}</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Fuel Capacity</CardTitle>
                            <Fuel className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="text-2xl font-bold">{selectedVehicle.fuel_capacity}L</div>
                              <div className="text-sm text-muted-foreground">
                                <div>Current: {vehicleFuelRecords[0]?.fuel_liters || 0}L</div>
                                <div>Records: {vehicleFuelRecords.length}</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-2xl font-bold">{vehicleFuelEvents.length}</div>
                            <p className="text-xs text-muted-foreground">Total Events</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-red-600">
                              {vehicleFuelEvents.filter((e) => e.event_type === "theft").length}
                            </div>
                            <p className="text-xs text-muted-foreground">Theft Events</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-green-600">
                              {vehicleFuelEvents.filter((e) => e.event_type === "fill").length}
                            </div>
                            <p className="text-xs text-muted-foreground">Fill Events</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-2xl font-bold">{vehicleFuelRecords.length}</div>
                            <p className="text-xs text-muted-foreground">Fuel Records</p>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="fuel-report" className="space-y-6">
                      {/* Fuel Level Chart */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Fuel Level Over Time</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {chartData.length > 0 ? (
                            <ChartContainer
                              className="h-[400px] w-full"
                              config={{
                                level: { label: "Fuel Level", color: "hsl(var(--chart-1))" },
                              }}
                            >
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="time" />
                                  <YAxis />
                                  <Tooltip />
                                  <Legend />
                                  <ReferenceLine y={15} stroke="red" strokeDasharray="5 5" label="Low Fuel" />
                                  <Line
                                    type="monotone"
                                    dataKey="level"
                                    stroke="#2563eb"
                                    strokeWidth={2}
                                    name="Fuel Level (L)"
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </ChartContainer>
                          ) : (
                            <div className="h-[400px] flex items-center justify-center border border-dashed rounded-lg">
                              <p className="text-muted-foreground">No fuel data available</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Fuel Records Table */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Recent Fuel Records</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ScrollArea className="h-[400px]">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Timestamp</TableHead>
                                  <TableHead>Fuel Level</TableHead>
                                  <TableHead>Odometer</TableHead>
                                  <TableHead>Speed</TableHead>
                                  <TableHead>Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {vehicleFuelRecords.slice(0, 20).map((record, index) => (
                                  <TableRow key={index}>
                                    <TableCell className="font-mono text-xs">
                                      {new Date(record.timestamp).toLocaleString()}
                                    </TableCell>
                                    <TableCell className={record.fuel_liters <= 15 ? "text-red-600 font-semibold" : ""}>
                                      {record.fuel_liters}L
                                    </TableCell>
                                    <TableCell>{record.odometer} km</TableCell>
                                    <TableCell>{record.speed} km/h</TableCell>
                                    <TableCell>
                                      <Badge variant={record.ignition ? "default" : "secondary"} className="text-xs">
                                        {record.ignition ? "ON" : "OFF"}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="fuel-events" className="space-y-6">
                      {/* Events Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-2xl font-bold">{vehicleFuelEvents.length}</div>
                            <p className="text-xs text-muted-foreground">Total Events</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-red-600">
                              {vehicleFuelEvents.filter((e) => e.event_type === "theft").length}
                            </div>
                            <p className="text-xs text-muted-foreground">Theft Events</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-green-600">
                              {vehicleFuelEvents.filter((e) => e.event_type === "fill").length}
                            </div>
                            <p className="text-xs text-muted-foreground">Fill Events</p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Events Table */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Fuel Events</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ScrollArea className="h-[500px]">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Event</TableHead>
                                  <TableHead>Timestamp</TableHead>
                                  <TableHead>Fuel Change</TableHead>
                                  <TableHead>Location</TableHead>
                                  <TableHead>Vehicle State</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {vehicleFuelEvents.map((event) => (
                                  <TableRow key={event.id}>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        {getEventIcon(event.event_type)}
                                        <span className="font-medium">
                                          {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">
                                      {new Date(event.timestamp).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex flex-col">
                                        <span
                                          className={`font-semibold ${
                                            event.event_type === "theft" ? "text-red-600" : "text-green-600"
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
                                      <div className="flex gap-1">
                                        <Badge
                                          variant={event.vehicle_state.ignition ? "default" : "secondary"}
                                          className="text-xs"
                                        >
                                          {event.vehicle_state.ignition ? "ON" : "OFF"}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs">
                                          {event.vehicle_state.speed} km/h
                                        </Badge>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                )}
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    )
  }

  // Default vehicles list view
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
            <div className="container mx-auto space-y-6">
              {/* Header */}
              <div className="flex items-center gap-4 mb-8">
                <SidebarTrigger />
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Vehicles
                  </h1>
                  <p className="text-muted-foreground mt-2">Manage and monitor your fleet vehicles</p>
                </div>
              </div>

              {/* Vehicles Table */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center w-full">
                    <CardTitle>Fleet Overview ({filteredVehicles.length} vehicles)</CardTitle>
                    <div className="flex items-center space-x-4">
                      <Search className="w-6 h-6 text-muted-foreground" />
                      <Input
                        placeholder="Search fleet..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-64"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-muted-foreground">Loading vehicles...</p>
                      </div>
                    </div>
                  ) : error ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center text-destructive">
                        <AlertTriangle className="h-10 w-10 mx-auto mb-2" />
                        <p>{error}</p>
                      </div>
                    </div>
                  ) : (
                    <ScrollArea className="h-[600px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Vehicle (Click to View)</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Driver</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>License Plate (Click to View)</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredVehicles.map((vehicle) => (
                            <TableRow key={vehicle.id} className="hover:bg-muted/50">
                              <TableCell>
                                <div>
                                  <button
                                    onClick={() => fetchVehicleDetails(vehicle)}
                                    className="font-semibold text-primary hover:underline cursor-pointer text-left"
                                  >
                                    {vehicle.name}
                                  </button>
                                  <div className="text-xs text-muted-foreground font-mono">{vehicle.imei}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {getVehicleTypeDisplay(vehicle.type)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{vehicle.driver_name}</div>
                                  <div className="text-xs text-muted-foreground">{vehicle.driver_phone}</div>
                                </div>
                              </TableCell>
                              <TableCell>{getStatusBadge(vehicle)}</TableCell>
                              <TableCell>
                                <button
                                  onClick={() => fetchVehicleDetails(vehicle)}
                                  className="font-mono text-primary hover:underline cursor-pointer"
                                >
                                  {vehicle.license_plate}
                                </button>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => fetchVehicleDetails(vehicle)}
                                  className="flex items-center gap-2"
                                >
                                  <Eye className="h-4 w-4" />
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

export default Vehicles
