
import React, { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ShieldAlert, Download, Eye, MapPin, Fuel, Clock, AlertTriangle } from "lucide-react";

interface FuelEvent {
  id: string;
  vehicle_name: string;
  event_type: "refuel" | "rapid_drop" | "theft" | "sensor_lost" | "sensor_restored";
  timestamp: string;
  previous_level: number;
  current_level: number;
  change_amount: number;
  location_latitude: number;
  location_longitude: number;
  notes: string;
  severity: "low" | "medium" | "high";
}

// Mock data for demonstration
const mockFuelEvents: FuelEvent[] = [
  {
    id: "1",
    vehicle_name: "Fleet Vehicle 001",
    event_type: "theft",
    timestamp: "2024-12-10T14:30:00Z",
    previous_level: 75.5,
    current_level: 25.2,
    change_amount: -50.3,
    location_latitude: -1.2921,
    location_longitude: 36.8219,
    notes: "Suspicious rapid fuel drop detected during non-operational hours",
    severity: "high"
  },
  {
    id: "2",
    vehicle_name: "Fleet Vehicle 002",
    event_type: "rapid_drop",
    timestamp: "2024-12-10T09:15:00Z",
    previous_level: 68.0,
    current_level: 45.5,
    change_amount: -22.5,
    location_latitude: -1.2850,
    location_longitude: 36.8200,
    notes: "Rapid fuel consumption detected",
    severity: "medium"
  },
  {
    id: "3",
    vehicle_name: "Fleet Vehicle 003",
    event_type: "theft",
    timestamp: "2024-12-09T23:45:00Z",
    previous_level: 82.1,
    current_level: 30.8,
    change_amount: -51.3,
    location_latitude: -1.2950,
    location_longitude: 36.8180,
    notes: "Critical fuel theft alert - vehicle parked overnight",
    severity: "high"
  },
  {
    id: "4",
    vehicle_name: "Fleet Vehicle 001",
    event_type: "sensor_lost",
    timestamp: "2024-12-09T16:20:00Z",
    previous_level: 45.2,
    current_level: 0,
    change_amount: -45.2,
    location_latitude: -1.2900,
    location_longitude: 36.8250,
    notes: "Fuel sensor connection lost",
    severity: "medium"
  },
  {
    id: "5",
    vehicle_name: "Fleet Vehicle 004",
    event_type: "refuel",
    timestamp: "2024-12-09T12:30:00Z",
    previous_level: 15.8,
    current_level: 78.5,
    change_amount: 62.7,
    location_latitude: -1.2800,
    location_longitude: 36.8300,
    notes: "Normal refueling at authorized station",
    severity: "low"
  }
];

