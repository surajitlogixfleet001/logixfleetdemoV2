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
import { Checkbox } from "@/components/ui/checkbox";

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

type TimePeriod = 'day' | 'week' | 'month';

const FuelReport = () => {
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [filteredData, setFilteredData] = useState<SensorData[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all");
  const [selectedChartVehicle, setSelectedChartVehicle] = useState<string>("");
  const [chartTimePeriod, setChartTimePeriod] = useState<TimePeriod>('day');
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecords, setSelectedRecords] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const { toast } = useToast();
  
  const itemsPerPage = 10;

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
    setSelectedRecords([]);
    setSelectAll(false);
  };

  const clearFilters = () => {
    setSelectedVehicle("all");
    setStartDate("");
    setEndDate("");
    setFilteredData(sensorData);
    setCurrentPage(1);
    setSelectedRecords([]);
    setSelectAll(false);
  };

  // Handle individual record selection
  const handleRecordSelection = (recordId: number, checked: boolean) => {
    if (checked) {
      setSelectedRecords(prev => [...prev, recordId]);
    } else {
      setSelectedRecords(prev => prev.filter(id => id !== recordId));
      setSelectAll(false);
    }
  };

  // Handle select all functionality
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedRecords(filteredData.map(data => data.id));
    } else {
      setSelectedRecords([]);
    }
  };

  // Download CSV with selected records or all records
  const downloadCSV = (downloadAll: boolean = false) => {
    const dataToDownload = downloadAll ? filteredData : filteredData.filter(data => selectedRecords.includes(data.id));
    
    if (!downloadAll && dataToDownload.length === 0) {
      toast({
        title: 'No records selected',
        description: 'Please select records to download or use "Download All" button.',
        variant: 'destructive',
      });
      return;
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
      "Notes"
    ];

    const csvContent = [
      headers.join(","),
      ...dataToDownload.map(data => [
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
    const fileName = downloadAll ? 
      `fuel-report-all-${new Date().toISOString().split('T')[0]}.csv` :
      `fuel-report-selected-${new Date().toISOString().split('T')[0]}.csv`;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast({
      title: 'Download Complete',
      description: `Downloaded ${dataToDownload.length} records successfully.`,
    });
  };

  // Get chart data based on time period
  const getChartDataForVehicle = (vehicleName: string, timePeriod: TimePeriod) => {
    const now = new Date();
    let startTime: Date;

    switch (timePeriod) {
      case 'day':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
        break;
      case 'week':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
        break;
      case 'month':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    return sensorData
      .filter(data => 
        data.vehicle_name === vehicleName && 
        new Date(data.timestamp) >= startTime
      )
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(data => ({
        time: timePeriod === 'day' 
          ? new Date(data.timestamp).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })
          : new Date(data.timestamp).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              ...(timePeriod === 'month' ? {} : { hour: '2-digit', minute: '2-digit' })
            }),
        level: parseFloat(data.fuel_level.replace('L', '')),
        vehicle: data.vehicle_name,
        timestamp: data.timestamp
      }));
  };

  const currentVehicleData = selectedChartVehicle ? getChartDataForVehicle(selectedChartVehicle, chartTimePeriod) : [];

  const chartConfig = {
    level: {
      label: "Fuel Level",
      color: "hsl(var(--chart-1))",
    },
  };

  // Calculate statistics for the selected vehicle
  const currentLevel = currentVehicleData[currentVehicleData.length - 1]?.level || 0;
  const previousLevel = currentVehicleData[currentVehicleData.length - 2]?.level || 0;
  const averageLevel = currentVehicleData.reduce((acc, data) => acc + data.level, 0) / currentVehicleData.length || 0;
  const maxLevel = Math.max(...currentVehicleData.map(data => data.level));
  const minLevel = Math.min(...currentVehicleData.map(data => data.level));
  const isLowFuel = currentLevel <= 15;
  const trend = currentLevel > previousLevel ? "up" : "down";

  // Table pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // Get available vehicles for chart selector
  const availableVehicles = [...new Set(sensorData.map(data => data.vehicle_name))];

  // Check if all current page records are selected
  const currentPageRecordIds = currentData.map(data => data.id);
  const allCurrentPageSelected = currentPageRecordIds.length > 0 && 
    currentPageRecordIds.every(id => selectedRecords.includes(id));

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
                  <CardTitle>
                    Fuel Level Over Time - {selectedChartVehicle} 
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      (Last {chartTimePeriod === 'day' ? '24 hours' : chartTimePeriod === 'week' ? 'week' : 'month'})
                    </span>
                  </CardTitle>
                  <div className="flex items-center gap-4">
                    {/* Time Period Selector */}
                    <div className="flex items-center gap-2">
                      <Label htmlFor="time-period">Time Period:</Label>
                      <Select value={chartTimePeriod} onValueChange={(value: TimePeriod) => setChartTimePeriod(value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="day">Day</SelectItem>
                          <SelectItem value="week">Week</SelectItem>
                          <SelectItem value="month">Month</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Vehicle Selector */}
                    <div className="flex items-center gap-2">
                      <Label htmlFor="chart-vehicle">Vehicle:</Label>
                      <Select value={selectedChartVehicle} onValueChange={setSelectedChartVehicle}>
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
                </div>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[400px]">
                  <AreaChart data={currentVehicleData}>
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
              <div className="flex items-center justify-between">
                <CardTitle>Fuel data ({filteredData.length} records)</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {selectedRecords.length} selected
                  </span>
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
                          checked={selectAll}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all records"
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

              {/* Download Buttons */}
              <div className="mt-4 flex justify-end gap-2">
                <Button 
                  onClick={() => downloadCSV(false)} 
                  className="flex items-center gap-2"
                  disabled={selectedRecords.length === 0}
                  variant="outline"
                >
                  <Download className="h-4 w-4" />
                  Download Selected ({selectedRecords.length})
                </Button>
                <Button onClick={() => downloadCSV(true)} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download All Records
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