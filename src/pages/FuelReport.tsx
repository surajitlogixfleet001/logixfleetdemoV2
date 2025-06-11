
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
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ReferenceLine, ResponsiveContainer } from "recharts";
import { Fuel, Download, AlertTriangle, TrendingUp, TrendingDown, Gauge, ChevronLeft, ChevronRight } from "lucide-react";

interface SensorData {
  id: string;
  vehicle_name: string;
  timestamp: string;
  fuel_level: number;
  location_latitude: number;
  location_longitude: number;
  speed: number;
  notes: string;
}

// Mock data for demonstration
const mockSensorData: SensorData[] = [
  {
    id: "1",
    vehicle_name: "Fleet Vehicle 001",
    timestamp: "2024-12-10T14:30:00Z",
    fuel_level: 75.5,
    location_latitude: -1.2921,
    location_longitude: 36.8219,
    speed: 60,
    notes: "Normal operation"
  },
  {
    id: "2",
    vehicle_name: "Fleet Vehicle 002",
    timestamp: "2024-12-10T09:15:00Z",
    fuel_level: 68.0,
    location_latitude: -1.2850,
    location_longitude: 36.8200,
    speed: 45,
    notes: "Slowing down in urban area"
  },
  {
    id: "3",
    vehicle_name: "Fleet Vehicle 003",
    timestamp: "2024-12-09T23:45:00Z",
    fuel_level: 82.1,
    location_latitude: -1.2950,
    location_longitude: 36.8180,
    speed: 0,
    notes: "Parked overnight"
  },
  {
    id: "4",
    vehicle_name: "Fleet Vehicle 001",
    timestamp: "2024-12-09T16:20:00Z",
    fuel_level: 45.2,
    location_latitude: -1.2900,
    location_longitude: 36.8250,
    speed: 55,
    notes: "Refueling in progress"
  },
  {
    id: "5",
    vehicle_name: "Fleet Vehicle 004",
    timestamp: "2024-12-09T12:30:00Z",
    fuel_level: 15.8,
    location_latitude: -1.2800,
    location_longitude: 36.8300,
    speed: 30,
    notes: "Low fuel warning"
  }
];