const FuelTheft = () => {
  const [events, setEvents] = useState<FuelEvent[]>(mockFuelEvents);
  const [filteredEvents, setFilteredEvents] = useState<FuelEvent[]>(mockFuelEvents);
  const [selectedEvent, setSelectedEvent] = useState<FuelEvent | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const itemsPerPage = 10;

  const getEventTypeLabel = (type: string) => {
    const labels = {
      refuel: "Refueling",
      rapid_drop: "Rapid Drop",
      theft: "Possible Theft",
      sensor_lost: "Sensor Lost",
      sensor_restored: "Sensor Restored"
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "theft":
        return <ShieldAlert className="h-4 w-4" />;
      case "rapid_drop":
        return <AlertTriangle className="h-4 w-4" />;
      case "refuel":
        return <Fuel className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      high: "destructive",
      medium: "secondary",
      low: "outline"
    };
    return variants[severity as keyof typeof variants] || "outline";
  };

  const handleFilter = () => {
    let filtered = events;

    if (startDate) {
      filtered = filtered.filter(event => new Date(event.timestamp) >= new Date(startDate));
    }

    if (endDate) {
      filtered = filtered.filter(event => new Date(event.timestamp) <= new Date(endDate));
    }

    if (eventTypeFilter !== "all") {
      filtered = filtered.filter(event => event.event_type === eventTypeFilter);
    }

    if (severityFilter !== "all") {
      filtered = filtered.filter(event => event.severity === severityFilter);
    }

    setFilteredEvents(filtered);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setEventTypeFilter("all");
    setSeverityFilter("all");
    setFilteredEvents(events);
    setCurrentPage(1);
  };

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
      "Notes"
    ];

    const csvContent = [
      headers.join(","),
      ...filteredEvents.map(event => [
        event.id,
        `"${event.vehicle_name}"`,
        `"${getEventTypeLabel(event.event_type)}"`,
        event.timestamp,
        event.previous_level,
        event.current_level,
        event.change_amount,
        event.location_latitude,
        event.location_longitude,
        event.severity,
        `"${event.notes}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fuel-theft-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEvents = filteredEvents.slice(startIndex, endIndex);

  const theftCount = filteredEvents.filter(e => e.event_type === "theft").length;
  const rapidDropCount = filteredEvents.filter(e => e.event_type === "rapid_drop").length;
  const highSeverityCount = filteredEvents.filter(e => e.severity === "high").length;

  // Prepare chart data for fuel theft events
  const chartData = filteredEvents
    .filter(event => event.event_type === "theft" || event.event_type === "rapid_drop")
    .map(event => ({
      timestamp: new Date(event.timestamp).toLocaleDateString(),
      vehicle: event.vehicle_name.replace("Fleet Vehicle ", "V"),
      amount: Math.abs(event.change_amount),
      type: event.event_type
    }));

  const chartConfig = {
    amount: {
      label: "Fuel Loss (L)",
      color: "hsl(var(--destructive))",
    },
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <ShieldAlert className="h-8 w-8 text-destructive" />
                Fuel Theft Detection
              </h1>
              <p className="text-muted-foreground">
                Monitor and detect suspicious fuel activities across your fleet
              </p>
            </div>
          </div>

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

          {/* Fuel Events Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Fuel Loss Events</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="timestamp" 
                    className="text-xs"
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Fuel Loss (L)', angle: -90, position: 'insideLeft' }}
                  />
                  <ChartTooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background border rounded-lg shadow-lg p-3">
                            <p className="font-medium">{label}</p>
                            <p className="text-sm text-muted-foreground">{data.vehicle}</p>
                            <p className="text-sm">
                              <span className="text-destructive font-medium">
                                -{data.amount}L
                              </span>
                              <span className="ml-2 text-xs capitalize">
                                ({data.type.replace('_', ' ')})
                              </span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="amount"
                    fill="hsl(var(--destructive))"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
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
                      <SelectItem value="theft">Theft</SelectItem>
                      <SelectItem value="rapid_drop">Rapid Drop</SelectItem>
                      <SelectItem value="refuel">Refueling</SelectItem>
                      <SelectItem value="sensor_lost">Sensor Lost</SelectItem>
                      <SelectItem value="sensor_restored">Sensor Restored</SelectItem>
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
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 items-end">
                  <Button onClick={handleFilter}>Apply Filters</Button>
                  <Button variant="outline" onClick={clearFilters}>Clear</Button>
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
                            {getEventIcon(event.event_type)}
                            <span className="font-medium">
                              {getEventTypeLabel(event.event_type)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {event.vehicle_name}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {new Date(event.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className={`font-semibold ${
                              event.change_amount < 0 ? "text-destructive" : "text-green-600"
                            }`}>
                              {event.change_amount > 0 ? "+" : ""}{event.change_amount}L
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {event.previous_level}L → {event.current_level}L
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location_latitude.toFixed(4)}, {event.location_longitude.toFixed(4)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getSeverityBadge(event.severity) as any}>
                            {event.severity.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedEvent(event)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  {getEventIcon(event.event_type)}
                                  Event Details - {getEventTypeLabel(event.event_type)}
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
                                      <p className="text-sm font-mono">
                                        {new Date(selectedEvent.timestamp).toLocaleString()}
                                      </p>
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
                                      <p className={`text-sm font-semibold ${
                                        selectedEvent.change_amount < 0 ? "text-destructive" : "text-green-600"
                                      }`}>
                                        {selectedEvent.change_amount > 0 ? "+" : ""}{selectedEvent.change_amount}L
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Severity</Label>
                                      <Badge variant={getSeverityBadge(selectedEvent.severity) as any}>
                                        {selectedEvent.severity.toUpperCase()}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Location</Label>
                                    <p className="text-sm font-mono">
                                      Latitude: {selectedEvent.location_latitude.toFixed(6)}<br />
                                      Longitude: {selectedEvent.location_longitude.toFixed(6)}
                                    </p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Notes</Label>
                                    <p className="text-sm">{selectedEvent.notes}</p>
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
                            e.preventDefault();
                            if (currentPage > 1) setCurrentPage(currentPage - 1);
                          }}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(page);
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
                            e.preventDefault();
                            if (currentPage < totalPages) setCurrentPage(currentPage + 1);
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
        </main>
      </div>
    </SidebarProvider>
  );
};

export default FuelTheft;