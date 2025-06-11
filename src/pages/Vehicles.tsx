"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { Search, AlertTriangle } from "lucide-react"
import { AppSidebar } from "@/components/AppSidebar"
import api from "@/lib/api"

interface VehicleData {
  id: number
  name: string
  imei: string
  imei_display: string
  type: string
  driver: string
  status: string
  license_plate: string
  fuel_capacity: string
  is_active: boolean
  driver_name: string
  driver_phone: string
  notes: string
}

interface FleetResponse {
  fleet_overview: VehicleData[]
  total_vehicles: number
  active_vehicles: number
  company: {
    id: string
    name: string
    country: string
  }
}

const Vehicles = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [vehicles, setVehicles] = useState<VehicleData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true)
        const response = await api.get<FleetResponse>("/vehicles/")
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
        (v.is_active ? "active" : "inactive").includes(term) ||
        v.status.toLowerCase().includes(term)
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
    if (vehicle.status === "ONLINE")
      return (
        <Badge variant="default" className="text-xs">
          ONLINE
        </Badge>
      )
    return (
      <Badge variant="secondary" className="text-xs">
        OFFLINE
      </Badge>
    )
  }

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
                    <CardTitle>Fleet Overview</CardTitle>
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
                            <TableHead>Vehicle</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Driver</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>License Plate</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredVehicles.map((vehicle) => (
                            <TableRow key={vehicle.id} className="hover:bg-muted/50">
                              <TableCell>
                                <div>
                                  <div className="font-semibold">{vehicle.name}</div>
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
                              <TableCell className="font-mono">{vehicle.license_plate}</TableCell>
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