const FuelReport = () => {
  const [sensorData, setSensorData] = useState<SensorData[]>(mockSensorData);
  const [filteredData, setFilteredData] = useState<SensorData[]>(mockSensorData);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all");
  const [selectedChartVehicle, setSelectedChartVehicle] = useState<string>("Fleet Vehicle 001");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [chartPage, setChartPage] = useState(1);
  const itemsPerPage = 10;
  const chartItemsPerPage = 12; // Show 12 data points per page

  const handleFilter = () => {
    let filtered = sensorData;

    if (selectedVehicle !== "all") {
      filtered = filtered.filter(data => data.vehicle_name === selectedVehicle);
    }

    if (startDate) {
      filtered = filtered.filter(data => new Date(data.timestamp) >= new Date(startDate));
    }

    if (endDate) {
      filtered = filtered.filter(data => new Date(data.timestamp) <= new Date(endDate));
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedVehicle("all");
    setStartDate("");
    setEndDate("");
    setFilteredData(sensorData);
    setCurrentPage(1);
  };

  const downloadCSV = () => {
    const headers = [
      "ID",
      "Vehicle",
      "Timestamp",
      "Fuel Level (L)",
      "Latitude",
      "Longitude",
      "Speed (km/h)",
      "Notes"
    ];

    const csvContent = [
      headers.join(","),
      ...filteredData.map(data => [
        data.id,
        `"${data.vehicle_name}"`,
        data.timestamp,
        data.fuel_level,
        data.location_latitude,
        data.location_longitude,
        data.speed,
        `"${data.notes}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fuel-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Mock fuel chart data for different vehicles
  const allFuelChartData = {
    "Fleet Vehicle 001": [
      { time: "00:00", level: 75, vehicle: "Fleet Vehicle 001" },
      { time: "02:00", level: 72, vehicle: "Fleet Vehicle 001" },
      { time: "04:00", level: 68, vehicle: "Fleet Vehicle 001" },
      { time: "06:00", level: 65, vehicle: "Fleet Vehicle 001" },
      { time: "08:00", level: 85, vehicle: "Fleet Vehicle 001" }, // Refueled
      { time: "10:00", level: 82, vehicle: "Fleet Vehicle 001" },
      { time: "12:00", level: 78, vehicle: "Fleet Vehicle 001" },
      { time: "14:00", level: 74, vehicle: "Fleet Vehicle 001" },
      { time: "16:00", level: 70, vehicle: "Fleet Vehicle 001" },
      { time: "18:00", level: 66, vehicle: "Fleet Vehicle 001" },
      { time: "20:00", level: 62, vehicle: "Fleet Vehicle 001" },
      { time: "22:00", level: 58, vehicle: "Fleet Vehicle 001" },
      { time: "24:00", level: 55, vehicle: "Fleet Vehicle 001" },
      { time: "26:00", level: 52, vehicle: "Fleet Vehicle 001" },
      { time: "28:00", level: 48, vehicle: "Fleet Vehicle 001" },
      { time: "30:00", level: 45, vehicle: "Fleet Vehicle 001" },
      { time: "32:00", level: 42, vehicle: "Fleet Vehicle 001" },
      { time: "34:00", level: 38, vehicle: "Fleet Vehicle 001" },
      { time: "36:00", level: 35, vehicle: "Fleet Vehicle 001" },
      { time: "38:00", level: 32, vehicle: "Fleet Vehicle 001" },
      { time: "40:00", level: 28, vehicle: "Fleet Vehicle 001" },
      { time: "42:00", level: 25, vehicle: "Fleet Vehicle 001" },
      { time: "44:00", level: 22, vehicle: "Fleet Vehicle 001" },
      { time: "46:00", level: 18, vehicle: "Fleet Vehicle 001" },
    ],
    "Fleet Vehicle 002": [
      { time: "00:00", level: 80, vehicle: "Fleet Vehicle 002" },
      { time: "02:00", level: 78, vehicle: "Fleet Vehicle 002" },
      { time: "04:00", level: 75, vehicle: "Fleet Vehicle 002" },
      { time: "06:00", level: 72, vehicle: "Fleet Vehicle 002" },
      { time: "08:00", level: 69, vehicle: "Fleet Vehicle 002" },
      { time: "10:00", level: 66, vehicle: "Fleet Vehicle 002" },
      { time: "12:00", level: 63, vehicle: "Fleet Vehicle 002" },
      { time: "14:00", level: 60, vehicle: "Fleet Vehicle 002" },
      { time: "16:00", level: 57, vehicle: "Fleet Vehicle 002" },
      { time: "18:00", level: 54, vehicle: "Fleet Vehicle 002" },
      { time: "20:00", level: 51, vehicle: "Fleet Vehicle 002" },
      { time: "22:00", level: 48, vehicle: "Fleet Vehicle 002" },
      { time: "24:00", level: 45, vehicle: "Fleet Vehicle 002" },
      { time: "26:00", level: 42, vehicle: "Fleet Vehicle 002" },
      { time: "28:00", level: 38, vehicle: "Fleet Vehicle 002" },
      { time: "30:00", level: 35, vehicle: "Fleet Vehicle 002" },
    ],
    "Fleet Vehicle 003": [
      { time: "00:00", level: 90, vehicle: "Fleet Vehicle 003" },
      { time: "02:00", level: 88, vehicle: "Fleet Vehicle 003" },
      { time: "04:00", level: 86, vehicle: "Fleet Vehicle 003" },
      { time: "06:00", level: 84, vehicle: "Fleet Vehicle 003" },
      { time: "08:00", level: 82, vehicle: "Fleet Vehicle 003" },
      { time: "10:00", level: 80, vehicle: "Fleet Vehicle 003" },
      { time: "12:00", level: 78, vehicle: "Fleet Vehicle 003" },
      { time: "14:00", level: 76, vehicle: "Fleet Vehicle 003" },
      { time: "16:00", level: 74, vehicle: "Fleet Vehicle 003" },
      { time: "18:00", level: 72, vehicle: "Fleet Vehicle 003" },
      { time: "20:00", level: 70, vehicle: "Fleet Vehicle 003" },
      { time: "22:00", level: 68, vehicle: "Fleet Vehicle 003" },
    ],
    "Fleet Vehicle 004": [
      { time: "00:00", level: 25, vehicle: "Fleet Vehicle 004" },
      { time: "02:00", level: 23, vehicle: "Fleet Vehicle 004" },
      { time: "04:00", level: 20, vehicle: "Fleet Vehicle 004" },
      { time: "06:00", level: 18, vehicle: "Fleet Vehicle 004" },
      { time: "08:00", level: 15, vehicle: "Fleet Vehicle 004" },
      { time: "10:00", level: 12, vehicle: "Fleet Vehicle 004" },
      { time: "12:00", level: 10, vehicle: "Fleet Vehicle 004" },
      { time: "14:00", level: 8, vehicle: "Fleet Vehicle 004" },
      { time: "16:00", level: 5, vehicle: "Fleet Vehicle 004" },
      { time: "18:00", level: 3, vehicle: "Fleet Vehicle 004" },
    ]
  };

  // Get the current vehicle's chart data
  const currentVehicleData = allFuelChartData[selectedChartVehicle] || [];
  
  // Calculate pagination for chart data
  const totalChartPages = Math.ceil(currentVehicleData.length / chartItemsPerPage);
  const chartStartIndex = (chartPage - 1) * chartItemsPerPage;
  const chartEndIndex = chartStartIndex + chartItemsPerPage;
  const paginatedChartData = currentVehicleData.slice(chartStartIndex, chartEndIndex);

  const chartConfig = {
    level: {
      label: "Fuel Level",
      color: "hsl(var(--chart-1))",
    },
  };

  // Calculate statistics for the selected vehicle
  const currentLevel = paginatedChartData[paginatedChartData.length - 1]?.level || 0;
  const previousLevel = paginatedChartData[paginatedChartData.length - 2]?.level || 0;
  const averageLevel = paginatedChartData.reduce((acc, data) => acc + data.level, 0) / paginatedChartData.length || 0;
  const maxLevel = Math.max(...paginatedChartData.map(data => data.level));
  const minLevel = Math.min(...paginatedChartData.map(data => data.level));
  const isLowFuel = currentLevel <= 20;
  const trend = currentLevel > previousLevel ? "up" : "down";

  // Table pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // Get available vehicles for chart selector
  const availableVehicles = Object.keys(allFuelChartData);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Fuel className="h-8 w-8 text-primary" />
                Fuel Monitoring Report
              </h1>
              <p className="text-muted-foreground">
                Analyze fuel consumption and sensor data across your fleet
              </p>
            </div>
          </div>

          {/* Fuel Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Level</CardTitle>
                <Gauge className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className={`text-2xl font-bold ${isLowFuel ? "text-destructive" : "text-foreground"}`}>
                    {currentLevel}L
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
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Level</CardTitle>
                <Fuel className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averageLevel.toFixed(1)}L</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Max Level</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{maxLevel}L</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Min Level</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{minLevel}L</div>
              </CardContent>
            </Card>
          </div>

          {/* Fuel Level Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Fuel Level Over Time - {selectedChartVehicle}</CardTitle>
                <div className="flex items-center gap-2">
                  <Label htmlFor="chart-vehicle">Select a Vehicle:</Label>
                  <Select value={selectedChartVehicle} onValueChange={(value) => {
                    setSelectedChartVehicle(value);
                    setChartPage(1); // Reset to first page when changing vehicle
                  }}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select Vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableVehicles.map(vehicle => (
                        <SelectItem key={vehicle} value={vehicle}>{vehicle}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[400px]">
                <AreaChart data={paginatedChartData}>
                  <defs>
                    <linearGradient id="fillLevel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="time" 
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Fuel Level (L)', angle: -90, position: 'insideLeft' }}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                  />
                  <ReferenceLine 
                    y={15} 
                    stroke="#ef4444" 
                    strokeDasharray="5 5"
                    label={{ value: "Low Fuel Alert (15L)", position: "top" }}
                  />
                  <ReferenceLine 
                    y={5} 
                    stroke="#dc2626" 
                    strokeDasharray="3 3"
                    label={{ value: "Critical (5L)", position: "bottom" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="level"
                    stroke="hsl(var(--chart-1))"
                    fillOpacity={1}
                    fill="url(#fillLevel)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
              
              {/* Chart Pagination */}
              {totalChartPages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (chartPage > 1) setChartPage(chartPage - 1);
                          }}
                          className={chartPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalChartPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setChartPage(page);
                            }}
                            isActive={page === chartPage}
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
                            if (chartPage < totalChartPages) setChartPage(chartPage + 1);
                          }}
                          className={chartPage === totalChartPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>

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
                      {[...new Set(sensorData.map(data => data.vehicle_name))].map(vehicle => (
                        <SelectItem key={vehicle} value={vehicle}>{vehicle}</SelectItem>
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
                  <Button variant="outline" onClick={clearFilters}>Clear</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sensor Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>Sensor Data</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Fuel Level</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Speed</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentData.map((data) => (
                      <TableRow key={data.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{data.vehicle_name}</TableCell>
                        <TableCell className="font-mono text-xs">{new Date(data.timestamp).toLocaleString()}</TableCell>
                        <TableCell>{data.fuel_level}L</TableCell>
                        <TableCell className="font-mono text-xs">
                          {data.location_latitude.toFixed(4)}, {data.location_longitude.toFixed(4)}
                        </TableCell>
                        <TableCell>{data.speed} km/h</TableCell>
                        <TableCell>{data.notes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              {/* Table Pagination */}
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

export default FuelReport;