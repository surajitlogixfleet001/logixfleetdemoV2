"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { ChartContainer } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import {
  Search,
  AlertTriangle,
  ArrowLeft,
  Car,
  Fuel,
  ShieldAlert,
  Eye,
  Download,
  Filter,
  Clock,
  CheckCircle,
  Activity,
  Loader2,
  Plus,
  User,
  RefreshCw,
} from "lucide-react"
import { AppSidebar } from "@/components/AppSidebar"
import { useToast } from "@/hooks/use-toast"
import { useCachedApi } from "@/hooks/use-cached-api"
import { dataCache } from "@/lib/cache"
import api from "@/lib/api"
import { Progress } from "@/components/ui/progress"

// Add this instead:
const useRouter = () => ({
  push: (url: string) => {
    window.location.href = url
  },
})

// Interfaces
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
  vehicle_license_plate: string
  total_fuel: number
  fuel_tanks: {
    tank1: number
    tank_2: number
  }
  ignition: boolean
  latitude: number
  longitude: number
  odometer: number
  speed: number
  metadata: {
    movement: boolean
    satellites: number
    external_voltage: number
    engine_hours: number
  }
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

const Vehicles = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleDetail | null>(null)
  const [vehicleFuelRecords, setVehicleFuelRecords] = useState<FuelRecord[]>([])
  const [loadingVehicleId, setLoadingVehicleId] = useState<number | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  // Use cached API for vehicles list
  const {
    data: vehiclesData,
    loading: vehiclesLoading,
    error: vehiclesError,
    refetch: refetchVehicles,
    clearCache: clearVehiclesCache,
  } = useCachedApi<{ fleet_overview: VehicleData[] }>("/vehicles/", "vehicles-list", {
    ttl: 10 * 60 * 1000, // 10 minutes cache
  })

  const vehicles = vehiclesData?.fleet_overview || []

  // Create Vehicle Dialog States
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newVehicle, setNewVehicle] = useState({
    name: "",
    imei: "",
    type: "car",
    license_plate: "",
    fuel_capacity: "",
    fuel_type: "diesel",
    fuel_tanks: "1",
    driver_name: "",
    driver_phone: "",
    notes: "",
  })

  // Filter states for fuel report
  const [selectedFuelRecords, setSelectedFuelRecords] = useState<string[]>([])

  // Filter states for fuel events
  const [selectedFuelEvents, setSelectedFuelEvents] = useState<string[]>([])

  // GPS Status States - Modified for seamless connection
  const [gpsStatus, setGpsStatus] = useState<"connecting" | "connected">("connecting")
  const [signalStrength, setSignalStrength] = useState(0)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [connectionProgress, setConnectionProgress] = useState(0)
  const [isDataReady, setIsDataReady] = useState(false)

  // Add state for date range filters
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // Navigation state to track where we came from
  const [navigationSource, setNavigationSource] = useState<string | null>(null)

  // Enhanced GPS Connection Simulation Effect - Seamless connection
  useEffect(() => {
    if (selectedVehicle && !isDataReady) {
      setGpsStatus("connecting")
      setSignalStrength(0)
      setConnectionProgress(0)

      const runSeamlessConnection = async () => {
        // Start data fetch immediately in background
        const dataFetchPromise = fetchVehicleData(selectedVehicle)

        // Simulate quick connection progress
        const progressSteps = [20, 40, 60, 80, 100]
        const signalSteps = [15, 35, 55, 75, 92]

        for (let i = 0; i < progressSteps.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 200))
          setConnectionProgress(progressSteps[i])
          setSignalStrength(signalSteps[i])
        }

        // Wait for data to be ready
        const apiSuccess = await dataFetchPromise

        if (apiSuccess) {
          setGpsStatus("connected")
          setLastUpdate(new Date())
          setIsDataReady(true)
        }
      }

      runSeamlessConnection()
    }
  }, [selectedVehicle, isDataReady])

  // Create Vehicle Handler with cache invalidation
  const handleCreateVehicle = async () => {
    try {
      // Validate required fields
      if (!newVehicle.name || !newVehicle.imei || !newVehicle.license_plate) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields (Name, IMEI, License Plate).",
          variant: "destructive",
        })
        return
      }

      // Prepare API payload
      const payload = {
        imei: newVehicle.imei,
        license_plate: newVehicle.license_plate,
        driver_name: newVehicle.driver_name || "Not Assigned",
        driver_phone: newVehicle.driver_phone || "",
        additional_info: {
          number_of_fuel_tanks: newVehicle.fuel_tanks || "1",
          fuel_type: newVehicle.fuel_type || "diesel",
          total_fuel_capacity: newVehicle.fuel_capacity ? `${newVehicle.fuel_capacity}L` : "80L",
        },
        type: newVehicle.type,
      }

      // Make API call
      const response = await api.post("/vehicles/", payload)

      // Clear vehicles cache to force refresh
      clearVehiclesCache()

      // Refetch vehicles data
      await refetchVehicles()

      // Reset form and close dialog
      setNewVehicle({
        name: "",
        imei: "",
        type: "car",
        license_plate: "",
        fuel_capacity: "",
        fuel_type: "diesel",
        fuel_tanks: "1",
        driver_name: "",
        driver_phone: "",
        notes: "",
      })
      setCreateDialogOpen(false)

      toast({
        title: "Vehicle Created",
        description: `${newVehicle.name} has been successfully added to your fleet.`,
      })
    } catch (error: any) {
      console.error("Error creating vehicle:", error)

      // Handle specific API errors
      let errorMessage = "Failed to create vehicle. Please try again."

      if (error.response?.data) {
        // Extract specific error messages from API response
        const apiErrors = error.response.data
        if (typeof apiErrors === "object") {
          const errorMessages = Object.entries(apiErrors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(", ") : messages}`)
            .join("\n")
          errorMessage = errorMessages || errorMessage
        } else if (typeof apiErrors === "string") {
          errorMessage = apiErrors
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  // Cached vehicle details fetching
  const fetchVehicleDetails = useCallback((vehicle: VehicleData) => {
    setLoadingVehicleId(vehicle.id)

    // Create a basic vehicle detail object for immediate display
    const basicVehicleDetail: VehicleDetail = {
      ...vehicle,
      fuel_capacity: "80", // Default value
      notes: "",
    }

    // Check cache for vehicle-specific data
    const cacheKey = `vehicle-events-${vehicle.license_plate}`
    const cachedEvents = dataCache.get<FuelEvent[]>(cacheKey)

    setSelectedVehicle(basicVehicleDetail)
    setVehicleFuelRecords([])
    setIsDataReady(false)
    setLoadingVehicleId(null)
  }, [])

  // Cached vehicle data fetching
  const fetchVehicleData = useCallback(async (vehicle: VehicleDetail) => {
    try {
      const vehicleCacheKey = `vehicle-details-${vehicle.imei}`
      const fuelRecordsCacheKey = `fuel-records-${vehicle.imei}`

      // Check cache first
      const cachedVehicleData = dataCache.get<VehicleDetail>(vehicleCacheKey)
      const cachedFuelRecords = dataCache.get<FuelRecord[]>(fuelRecordsCacheKey)

      if (cachedVehicleData && cachedFuelRecords) {
        setVehicleFuelRecords(cachedFuelRecords)
        setSelectedVehicle(cachedVehicleData)
        return true
      }

      // Fetch from API if not cached
      const [vehicleResponse, fuelRecordsResponse] = await Promise.all([
        api.get(`/vehicles/${vehicle.imei}/`),
        api.get(`/vehicles/${vehicle.imei}/fuel-records/`),
      ])

      const vehicleData = vehicleResponse.data
      const fuelRecordsData = fuelRecordsResponse.data

      // Handle the actual API response format
      let fuelRecords: FuelRecord[] = []
      if (Array.isArray(fuelRecordsData)) {
        fuelRecords = fuelRecordsData
      } else if (fuelRecordsData.fuel_records && Array.isArray(fuelRecordsData.fuel_records)) {
        fuelRecords = fuelRecordsData.fuel_records
      }

      // Cache the data
      dataCache.set(vehicleCacheKey, vehicleData, 5 * 60 * 1000) // 5 minutes cache
      dataCache.set(fuelRecordsCacheKey, fuelRecords, 3 * 60 * 1000) // 3 minutes cache for fuel records

      setVehicleFuelRecords(fuelRecords)
      setSelectedVehicle(vehicleData)

      return true // Success
    } catch (err: unknown) {
      console.error("Error fetching vehicle details:", err)
      return false // Failure
    }
  }, [])

  // Handle event card clicks to navigate to FuelTheft page with filters
  const handleEventCardClick = (eventType: string) => {
    if (!selectedVehicle) return

    // Store navigation context
    setNavigationSource("vehicle-details")

    // Navigate to FuelTheft page with pre-applied filters
    const params = new URLSearchParams({
      vehicle: selectedVehicle.license_plate,
      filter: eventType,
      scrollTo: "table",
    })

    router.push(`/dashboard/fuel-events?${params.toString()}`)
  }

  // Handle fuel records card click to scroll to fuel records table
  const handleFuelRecordsCardClick = () => {
    // Wait for component to render then scroll to fuel records table
    setTimeout(() => {
      const fuelRecordsElement = document.querySelector("[data-fuel-records-section]")
      if (fuelRecordsElement) {
        fuelRecordsElement.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }, 100)
  }

  // Handle back navigation
  const handleBackNavigation = () => {
    if (navigationSource === "/dashboard/fuel-events") {
      // If we came from fuel-theft, go back to vehicle details
      // This would be handled by the fuel-theft page
      return
    }

    // Default back to vehicles list
    setSelectedVehicle(null)
    setIsDataReady(false)
    setNavigationSource(null)
  }

  // Manual refresh function
  const handleManualRefresh = async () => {
    // Clear all cache
    dataCache.clear()

    // Refetch vehicles
    await refetchVehicles()

    // If a vehicle is selected, refetch its data too
    if (selectedVehicle) {
      setIsDataReady(false)
      await fetchVehicleData(selectedVehicle)
      setIsDataReady(true)
    }

    toast({
      title: "Data Refreshed",
      description: "All data has been refreshed from the server.",
    })
  }

  // Update getFilteredFuelRecords to use date range
  const getFilteredFuelRecords = () => {
    let filtered = vehicleFuelRecords

    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999) // Include the entire end date
      filtered = filtered.filter((record) => {
        const recordDate = new Date(record.timestamp)
        return recordDate >= start && recordDate <= end
      })
    }

    return filtered
  }

  // CSV Download functions
  const downloadAllFuelRecords = () => {
    const data = getFilteredFuelRecords().map((record) => ({
      "Date and Time": new Date(record.timestamp).toLocaleString(),
      Vehicle: record.vehicle_license_plate,
      "Total Fuel": `${record.total_fuel}L`,
      "Tank 1": `${record.fuel_tanks.tank1}L`,
      "Tank 2": `${record.fuel_tanks.tank_2}L`,
      Odometer: `${record.odometer} km`,
      Speed: `${record.speed} km/h`,
      Ignition: record.ignition ? "ON" : "OFF",
      Location: `${record.latitude}, ${record.longitude}`,
      Satellites: record.metadata.satellites,
      "Engine Hours": `${record.metadata.engine_hours}h`,
    }))

    if (data.length === 0) {
      toast({
        title: "No Data",
        description: "No fuel records available for download.",
        variant: "destructive",
      })
      return
    }

    const headers = Object.keys(data[0])
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
    a.download = "fuel_records.csv"
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: "Download Complete",
      description: `Downloaded ${data.length} fuel records.`,
    })
  }

  const downloadSelectedFuelRecords = () => {
    const headers = ["Date and Time", "Fuel Levels", "Odometer", "Speed", "Status"]
    const filtered = getFilteredFuelRecords().filter((record, index) =>
      selectedFuelRecords.includes(record.id || index.toString()),
    )
    const data = filtered.map((record) => ({
      "Date and Time": new Date(record.timestamp).toLocaleString(),
      "Fuel Levels": `${record.total_fuel}L`,
      Odometer: `${record.odometer} km`,
      Speed: `${record.speed} km/h`,
      Status: record.ignition ? "ON" : "OFF",
    }))

    if (data.length === 0) {
      toast({
        title: "No Data",
        description: "No records selected for download.",
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
    a.download = "selected_fuel_records.csv"
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: "Download Complete",
      description: `Downloaded ${data.length} selected fuel records.`,
    })
  }

  // Generate chart data for fuel levels
  const generateChartData = () => {
    if (!vehicleFuelRecords.length) {
      return [] // Return empty array instead of sample data
    }

    return vehicleFuelRecords.slice(-24).map((record) => ({
      time: new Date(record.timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      level: record.total_fuel,
      timestamp: record.timestamp,
    }))
  }

  const filteredVehicles = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return vehicles.filter((v) => {
      return (
        (v.name?.toLowerCase() || "").includes(term) ||
        (v.imei?.toLowerCase() || "").includes(term) ||
        (v.license_plate?.toLowerCase() || "").includes(term) ||
        (v.type?.toLowerCase() || "").includes(term) ||
        (v.driver_name?.toLowerCase() || "").includes(term) ||
        (v.driver_phone?.toLowerCase() || "").includes(term) ||
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
        <Badge variant="destructive" className="text-xs bg-red-600 hover:bg-red-700 text-white">
          INACTIVE
        </Badge>
      )
    return (
      <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-700 text-white">
        ACTIVE
      </Badge>
    )
  }

  // Enhanced event icon function like FuelTheft.tsx
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

  // GPS Status Panel Component - Simplified for seamless connection
  const GPSStatusPanel = () => {
    const isConnected = gpsStatus === "connected" && isDataReady

    return (
      <Card className="mb-6 bg-white border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {/* Left Section - Back Button & Vehicle Info */}
            <div className="flex items-center gap-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackNavigation}
                className="flex items-center gap-2 hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className={`relative p-3 rounded-full ${isConnected ? "bg-green-100" : "bg-blue-100"}`}>
                    {!isConnected && <div className="absolute inset-0 rounded-full bg-blue-200 animate-ping"></div>}
                    <Car className={`h-6 w-6 relative z-10 ${isConnected ? "text-green-600" : "text-blue-600"}`} />
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
                  <Activity
                    className={`h-5 w-5 ${
                      isConnected ? "text-green-600" : "text-blue-600"
                    } ${!isConnected ? "animate-pulse" : ""}`}
                  />
                </div>
                <div>
                  <div className="text-xs text-gray-500">GPS Signal</div>
                  <div className="text-sm font-semibold text-gray-900">{signalStrength}%</div>
                </div>
              </div>

              {/* Connection Status */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  {isConnected ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Activity className="h-5 w-5 text-blue-600 animate-pulse" />
                  )}
                </div>
                <div>
                  <div className="text-xs text-gray-500">Status</div>
                  <div className={`text-sm font-semibold ${isConnected ? "text-green-600" : "text-blue-600"}`}>
                    {isConnected ? "CONNECTED" : "CONNECTING"}
                  </div>
                </div>
              </div>

              {/* Last Update */}
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-600" />
                <div>
                  <div className="text-xs text-gray-500">Last Update</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {isConnected ? lastUpdate.toLocaleTimeString() : "--:--"}
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
                      signalStrength >= bar * 20 ? (isConnected ? "bg-green-500" : "bg-blue-500") : "bg-gray-300"
                    }`}
                    style={{ height: signalStrength >= bar * 20 ? `${bar * 4 + 8}px` : "8px" }}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? "bg-green-500 animate-pulse" : "bg-blue-500 animate-pulse"
                  }`}
                ></div>
                <span className="text-xs text-gray-600 font-medium">{isConnected ? "LIVE" : "SYNC"}</span>
              </div>
            </div>
          </div>

          {/* Progress Bar for Connection - Only show while connecting */}
          {!isConnected && (
            <div className="mt-4">
              <Progress value={connectionProgress} className="h-2" />
              <div className="text-center text-sm text-gray-600 mt-2">
                Establishing GPS connection... {connectionProgress}%
              </div>
            </div>
          )}

          {/* Final Status Message */}
          {isConnected && (
            <div className="mt-4 text-center">
              <div className="text-sm font-medium text-green-600">✓ GPS connection established successfully</div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Skeleton Loader Components
  const SkeletonCard = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
        <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="space-y-1">
            <div className="h-3 bg-gray-200 rounded w-full animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // If a vehicle is selected, show the unified detail view
  if (selectedVehicle) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <SidebarInset className="flex-1">
            <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
              <div className="max-w-7xl mx-auto space-y-6">
                {/* GPS Status Panel */}
                <GPSStatusPanel />

                {/* Vehicle Overview Header */}
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Here is a report of your vehicle</h2>
                  <p className="text-muted-foreground">Complete overview including fuel events, charts, and records</p>
                </div>

                {/* Vehicle Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {!isDataReady ? (
                    <>
                      <SkeletonCard />
                      <SkeletonCard />
                      <SkeletonCard />
                    </>
                  ) : (
                    <>
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
                          <User className="h-4 w-4 text-muted-foreground" />
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
                              <div>Current: {vehicleFuelRecords[0]?.total_fuel || 0}L</div>
                              <div>Records: {vehicleFuelRecords.length}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>

                {/* Quick Stats - Clickable Event Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {!isDataReady ? (
                    <>
                      <SkeletonCard />
                      <SkeletonCard />
                      <SkeletonCard />
                    </>
                  ) : (
                    <>
                      <Card
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleEventCardClick("theft")}
                      >
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold text-red-600">0</div>
                          <p className="text-xs text-muted-foreground">Theft Events</p>
                        </CardContent>
                      </Card>
                      <Card
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleEventCardClick("fill")}
                      >
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold text-green-600">0</div>
                          <p className="text-xs text-muted-foreground">Fill Events</p>
                        </CardContent>
                      </Card>
                      <Card
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={handleFuelRecordsCardClick}
                      >
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold">{vehicleFuelRecords.length}</div>
                          <p className="text-xs text-muted-foreground">Fuel Records</p>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>

                {/* Fuel Level Chart */}
                {isDataReady && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Fuel Levels Over Time</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        This chart shows how much fuel is in your vehicle tank over time. The red line indicates when
                        fuel is running low (50L warning).
                      </p>
                    </CardHeader>
                    <CardContent>
                      {chartData.length > 0 ? (
                        <ChartContainer
                          className="h-[400px] w-full"
                          config={{
                            level: { label: "Fuel Level", color: "#2563eb" },
                          }}
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis
                                dataKey="time"
                                tick={{ fontSize: 12, fill: "#6b7280" }}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                                axisLine={{ stroke: "#d1d5db" }}
                                tickLine={{ stroke: "#d1d5db" }}
                              />
                              <YAxis
                                tick={{ fontSize: 12, fill: "#6b7280" }}
                                domain={[0, 100]}
                                axisLine={{ stroke: "#d1d5db" }}
                                tickLine={{ stroke: "#d1d5db" }}
                                label={{
                                  value: "Fuel Amount (Liters)",
                                  angle: -90,
                                  position: "insideLeft",
                                  style: { textAnchor: "middle", fontSize: "12px", fill: "#6b7280" },
                                }}
                              />
                              <Tooltip
                                content={({ active, payload, label }) => {
                                  if (active && payload && payload.length) {
                                    return (
                                      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                                        <p className="text-sm font-medium text-gray-900">{label}</p>
                                        <p className="text-sm text-blue-600">
                                          Fuel Level: <span className="font-semibold">{payload[0].value}</span>
                                        </p>
                                      </div>
                                    )
                                  }
                                  return null
                                }}
                              />
                              <ReferenceLine
                                y={50}
                                stroke="#ef4444"
                                strokeDasharray="5 5"
                                label={{ value: "Low Fuel", position: "top", fill: "#ef4444", fontSize: 12 }}
                              />
                              <Line
                                dataKey="level"
                                type="monotone"
                                stroke="#2563eb"
                                strokeWidth={2}
                                dot={{
                                  fill: "#2563eb",
                                  strokeWidth: 2,
                                  r: 4,
                                  stroke: "#ffffff",
                                }}
                                activeDot={{
                                  r: 6,
                                  stroke: "#2563eb",
                                  strokeWidth: 2,
                                  fill: "#ffffff",
                                }}
                                connectNulls={false}
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
                )}

                {/* Fuel Events Table */}
                {isDataReady && (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Recent Fuel Events</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Event</TableHead>
                              <TableHead>Date and Time</TableHead>
                              <TableHead>Fuel Change</TableHead>
                              <TableHead>Location</TableHead>
                              <TableHead>Vehicle State</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="flex flex-col">
                                    <span className="font-medium">No Events</span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-xs">No Events</TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className={`font-semibold`}>No Events</span>
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                <div className="flex items-center gap-1">No Events</div>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">No Events</div>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}

                {/* Fuel Records Table */}
                {isDataReady && (
                  <Card data-fuel-records-section>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Recent Fuel Records</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Filters */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            Filters
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex gap-4 items-center">
                            <div className="flex gap-4 items-center">
                              <div className="flex items-center gap-2">
                                <Label className="text-sm font-medium">Start Date:</Label>
                                <Input
                                  type="date"
                                  value={startDate}
                                  onChange={(e) => setStartDate(e.target.value)}
                                  className="w-40"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <Label className="text-sm font-medium">End Date:</Label>
                                <Input
                                  type="date"
                                  value={endDate}
                                  onChange={(e) => setEndDate(e.target.value)}
                                  className="w-40"
                                />
                              </div>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setStartDate("")
                                  setEndDate("")
                                  setSelectedFuelRecords([])
                                }}
                              >
                                Clear
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <ScrollArea className="h-[400px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">
                                <Checkbox
                                  checked={
                                    selectedFuelRecords.length === getFilteredFuelRecords().length &&
                                    getFilteredFuelRecords().length > 0
                                  }
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedFuelRecords(
                                        getFilteredFuelRecords().map((r, index) => r.timestamp || index.toString()),
                                      )
                                    } else {
                                      setSelectedFuelRecords([])
                                    }
                                  }}
                                />
                              </TableHead>
                              <TableHead>Date and Time</TableHead>
                              <TableHead>Fuel Levels</TableHead>
                              <TableHead>Odometer</TableHead>
                              <TableHead>Speed</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {getFilteredFuelRecords()
                              .slice(0, 20)
                              .map((record, index) => (
                                <TableRow key={record.timestamp || index}>
                                  <TableCell>
                                    <Checkbox
                                      checked={selectedFuelRecords.includes(record.timestamp || index.toString())}
                                      onCheckedChange={(checked) => {
                                        const recordId = record.timestamp || index.toString()
                                        if (checked) {
                                          setSelectedFuelRecords([...selectedFuelRecords, recordId])
                                        } else {
                                          setSelectedFuelRecords(selectedFuelRecords.filter((id) => id !== recordId))
                                        }
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell className="font-mono text-xs">
                                    {new Date(record.timestamp).toLocaleString()}
                                  </TableCell>
                                  <TableCell className={record.total_fuel <= 15 ? "text-red-600 font-semibold" : ""}>
                                    {record.total_fuel}L
                                  </TableCell>
                                  <TableCell>{record.odometer} km</TableCell>
                                  <TableCell>{record.speed} km/h</TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={record.ignition ? "default" : "secondary"}
                                      className={`text-xs ${record.ignition ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}`}
                                    >
                                      {record.ignition ? "ON" : "OFF"}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                      <div className="mt-4 flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={downloadAllFuelRecords}
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download All
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={downloadSelectedFuelRecords}
                          disabled={selectedFuelRecords.length === 0}
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download Selected ({selectedFuelRecords.length})
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
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
        <SidebarInset className="flex-1">
          <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <SidebarTrigger />
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                      Vehicles
                    </h1>
                    <p className="text-muted-foreground mt-2">Manage and monitor your fleet vehicles</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Manual Refresh Button */}
                  <Button variant="outline" size="sm" onClick={handleManualRefresh} className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>

                  {/* Create Vehicle Button */}
                  <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Create Vehicle
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Create New Vehicle</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="vehicle-name">Vehicle Name *</Label>
                            <Input
                              id="vehicle-name"
                              placeholder="e.g., Fleet Truck 001"
                              value={newVehicle.name}
                              onChange={(e) => setNewVehicle((prev) => ({ ...prev, name: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="vehicle-imei">IMEI *</Label>
                            <Input
                              id="vehicle-imei"
                              placeholder="e.g., 123456789012345"
                              value={newVehicle.imei}
                              onChange={(e) => setNewVehicle((prev) => ({ ...prev, imei: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="vehicle-type">Vehicle Type</Label>
                            <Select
                              value={newVehicle.type}
                              onValueChange={(value) => setNewVehicle((prev) => ({ ...prev, type: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="car">Car</SelectItem>
                                <SelectItem value="truck">Truck</SelectItem>
                                <SelectItem value="bus">Bus</SelectItem>
                                <SelectItem value="motorcycle">Motorcycle</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="license-plate">License Plate *</Label>
                            <Input
                              id="license-plate"
                              placeholder="e.g., KDA381X"
                              value={newVehicle.license_plate}
                              onChange={(e) => setNewVehicle((prev) => ({ ...prev, license_plate: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="fuel-capacity">Fuel Capacity (Liters)</Label>
                            <Input
                              id="fuel-capacity"
                              type="number"
                              placeholder="e.g., 80"
                              value={newVehicle.fuel_capacity}
                              onChange={(e) => setNewVehicle((prev) => ({ ...prev, fuel_capacity: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="fuel-type">Fuel Type</Label>
                            <Select
                              value={newVehicle.fuel_type || "diesel"}
                              onValueChange={(value) => setNewVehicle((prev) => ({ ...prev, fuel_type: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="diesel">Diesel</SelectItem>
                                <SelectItem value="petrol">Petrol</SelectItem>
                                <SelectItem value="electric">Electric</SelectItem>
                                <SelectItem value="hybrid">Hybrid</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="fuel-tanks">Number of Fuel Tanks</Label>
                            <Input
                              id="fuel-tanks"
                              type="number"
                              placeholder="e.g., 1"
                              value={newVehicle.fuel_tanks || "1"}
                              onChange={(e) => setNewVehicle((prev) => ({ ...prev, fuel_tanks: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="driver-name">Driver Name</Label>
                            <Input
                              id="driver-name"
                              placeholder="e.g., John Doe"
                              value={newVehicle.driver_name}
                              onChange={(e) => setNewVehicle((prev) => ({ ...prev, driver_name: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="driver-phone">Driver Phone</Label>
                            <Input
                              id="driver-phone"
                              placeholder="e.g., +1234567890"
                              value={newVehicle.driver_phone}
                              onChange={(e) => setNewVehicle((prev) => ({ ...prev, driver_phone: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="notes">Notes</Label>
                          <Textarea
                            id="notes"
                            placeholder="Additional notes about the vehicle..."
                            value={newVehicle.notes}
                            onChange={(e) => setNewVehicle((prev) => ({ ...prev, notes: e.target.value }))}
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                          <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleCreateVehicle}>Create Vehicle</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
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
                  {vehiclesLoading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-muted-foreground">Loading vehicles...</p>
                      </div>
                    </div>
                  ) : vehiclesError ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center text-destructive">
                        <AlertTriangle className="h-10 w-10 mx-auto mb-2" />
                        <p>{vehiclesError}</p>
                        <Button variant="outline" onClick={handleManualRefresh} className="mt-4">
                          Try Again
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <ScrollArea className="h-[600px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                          <TableHead>License Plate (Click to View)</TableHead>
                            
                            <TableHead>Type</TableHead>
                            <TableHead>Driver</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Imei</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredVehicles.map((vehicle) => (
                            <TableRow key={vehicle.id} className="hover:bg-muted/50">
                            <TableCell>
                                <button
                                  onClick={() => fetchVehicleDetails(vehicle)}
                                  className="font-mono text-primary hover:underline cursor-pointer"
                                  disabled={loadingVehicleId === vehicle.id}
                                >
                                  {vehicle.license_plate}
                                </button>
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
                                <div>
                                  <button
                                    onClick={() => fetchVehicleDetails(vehicle)}
                                    className="font-semibold text-primary hover:underline cursor-pointer text-left"
                                    disabled={loadingVehicleId === vehicle.id}
                                  >
                                    {vehicle.name}
                                  </button>
                                  <div className="text-xs text-muted-foreground font-mono">{vehicle.imei}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => fetchVehicleDetails(vehicle)}
                                  disabled={loadingVehicleId === vehicle.id}
                                  className="flex items-center gap-2"
                                >
                                  {loadingVehicleId === vehicle.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
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
