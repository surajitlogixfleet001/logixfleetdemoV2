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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
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
import {
  Search,
  AlertTriangle,
  ArrowLeft,
  Car,
  Fuel,
  ShieldAlert,
  Eye,
  MapPin,
  Download,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  Loader2,
} from "lucide-react"
import { AppSidebar } from "@/components/AppSidebar"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/api"
import { Progress } from "@/components/ui/progress"

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
  id: string
  event_type: string
  timestamp: string
  fuel_liters: number
  odometer: number
  latitude: number
  longitude: number
  speed: number
  ignition: boolean
  movement: boolean
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
  fill_details?: {
    time_since_last_reading_minutes: number
    previous_timestamp: string | null
  }
  theft_details?: {
    time_window_minutes: number
    previous_timestamp: string
  }
}

// Enhanced mock data for fuel events - about 10 events with random theft and fill
const mockFuelEvents: FuelEvent[] = [
  {
    id: "evt_001",
    event_type: "fill",
    vehicle: { license_plate: "KDA381X", name: "Vehicle 1" },
    timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
    location: { latitude: -1.2921, longitude: 36.8219 },
    fuel_change: { amount_liters: 45.5, before_liters: 15.2, after_liters: 60.7 },
    vehicle_state: { speed: 0, ignition: false, stationary: true },
    fill_details: { time_since_last_reading_minutes: 120, previous_timestamp: null },
  },
  {
    id: "evt_002",
    event_type: "theft",
    vehicle: { license_plate: "KDA381X", name: "Vehicle 1" },
    timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    location: { latitude: -1.2845, longitude: 36.8156 },
    fuel_change: { amount_liters: -12.3, before_liters: 48.5, after_liters: 36.2 },
    vehicle_state: { speed: 0, ignition: false, stationary: true },
    theft_details: {
      time_window_minutes: 30,
      previous_timestamp: new Date(Date.now() - 21 * 60 * 60 * 1000).toISOString(),
    },
  },
  {
    id: "evt_003",
    event_type: "fill",
    vehicle: { license_plate: "KDE366F", name: "Vehicle 2" },
    timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    location: { latitude: -1.2756, longitude: 36.8089 },
    fuel_change: { amount_liters: 38.2, before_liters: 22.1, after_liters: 60.3 },
    vehicle_state: { speed: 0, ignition: false, stationary: true },
    fill_details: { time_since_last_reading_minutes: 180, previous_timestamp: null },
  },
  {
    id: "evt_004",
    event_type: "theft",
    vehicle: { license_plate: "KDE386N", name: "Vehicle 3" },
    timestamp: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
    location: { latitude: -1.2934, longitude: 36.8267 },
    fuel_change: { amount_liters: -8.7, before_liters: 55.4, after_liters: 46.7 },
    vehicle_state: { speed: 0, ignition: false, stationary: true },
    theft_details: {
      time_window_minutes: 45,
      previous_timestamp: new Date(Date.now() - 17 * 60 * 60 * 1000).toISOString(),
    },
  },
  {
    id: "evt_005",
    event_type: "fill",
    vehicle: { license_plate: "KDA381X", name: "Vehicle 1" },
    timestamp: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
    location: { latitude: -1.2678, longitude: 36.8012 },
    fuel_change: { amount_liters: 42.8, before_liters: 18.9, after_liters: 61.7 },
    vehicle_state: { speed: 0, ignition: false, stationary: true },
    fill_details: { time_since_last_reading_minutes: 90, previous_timestamp: null },
  },
  {
    id: "evt_006",
    event_type: "theft",
    vehicle: { license_plate: "KDE366F", name: "Vehicle 2" },
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    location: { latitude: -1.2845, longitude: 36.8156 },
    fuel_change: { amount_liters: -15.2, before_liters: 45.3, after_liters: 30.1 },
    vehicle_state: { speed: 0, ignition: false, stationary: true },
    theft_details: {
      time_window_minutes: 25,
      previous_timestamp: new Date(Date.now() - 13 * 60 * 60 * 1000).toISOString(),
    },
  },
  {
    id: "evt_007",
    event_type: "fill",
    vehicle: { license_plate: "KDE386N", name: "Vehicle 3" },
    timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    location: { latitude: -1.2567, longitude: 36.789 },
    fuel_change: { amount_liters: 50.3, before_liters: 25.4, after_liters: 75.7 },
    vehicle_state: { speed: 0, ignition: false, stationary: true },
    fill_details: { time_since_last_reading_minutes: 150, previous_timestamp: null },
  },
  {
    id: "evt_008",
    event_type: "theft",
    vehicle: { license_plate: "KDA381X", name: "Vehicle 1" },
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    location: { latitude: -1.2934, longitude: 36.8123 },
    fuel_change: { amount_liters: -18.5, before_liters: 52.2, after_liters: 33.7 },
    vehicle_state: { speed: 0, ignition: false, stationary: true },
    theft_details: {
      time_window_minutes: 35,
      previous_timestamp: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
    },
  },
  {
    id: "evt_009",
    event_type: "fill",
    vehicle: { license_plate: "KDE366F", name: "Vehicle 2" },
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    location: { latitude: -1.2456, longitude: 36.8345 },
    fuel_change: { amount_liters: 35.8, before_liters: 20.1, after_liters: 55.9 },
    vehicle_state: { speed: 0, ignition: false, stationary: true },
    fill_details: { time_since_last_reading_minutes: 200, previous_timestamp: null },
  },
  {
    id: "evt_010",
    event_type: "theft",
    vehicle: { license_plate: "KDE386N", name: "Vehicle 3" },
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    location: { latitude: -1.2789, longitude: 36.8567 },
    fuel_change: { amount_liters: -22.1, before_liters: 68.3, after_liters: 46.2 },
    vehicle_state: { speed: 0, ignition: false, stationary: true },
    theft_details: {
      time_window_minutes: 40,
      previous_timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
  },
]

const Vehicles = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [vehicles, setVehicles] = useState<VehicleData[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleDetail | null>(null)
  const [vehicleFuelRecords, setVehicleFuelRecords] = useState<FuelRecord[]>([])
  const [vehicleFuelEvents, setVehicleFuelEvents] = useState<FuelEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingVehicleId, setLoadingVehicleId] = useState<number | null>(null) // Track specific vehicle loading
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const { toast } = useToast()

  // Filter states for fuel report
  const [fuelReportFilter, setFuelReportFilter] = useState("all")
  const [selectedFuelRecords, setSelectedFuelRecords] = useState<string[]>([])
  const [fuelReportDateFilter, setFuelReportDateFilter] = useState("all")

  // Filter states for fuel events
  const [fuelEventsFilter, setFuelEventsFilter] = useState("all")
  const [selectedFuelEvents, setSelectedFuelEvents] = useState<string[]>([])
  const [fuelEventsDateFilter, setFuelEventsDateFilter] = useState("all")

  // GPS Status States
  const [gpsStatus, setGpsStatus] = useState<"connecting" | "connected" | "disconnected" | "completed">("connecting")
  const [signalStrength, setSignalStrength] = useState(0)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [connectionProgress, setConnectionProgress] = useState(0)
  const [isSimulationComplete, setIsSimulationComplete] = useState(false)

  // Add state for date range filters
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

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

  // GPS Connection Simulation Effect
  useEffect(() => {
    if (selectedVehicle && !isSimulationComplete) {
      setGpsStatus("connecting")
      setSignalStrength(0)
      setConnectionProgress(0)
      setIsSimulationComplete(false)

      const runConnectionAndDataFetch = async () => {
        // Phase 1: Initializing (20%)
        await new Promise((resolve) => setTimeout(resolve, 500))
        setConnectionProgress(20)
        setSignalStrength(15)

        // Phase 2: Searching signal (40%)
        await new Promise((resolve) => setTimeout(resolve, 600))
        setConnectionProgress(40)
        setSignalStrength(35)

        // Phase 3: Acquiring signal (60%) - Start API calls here
        const dataFetchPromise = fetchVehicleData(selectedVehicle)
        await new Promise((resolve) => setTimeout(resolve, 700))
        setConnectionProgress(60)
        setSignalStrength(55)

        // Phase 4: Establishing connection (80%)
        await new Promise((resolve) => setTimeout(resolve, 500))
        setConnectionProgress(80)
        setSignalStrength(75)

        // Phase 5: Final connection (100%) - Wait for API calls to complete
        const apiSuccess = await dataFetchPromise
        await new Promise((resolve) => setTimeout(resolve, 400))
        setConnectionProgress(100)

        if (apiSuccess) {
          setSignalStrength(92)
          setGpsStatus("connected")
          setLastUpdate(new Date())
        } else {
          setSignalStrength(0)
          setGpsStatus("disconnected")
        }

        setGpsStatus("completed")
        setIsSimulationComplete(true)
      }

      runConnectionAndDataFetch()
    }
  }, [selectedVehicle, isSimulationComplete])

  // Simplified fetchVehicleDetails - just redirect immediately
  const fetchVehicleDetails = (vehicle: VehicleData) => {
    setLoadingVehicleId(vehicle.id)

    // Create a basic vehicle detail object for immediate display
    const basicVehicleDetail: VehicleDetail = {
      ...vehicle,
      fuel_capacity: "80", // Default value
      notes: "",
    }

    // Immediately set mock fuel events data for the selected vehicle
    let vehicleMockEvents = mockFuelEvents.filter((e) => e.vehicle.license_plate === vehicle.license_plate)

    // If no mock events exist for this vehicle, create some generic ones
    if (vehicleMockEvents.length === 0) {
      vehicleMockEvents = [
        {
          id: `mock_${vehicle.license_plate}_001`,
          event_type: "fill",
          vehicle: { license_plate: vehicle.license_plate, name: vehicle.name },
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          location: { latitude: -1.2921, longitude: 36.8219 },
          fuel_change: { amount_liters: 45.5, before_liters: 15.2, after_liters: 60.7 },
          vehicle_state: { speed: 0, ignition: false, stationary: true },
        },
        {
          id: `mock_${vehicle.license_plate}_002`,
          event_type: "theft",
          vehicle: { license_plate: vehicle.license_plate, name: vehicle.name },
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          location: { latitude: -1.2845, longitude: 36.8156 },
          fuel_change: { amount_liters: -12.3, before_liters: 48.5, after_liters: 36.2 },
          vehicle_state: { speed: 0, ignition: false, stationary: true },
        },
      ]
    }

    console.log(`Setting immediate mock events for ${vehicle.license_plate}:`, vehicleMockEvents.length)

    setSelectedVehicle(basicVehicleDetail)
    setVehicleFuelRecords([])
    setVehicleFuelEvents(vehicleMockEvents) // Set mock events immediately
    setIsSimulationComplete(false)
    setActiveTab("overview")
    setLoadingVehicleId(null)
  }

  // New function to fetch data after being on details page
  const fetchVehicleData = async (vehicle: VehicleDetail) => {
    try {
      const [vehicleResponse, fuelRecordsResponse] = await Promise.all([
        api.get(`/vehicles/${vehicle.imei}/`),
        api.get(`/vehicles/${vehicle.imei}/fuel-records/`),
      ])

      const vehicleData = vehicleResponse.data
      const fuelRecords = fuelRecordsResponse.data.fuel_records || []

      // Keep using mock fuel events data - don't fetch from API
      console.log("Keeping mock fuel events data, only updating fuel records from API")

      setVehicleFuelRecords(fuelRecords)
      // Don't update fuel events - keep the mock data that was set immediately
      setSelectedVehicle(vehicleData)

      return true // Success
    } catch (err: any) {
      console.error("Error fetching vehicle details:", err)
      toast({
        title: "Error",
        description: "Failed to fetch vehicle details. Please try again.",
        variant: "destructive",
      })
      return false // Failure
    }
  }

  // Simplify fetchVehicleDetails to remove API calls
  // const fetchVehicleDetails = async (vehicle: VehicleData) => {
  //   try {
  //     setLoadingVehicleId(vehicle.id)
  //     setSelectedVehicle(null)
  //     setIsSimulationComplete(false)
  //     setVehicleFuelRecords([])
  //     setVehicleFuelEvents([])

  //     // Just show loading for 2 seconds instead of API calls
  //     await new Promise((resolve) => setTimeout(resolve, 2000))

  //     // Use mock data instead of API data
  //     const mockVehicleDetail: VehicleDetail = {
  //       ...vehicle,
  //       fuel_capacity: "80",
  //       notes: "Mock vehicle data",
  //     }

  //     // Use existing mock fuel records and events
  //     const mockFuelRecords: FuelRecord[] = [
  //       {
  //         id: "rec_001",
  //         event_type: "reading",
  //         timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  //         fuel_liters: 45.5,
  //         odometer: 15420,
  //         latitude: -1.2921,
  //         longitude: 36.8219,
  //         speed: 0,
  //         ignition: false,
  //         movement: false,
  //         external_voltage: 12.4,
  //         engine_hours: 1250,
  //       },
  //       // Add more mock records...
  //     ]

  //     const fuelEventsData = mockFuelEvents.filter((e) => e.vehicle.license_plate === vehicle.license_plate)

  //     setVehicleFuelRecords(mockFuelRecords)
  //     setVehicleFuelEvents(fuelEventsData)
  //     setSelectedVehicle(mockVehicleDetail)
  //     setActiveTab("overview")
  //   } catch (err: any) {
  //     console.error("Error loading vehicle details:", err)
  //     toast({
  //       title: "Error",
  //       description: "Failed to load vehicle details. Please try again.",
  //       variant: "destructive",
  //     })
  //   } finally {
  //     setLoadingVehicleId(null)
  //   }
  // }

  // Handle event card clicks to filter tabs
  const handleEventCardClick = (eventType: string) => {
    setActiveTab("fuel-events")
    if (eventType === "theft") {
      setFuelEventsFilter("theft")
    } else if (eventType === "fill") {
      setFuelEventsFilter("fill")
    } else {
      setFuelEventsFilter("all")
    }

    // Scroll to events table after tab change
    setTimeout(() => {
      const eventsTable = document.querySelector("[data-events-table]")
      if (eventsTable) {
        eventsTable.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }, 100)
  }

  // Add click handler for fuel records card in overview
  const handleFuelRecordsClick = () => {
    setActiveTab("fuel-report")
    // Scroll to records section after tab change
    setTimeout(() => {
      const recordsSection = document.querySelector("[data-records-section]")
      if (recordsSection) {
        recordsSection.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }, 100)
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

  const getFilteredFuelEvents = () => {
    let filtered = vehicleFuelEvents

    if (fuelEventsFilter !== "all") {
      filtered = filtered.filter((event) => event.event_type === fuelEventsFilter)
    }

    if (fuelEventsDateFilter !== "all") {
      const days = Number.parseInt(fuelEventsDateFilter)
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      filtered = filtered.filter((event) => new Date(event.timestamp) >= cutoffDate)
    }

    return filtered
  }

  // CSV Download functions
  const downloadCSV = (data: any[], filename: string, headers: string[]) => {
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header]
            return typeof value === "string" && value.includes(",") ? `"${value}"` : value
          })
          .join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
    toast({
      title: "Download Complete",
      description: `Downloaded ${data.length} fuel records.`,
    })
  }

  const downloadAllFuelRecords = () => {
    const data = getFilteredFuelRecords().map((record) => ({
      "Date and Time": new Date(record.timestamp).toLocaleString(),
      "Fuel Levels": `${record.fuel_liters}L`,
      Odometer: `${record.odometer} km`,
      Speed: `${record.speed} km/h`,
      Status: record.ignition ? "ON" : "OFF",
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
      "Fuel Levels": `${record.fuel_liters}L`,
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

    downloadCSV(data, "selected_fuel_records.csv", headers)
    toast({
      title: "Download Complete",
      description: `Downloaded ${data.length} selected fuel records.`,
    })
  }

  const downloadAllFuelEvents = () => {
    const headers = ["Event", "Date and Time", "Fuel Change", "Location", "Vehicle State"]
    const data = getFilteredFuelEvents().map((event) => ({
      Event: event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1),
      "Date and Time": new Date(event.timestamp).toLocaleString(),
      "Fuel Change": `${event.event_type === "theft" ? "-" : "+"}${Math.abs(event.fuel_change.amount_liters)}L`,
      Location: `${event.location.latitude.toFixed(4)}, ${event.location.longitude.toFixed(4)}`,
      "Vehicle State": `${event.vehicle_state.ignition ? "ON" : "OFF"}, ${event.vehicle_state.speed} km/h`,
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
    a.download = "fuel_events.csv"
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: "Download Complete",
      description: `Downloaded ${data.length} fuel events.`,
    })
  }

  const downloadSelectedFuelEvents = () => {
    const headers = ["Event", "Date and Time", "Fuel Change", "Location", "Vehicle State"]
    const filtered = getFilteredFuelEvents().filter((event) => selectedFuelEvents.includes(event.id))
    const data = filtered.map((event) => ({
      event: event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1),
      "Date and Time": new Date(event.timestamp).toLocaleString(),
      "Fuel Change": `${event.event_type === "theft" ? "-" : "+"}${Math.abs(event.fuel_change.amount_liters)}L`,
      Location: `${event.location.latitude.toFixed(4)}, ${event.location.longitude.toFixed(4)}`,
      "Vehicle State": `${event.vehicle_state.ignition ? "ON" : "OFF"}, ${event.vehicle_state.speed} km/h`,
    }))
    downloadCSV(data, "selected_fuel_events.csv", headers)
  }

  // Generate chart data for fuel levels
  const generateChartData = () => {
    if (!vehicleFuelRecords.length) return []

    return vehicleFuelRecords.slice(-24).map((record) => ({
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

  // Get final connection status
  const getFinalConnectionStatus = () => {
    if (!isSimulationComplete) return null
    const hasRecentData = vehicleFuelRecords.length > 0
    const isVehicleActive = selectedVehicle?.is_active
    return hasRecentData && isVehicleActive && signalStrength > 50
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedVehicle(null)}
                className="flex items-center gap-2 hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-4">
                <div className="relative">
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
                  <Activity
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

  const SkeletonTable = () => (
    <Card>
      <CardHeader>
        <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex space-x-4">
              <div className="h-4 bg-gray-200 rounded w-4 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  // If a vehicle is selected, show the detail view
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

                {/* Vehicle Details & Analytics Header */}
                <div className="text-center mb-6">
                  <p className="text-muted-foreground">Vehicle Details & Analytics</p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="fuel-report">Fuel Report</TabsTrigger>
                    <TabsTrigger value="fuel-events">Fuel Events</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-6">
                    {/* Vehicle Info Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {!isSimulationComplete ? (
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
                        </>
                      )}
                    </div>

                    {/* Quick Stats - Clickable Event Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {!isSimulationComplete ? (
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
                              <div className="text-2xl font-bold text-red-600">
                                {vehicleFuelEvents.filter((e) => e.event_type === "theft").length}
                              </div>
                              <p className="text-xs text-muted-foreground">Theft Events</p>
                            </CardContent>
                          </Card>
                          <Card
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => handleEventCardClick("fill")}
                          >
                            <CardContent className="pt-6">
                              <div className="text-2xl font-bold text-green-600">
                                {vehicleFuelEvents.filter((e) => e.event_type === "fill").length}
                              </div>
                              <p className="text-xs text-muted-foreground">Fill Events</p>
                            </CardContent>
                          </Card>
                          <Card
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={handleFuelRecordsClick}
                          >
                            <CardContent className="pt-6">
                              <div className="text-2xl font-bold">{vehicleFuelRecords.length}</div>
                              <p className="text-xs text-muted-foreground">Fuel Records (Click to view)</p>
                            </CardContent>
                          </Card>
                        </>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="fuel-report" className="space-y-6">
                    {!isSimulationComplete ? (
                      <>
                        <SkeletonCard />
                        <SkeletonTable />
                      </>
                    ) : (
                      <>
                        {/* Fuel Level Chart */}
                        <Card>
                          <CardHeader>
                            <CardTitle>Fuel Levels Over Time</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              This chart shows how much fuel is in your vehicle tank over time. The red line indicates
                              when fuel is running low (50L warning).
                            </p>
                          </CardHeader>
                          <CardContent>
                            {chartData.length > 0 ? (
                              <ChartContainer
                                className="h-[400px] w-full"
                                config={{
                                  level: { label: "Fuel Levels", color: "hsl(var(--chart-1))" },
                                }}
                              >
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="0 0" className="stroke-muted" />
                                    <XAxis
                                      dataKey="time"
                                      tick={{ fontSize: 11 }}
                                      angle={-45}
                                      textAnchor="end"
                                      height={80}
                                      axisLine={false}
                                      tickLine={false}
                                      label={{
                                        value: "Time Period",
                                        position: "insideBottom",
                                        offset: -10,
                                        style: { textAnchor: "middle", fontSize: "14px", fontWeight: "bold" },
                                      }}
                                    />
                                    <YAxis
                                      tick={{ fontSize: 12 }}
                                      domain={[0, Math.max(...vehicleFuelRecords.map((r) => r.fuel_liters), 100)]}
                                      label={{
                                        value: "Fuel Amount (Liters)",
                                        angle: -90,
                                        position: "insideLeft",
                                        style: { textAnchor: "middle", fontSize: "14px", fontWeight: "bold" },
                                      }}
                                    />
                                    <Tooltip />
                                    <Legend />
                                    <ReferenceLine y={50} stroke="red" strokeDasharray="5 5" label="Low Fuel" />
                                    <Line
                                      type="monotone"
                                      dataKey="level"
                                      stroke="#2563eb"
                                      strokeWidth={2}
                                      name="Fuel Level"
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

                        {/* Fuel Records Table with Filters moved here */}
                        <Card data-records-section>
                          <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Recent Fuel Records</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Filters moved here - below the chart */}
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
                                              getFilteredFuelRecords().map((r, index) => r.id || index.toString()),
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
                                      <TableRow key={record.id || index}>
                                        <TableCell>
                                          <Checkbox
                                            checked={selectedFuelRecords.includes(record.id || index.toString())}
                                            onCheckedChange={(checked) => {
                                              const recordId = record.id || index.toString()
                                              if (checked) {
                                                setSelectedFuelRecords([...selectedFuelRecords, recordId])
                                              } else {
                                                setSelectedFuelRecords(
                                                  selectedFuelRecords.filter((id) => id !== recordId),
                                                )
                                              }
                                            }}
                                          />
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                          {new Date(record.timestamp).toLocaleString()}
                                        </TableCell>
                                        <TableCell
                                          className={record.fuel_liters <= 15 ? "text-red-600 font-semibold" : ""}
                                        >
                                          {record.fuel_liters}L
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
                      </>
                    )}
                  </TabsContent>

                  <TabsContent value="fuel-events" className="space-y-6">
                    {!isSimulationComplete ? (
                      <>
                        <SkeletonCard />
                        <SkeletonTable />
                      </>
                    ) : (
                      <>
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
                              <div className="flex items-center gap-2">
                                <Label className="text-sm font-medium">Event Type:</Label>
                                <Select value={fuelEventsFilter} onValueChange={setFuelEventsFilter}>
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all">All Events</SelectItem>
                                    <SelectItem value="theft">Theft</SelectItem>
                                    <SelectItem value="fill">Fill</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex items-center gap-2">
                                <Label className="text-sm font-medium">Date Range:</Label>
                                <Select value={fuelEventsDateFilter} onValueChange={setFuelEventsDateFilter}>
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all">All Time</SelectItem>
                                    <SelectItem value="7">Last 7 days</SelectItem>
                                    <SelectItem value="30">Last 30 days</SelectItem>
                                    <SelectItem value="90">Last 90 days</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setFuelEventsFilter("all")
                                  setFuelEventsDateFilter("all")
                                  setSelectedFuelEvents([])
                                }}
                              >
                                Clear
                              </Button>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Events Table */}
                        <Card data-events-table>
                          <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Fuel Events</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ScrollArea className="h-[500px]">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-12">
                                      <Checkbox
                                        checked={
                                          selectedFuelEvents.length === getFilteredFuelEvents().length &&
                                          getFilteredFuelEvents().length > 0
                                        }
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            setSelectedFuelEvents(getFilteredFuelEvents().map((e) => e.id))
                                          } else {
                                            setSelectedFuelEvents([])
                                          }
                                        }}
                                      />
                                    </TableHead>
                                    <TableHead>Event</TableHead>
                                    <TableHead>Date and Time</TableHead>
                                    <TableHead>Fuel Change</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Vehicle State</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {getFilteredFuelEvents().map((event) => (
                                    <TableRow key={event.id}>
                                      <TableCell>
                                        <Checkbox
                                          checked={selectedFuelEvents.includes(event.id)}
                                          onCheckedChange={(checked) => {
                                            if (checked) {
                                              setSelectedFuelEvents([...selectedFuelEvents, event.id])
                                            } else {
                                              setSelectedFuelEvents(selectedFuelEvents.filter((id) => id !== event.id))
                                            }
                                          }}
                                        />
                                      </TableCell>
                                      <TableCell>
                                        {/* Enhanced Event column like FuelTheft.tsx */}
                                        <div className="flex items-center gap-2">
                                          {getEventIcon(event.event_type)}
                                          <div className="flex flex-col">
                                            <span className="font-medium">
                                              {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
                                            </span>
                                            <Badge
                                              variant={event.event_type === "theft" ? "destructive" : "default"}
                                              className="text-xs w-fit"
                                            >
                                              {event.event_type === "theft" ? "THEFT" : "FILL"}
                                            </Badge>
                                          </div>
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
                                            {Math.abs(event.fuel_change.amount_liters)}L
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
                            <div className="mt-4 flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={downloadAllFuelEvents}
                                className="flex items-center gap-2"
                              >
                                <Download className="h-4 w-4" />
                                Download All
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={downloadSelectedFuelEvents}
                                disabled={selectedFuelEvents.length === 0}
                                className="flex items-center gap-2"
                              >
                                <Download className="h-4 w-4" />
                                Download Selected ({selectedFuelEvents.length})
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </TabsContent>
                </Tabs>
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
                                    disabled={loadingVehicleId === vehicle.id}
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
                                  disabled={loadingVehicleId === vehicle.id}
                                >
                                  {vehicle.license_plate}
                                </button>
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
