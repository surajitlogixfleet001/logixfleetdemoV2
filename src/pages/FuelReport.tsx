import React, { useState, useEffect } from "react";
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
import { Fuel, Download, AlertTriangle, TrendingUp, TrendingDown, Gauge, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface SensorData {
  id: number;
  vehicle: number;
  vehicle_name: string;
  timestamp: string;
  timestamp_display: string;
  fuel_level: string;
  location: string;
  speed: number;
  notes: string;
  latitude: string;
  longitude: string;
  altitude: string | null;
  satellites: number;
  ignition: boolean;
  movement: boolean;
}

interface ApiResponse {
  sensor_data: SensorData[];
}

const FuelReport = () => {
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [filteredData, setFilteredData] = useState<SensorData[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all");
  const [selectedChartVehicle, setSelectedChartVehicle] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [chartPage, setChartPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const itemsPerPage = 10;
  const chartItemsPerPage = 12;

  // Fetch fuel data from API
  const fetchFuelData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('apiToken') || '6c19549d44d97c77712dc6236480522404d849d4';
      
      const response = await fetch('https://palmconnect.co/telematry/fuel-data/', {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      
      if (data.sensor_data && Array.isArray(data.sensor_data)) {
        setSensorData(data.sensor_data);
        setFilteredData(data.sensor_data);
        
        // Set default chart vehicle to first vehicle
        if (data.sensor_data.length > 0 && !selectedChartVehicle) {
          setSelectedChartVehicle(data.sensor_data[0].vehicle_name);
        }
      } else {
        throw new Error('Invalid data format received from API');
      }
    } catch (error: any) {
      console.error('Error fetching fuel data:', error);
      setError(error.message || 'Failed to fetch fuel data');
      toast({
        title: 'Error',
        description: 'Failed to fetch fuel data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFuelData();
  }, []);

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
      "Fuel Level",
      "Location",
      "Speed (km/h)",
      "Satellites",
      "Ignition",
      "Movement",
      "Notes"
    ];

    const csvContent = [
      headers.join(","),
      ...filteredData.map(data => [
        data.id,
        `"${data.vehicle_name}"`,
        data.timestamp,
        data.fuel_level,
        `"${data.location}"`,
        data.speed,
        data.satellites,
        data.ignition ? 'Yes' : 'No',
        data.movement ? 'Yes' : 'No',
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

  // Process chart data from API response
  const getChartDataForVehicle = (vehicleName: string) => {
    return sensorData
      .filter(data => data.vehicle_name === vehicleName)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(data => ({
        time: new Date(data.timestamp).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        level: parseFloat(data.fuel_level.replace('L', '')),
        vehicle: data.vehicle_name,
        timestamp: data.timestamp
      }));
  };

  const currentVehicleData = selectedChartVehicle ? getChartDataForVehicle(selectedChartVehicle) : [];
  
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
  const isLowFuel = currentLevel <= 15;
  const trend = currentLevel > previousLevel ? "up" : "down";

  // Table pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // Get available vehicles for chart selector
  const availableVehicles = [...new Set(sensorData.map(data => data.vehicle_name))];

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
    );
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
                <Button onClick={fetchFuelData}>
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </SidebarProvider>
    );
  }

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
            <Button onClick={fetchFuelData} variant="outline">
              Refresh Data
            </Button>
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
                <div className="text-2xl font-bold text-green-600">{maxLevel.toFixed(1)}L</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Min Level</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{minLevel.toFixed(1)}L</div>
              </CardContent>
            </Card>
          </div>

          {/* Fuel Level Chart */}
          {selectedChartVehicle && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Fuel Level Over Time - {selectedChartVehicle}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="chart-vehicle">Select a Vehicle:</Label>
                    <Select value={selectedChartVehicle} onValueChange={(value) => {
                      setSelectedChartVehicle(value);
                      setChartPage(1);
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
                      {availableVehicles.map(vehicle => (
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
              <CardTitle>Sensor Data ({filteredData.length} records)</CardTitle>
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
                      <TableHead>Status</TableHead>
                      <TableHead>Satellites</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentData.map((data) => (
                      <TableRow key={data.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{data.vehicle_name}</TableCell>
                        <TableCell className="font-mono text-xs">{data.timestamp_display}</TableCell>
                        <TableCell className={parseFloat(data.fuel_level.replace('L', '')) <= 15 ? "text-red-600 font-semibold" : ""}>
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
                        <TableCell>
                          <span className={data.satellites < 10 ? "text-yellow-600" : "text-green-600"}>
                            {data.satellites}
                          </span>
                        </TableCell>
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
