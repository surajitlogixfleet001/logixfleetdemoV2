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
import { ShieldAlert, Download, Eye, MapPin, Fuel, Clock, AlertTriangle, CircleCheck, CircleAlert } from "lucide-react"
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const itemsPerPage = 10

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

  // Fetch data
  useEffect(() => {
    const fetchFuelEvents = async () => {
      try {
        setLoading(true)
        const response = await api.get("/fuel-events/")
        setEvents(response.data.fuel_events)
        setFilteredEvents(response.data.fuel_events)
      } catch (err) {
        console.error("Error fetching fuel events:", err)
        setError("Failed to fetch fuel events data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }
    fetchFuelEvents()
  }, [])

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

  // Filters
  const handleFilter = () => {
    let filtered = events
    if (startDate) filtered = filtered.filter((e) => new Date(e.timestamp) >= new Date(startDate))
    if (endDate) filtered = filtered.filter((e) => new Date(e.timestamp) <= new Date(endDate))
    if (eventTypeFilter !== "all") filtered = filtered.filter((e) => e.event_type === eventTypeFilter)
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
    a.download = `fuel-report-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  // Pagination
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentEvents = filteredEvents.slice(startIndex, startIndex + itemsPerPage)

  const theftCount = filteredEvents.filter((e) => e.event_type === "theft").length
  const rapidDropCount = filteredEvents.filter((e) => e.event_type === "rapid_drop").length
  const highSeverityCount = filteredEvents.filter((e) => e.severity === "HIGH").length

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
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading fuel events...</p>
              </div>
            </div>
          ) : error ? (
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
                  <CardTitle>Fuel Events</CardTitle>
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

                  {/* Download Button */}
                  <div className="mt-2 flex justify-end">
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
