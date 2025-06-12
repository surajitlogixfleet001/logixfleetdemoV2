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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Fuel, Download, AlertTriangle, TrendingUp, TrendingDown, Gauge, Loader2 } from 'lucide-react';
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

const FuelReport: React.FC = () => {
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [filteredData, setFilteredData] = useState<SensorData[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all");
  const [selectedChartVehicle, setSelectedChartVehicle] = useState<string>("");
  const [chartTimePeriod, setChartTimePeriod] = useState<TimePeriod>('day');
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecords, setSelectedRecords] = useState<number[]>([]);
  const { toast } = useToast();

  const itemsPerPage = 10;
  const API_URL = 'https://palmconnect.co/telematry/fuel-data/';
  const API_TOKEN = '6c19549d44d97c77712dc6236480522404d849d4';

  // Fetch fuel data from API
  const fetchFuelData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${API_TOKEN}`,
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
        if (data.sensor_data.length > 0) {
          setSelectedChartVehicle(prev => prev || data.sensor_data[0].vehicle_name);
        }
      } else {
        throw new Error('Invalid data format received from API');
      }
    } catch (err: any) {
      console.error('Error fetching fuel data:', err);
      setError(err.message || 'Failed to fetch fuel data');
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

  // Apply filters
  const handleFilter = () => {
    let filtered = sensorData;
    if (selectedVehicle !== "all") {
      filtered = filtered.filter(d => d.vehicle_name === selectedVehicle);
    }
    if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter(d => new Date(d.timestamp) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      filtered = filtered.filter(d => new Date(d.timestamp) <= end);
    }
    setFilteredData(filtered);
    setCurrentPage(1);
    setSelectedRecords([]);
  };

  const clearFilters = () => {
    setSelectedVehicle("all");
    setStartDate("");
    setEndDate("");
    setFilteredData(sensorData);
    setCurrentPage(1);
    setSelectedRecords([]);
  };

  // Record selection
  const handleRecordSelection = (recordId: number, checked: boolean) => {
    setSelectedRecords(prev => {
      if (checked) {
        return [...prev, recordId];
      } else {
        return prev.filter(id => id !== recordId);
      }
    });
  };

  // Select all current page records
  const toggleSelectAllPage = (checked: boolean) => {
    if (checked) {
      const ids = currentData.map(d => d.id);
      setSelectedRecords(prev => Array.from(new Set([...prev, ...ids])));
    } else {
      const ids = currentData.map(d => d.id);
      setSelectedRecords(prev => prev.filter(id => !ids.includes(id)));
    }
  };

  // Download CSV
  const downloadCSV = (downloadAll = false) => {
    const dataToDownload = downloadAll ? filteredData : filteredData.filter(d => selectedRecords.includes(d.id));
    if (!downloadAll && dataToDownload.length === 0) {
      toast({ title: 'No records selected', description: 'Please select records or use Download All.', variant: 'destructive' });
      return;
    }
    const headers = ["ID","Vehicle","Timestamp","Fuel Level","Location","Speed (km/h)","Satellites","Ignition","Movement","Notes"];
    const csvRows = [headers.join(',')];
    dataToDownload.forEach(d => {
      const row = [
        d.id,
        `"${d.vehicle_name}"`,
        d.timestamp,
        d.fuel_level,
        `"${d.location}"`,
        d.speed,
        d.satellites,
        d.ignition ? 'Yes' : 'No',
        d.movement ? 'Yes' : 'No',
        `"${d.notes || ''}"`
      ].join(',');
      csvRows.push(row);
    });
    const blob = new Blob([csvRows.join("\n")], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = downloadAll ? `fuel-report-all-${dateStr}.csv` : `fuel-report-selected-${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Download Complete', description: `Downloaded ${dataToDownload.length} records.` });
  };

  // Chart data with moving average
  const getChartDataForVehicle = (vehicleName: string, period: TimePeriod) => {
    const now = new Date();
    let startTime: Date;
    switch (period) {
      case 'day': startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
      case 'week': startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case 'month': startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
      default: startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
    const dataPoints = sensorData
      .filter(d => d.vehicle_name === vehicleName && new Date(d.timestamp) >= startTime)
      .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(d => ({
        time: period === 'day'
          ? new Date(d.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          : new Date(d.timestamp).toLocaleDateString('en-US', period === 'month' ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        level: parseFloat(d.fuel_level.replace(/L/i, '')) || 0,
      }));
    // Compute moving average (window size 3)
    const windowSize = 3;
    const withAvg = dataPoints.map((point, idx, arr) => {
      const start = Math.max(0, idx - (windowSize - 1));
      const windowArr = arr.slice(start, idx + 1).map(p => p.level);
      const avgLevel = windowArr.reduce((sum, v) => sum + v, 0) / windowArr.length;
      return { ...point, avgLevel };
    });
    return withAvg;
  };

  const currentVehicleData = selectedChartVehicle ? getChartDataForVehicle(selectedChartVehicle, chartTimePeriod) : [];

  // Statistics
  const lastIndex = currentVehicleData.length - 1;
  const currentLevel = lastIndex >= 0 ? currentVehicleData[lastIndex].level : 0;
  const prevLevel = lastIndex > 0 ? currentVehicleData[lastIndex - 1].level : currentLevel;
  const averageLevel = currentVehicleData.length > 0 ? currentVehicleData.reduce((sum, d) => sum + d.level, 0) / currentVehicleData.length : 0;
  const maxLevel = currentVehicleData.length > 0 ? Math.max(...currentVehicleData.map(d => d.level)) : 0;
  const minLevel = currentVehicleData.length > 0 ? Math.min(...currentVehicleData.map(d => d.level)) : 0;
  const isLowFuel = currentLevel <= 15;
  const trend = currentLevel > prevLevel ? 'up' : 'down';

  // Pagination
  const totalCount = filteredData.length;
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount);
  const currentData = filteredData.slice(startIndex, endIndex);

  const availableVehicles = Array.from(new Set(sensorData.map(d => d.vehicle_name)));

  const allCurrentPageSelected = currentData.length > 0 && currentData.every(d => selectedRecords.includes(d.id));

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
                <Button onClick={fetchFuelData}>Try Again</Button>
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
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Fuel className="h-8 w-8 text-primary" />
                Fuel Monitoring Report
              </h1>
              <p className="text-muted-foreground">Analyze fuel consumption and sensor data across your fleet</p>
            </div>
            <Button onClick={fetchFuelData} variant="outline">Refresh Data</Button>
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
                  <div className={`text-2xl font-bold ${isLowFuel ? 'text-destructive' : 'text-foreground'}`}>{currentLevel.toFixed(1)}L</div>
                  {trend === 'up' ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
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

          {/* Chart with bold dark red line */}
          {selectedChartVehicle && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    Fuel Level Over Time - {selectedChartVehicle}
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      (Last {chartTimePeriod === 'day' ? '24 hours' : chartTimePeriod === 'week' ? '7 days' : '30 days'})
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
                          <SelectItem value="day">Day</SelectItem>
                          <SelectItem value="week">Week</SelectItem>
                          <SelectItem value="month">Month</SelectItem>
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
                          {availableVehicles.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ChartContainer className="h-[400px]" config={{ level: { label: 'Fuel Level', color: 'hsl(var(--chart-1))' } }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={currentVehicleData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} label={{ value: 'Fuel (L)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Legend verticalAlign="top" height={36} />
                      <ReferenceLine y={15} stroke="#8b0000" strokeDasharray="5 5" label={{ value: 'Low Fuel (15L)', position: 'top', fill: '#8b0000', fontWeight: 'bold' }} />
                      <ReferenceLine y={5} stroke="#8b0000" strokeDasharray="3 3" label={{ value: 'Critical (5L)', position: 'bottom', fill: '#8b0000', fontWeight: 'bold' }} />
                      {/* Raw Fuel Level - dark red bold */}
                      <Line
                        type="monotone"
                        dataKey="level"
                        name="Fuel Level"
                        stroke="#8b0000"
                        strokeWidth={4}
                        dot={false}
                        activeDot={{ r: 6, stroke: '#8b0000', strokeWidth: 3 }}
                      />
                      {/* Moving Average - lighter red dashed */}
                      <Line
                        type="monotone"
                        dataKey="avgLevel"
                        name="Moving Avg (3)"
                        stroke="#b22222"
                        strokeWidth={3}
                        dot={false}
                        strokeDasharray="6 4"
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
                      {availableVehicles.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input id="start-date" type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="end-date">End Date</Label>
                  <Input id="end-date" type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
                <div className="flex gap-2 items-end">
                  <Button onClick={handleFilter}>Apply Filters</Button>
                  <Button variant="outline" onClick={clearFilters}>Clear</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Fuel data (Showing {startIndex + 1}-{endIndex} of {totalCount} Records)</CardTitle>
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
                        <Checkbox checked={allCurrentPageSelected} onCheckedChange={toggleSelectAllPage} aria-label="Select all on page" />
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
                    {currentData.map(data => (
                      <TableRow key={data.id} className="hover:bg-muted/50">
                        <TableCell>
                          <Checkbox
                            checked={selectedRecords.includes(data.id)}
                            onCheckedChange={checked => handleRecordSelection(data.id, checked as boolean)}
                            aria-label={`Select record ${data.id}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{data.vehicle_name}</TableCell>
                        <TableCell className="font-mono text-xs">{data.timestamp_display}</TableCell>
                        <TableCell className={parseFloat(data.fuel_level.replace(/L/i, '')) <= 15 ? "text-red-600 font-semibold" : ""}>
                          {data.fuel_level}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{data.location}</TableCell>
                        <TableCell>{data.speed} km/h</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Badge variant={data.ignition ? "default" : "secondary"} className="text-xs">
                              {data.ignition ? "ON" : "OFF"}
                            </Badge>
                            {data.movement && <Badge variant="outline" className="text-xs">MOVING</Badge>}
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
                          onClick={e => { e.preventDefault(); if (currentPage > 1) setCurrentPage(currentPage - 1); }}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            onClick={e => { e.preventDefault(); setCurrentPage(page); }}
                            isActive={page === currentPage}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={e => { e.preventDefault(); if (currentPage < totalPages) setCurrentPage(currentPage + 1); }}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}

              {/* Download Buttons */}
              <div className="mt-4 flex justify-end gap-2">
                <Button onClick={() => downloadCSV(false)} className="flex items-center gap-2" disabled={selectedRecords.length === 0} variant="outline">
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
  );
};

export default FuelReport;
