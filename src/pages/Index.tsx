import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Fuel, ShieldAlert, Car, AlertTriangle } from 'lucide-react';
import axios from "axios";
import api from "@/lib/api";

// Define types for API responses
interface FuelData {
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
  altitude: null | number;
  satellites: number;
  ignition: boolean;
  movement: boolean;
}

interface FuelEvent {
  id: number;
  vehicle: number;
  vehicle_name: string;
  event_type: string;
  event_display: string;
  event_icon: string;
  timestamp: string;
  timestamp_display: string;
  previous_level: string;
  current_level: string;
  change_amount: string;
  fuel_change: {
    text: string;
    color: string;
    details: string;
  };
  location_latitude: string;
  location_longitude: string;
  location: string;
  severity: string;
  notes: string;
  created_at: string;
}

interface VehicleData {
  id: number;
  name: string;
  imei: string;
  imei_display: string;
  type: string;
  driver: string;
  status: string;
  license_plate: string;
  fuel_capacity: string;
  is_active: boolean;
  driver_name: string;
  driver_phone: string;
  notes: string;
}

interface FleetResponse {
  fleet_overview: VehicleData[];
  total_vehicles: number;
  active_vehicles: number;
  company: {
    id: string;
    name: string;
    country: string;
  };
}

// Loading skeleton component for better UX
const MetricCardSkeleton = () => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
    </CardHeader>
    <CardContent>
      <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
      <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
    </CardContent>
  </Card>
);

const Index = () => {
  const [fuelData, setFuelData] = useState<FuelData[]>([]);
  const [fuelEvents, setFuelEvents] = useState<FuelEvent[]>([]);
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentData, setCurrentData] = useState<FuelData | null>(null);

  // Memoize theft metrics calculation to avoid recalculation on every render
  const fuelTheftData = useMemo(() => {
    if (!fuelEvents.length || !vehicles.length) {
      return {
        totalVehicles: 0,
        monthlyTheftCount: 0,
        totalFuelStolen: 0,
        highRiskVehicles: []
      };
    }

    const theftEvents = fuelEvents.filter(event => 
      event.event_type === 'theft' || event.event_type === 'rapid_drop'
    );
    
    const totalFuelStolen = theftEvents.reduce((total, event) => {
      const amount = parseFloat(event.change_amount);
      return total + (isNaN(amount) ? 0 : Math.abs(amount));
    }, 0);
    
    const highRiskVehicles = vehicles
      .filter(vehicle => {
        const vehicleThefts = theftEvents.filter(event => event.vehicle === vehicle.id);
        return vehicleThefts.length > 0;
      })
      .map(vehicle => {
        const vehicleThefts = theftEvents.filter(event => event.vehicle === vehicle.id);
        const lastTheft = vehicleThefts.length > 0 ? 
          vehicleThefts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0].timestamp : '';
        
        return {
          name: vehicle.name,
          riskScore: Math.floor(Math.random() * 30) + 70, // Simulated risk score between 70-100
          lastTheft: lastTheft
        };
      })
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 3); // Top 3 high risk vehicles
    
    return {
      totalVehicles: vehicles.length,
      monthlyTheftCount: theftEvents.length,
      totalFuelStolen: totalFuelStolen,
      highRiskVehicles: highRiskVehicles
    };
  }, [fuelEvents, vehicles]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Make all API calls concurrently instead of sequentially
        const [fuelResponse, vehiclesResponse, eventsResponse] = await Promise.all([
          api.get('/fuel-data/'),
          api.get('/vehicles/'),
          api.get('/fuel-events/')
        ]);
        
        // Process responses
        setFuelData(fuelResponse.data.sensor_data || []);
        setVehicles(vehiclesResponse.data.fleet_overview || []);
        setFuelEvents(eventsResponse.data.fuel_events || []);
        
        // Set current data if available
        if (fuelResponse.data.sensor_data?.length > 0) {
          setCurrentData(fuelResponse.data.sensor_data[0]);
        }
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch data. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
            <div className="container mx-auto space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <SidebarTrigger />
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                      Welcome Test
                    </h1>
                    <p className="text-muted-foreground mt-2">
                      Real-time vehicle tracking and fuel monitoring system
                    </p>
                  </div>
                </div>
              </div>

              {/* Key Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {loading ? (
                  // Show skeleton loading for better UX
                  <>
                    <MetricCardSkeleton />
                    <MetricCardSkeleton />
                    <MetricCardSkeleton />
                    <MetricCardSkeleton />
                  </>
                ) : (
                  <>
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
                        <Car className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{fuelTheftData.totalVehicles}</div>
                        <p className="text-xs text-muted-foreground">
                          Fleet size
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Fuel Theft This Month</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-destructive" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-destructive">{fuelTheftData.monthlyTheftCount}</div>
                        <p className="text-xs text-muted-foreground">
                          Detected incidents
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Fuel Stolen</CardTitle>
                        <Fuel className="h-4 w-4 text-destructive" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-destructive">{fuelTheftData.totalFuelStolen.toFixed(1)}L</div>
                        <p className="text-xs text-muted-foreground">
                          This month
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">High Risk Vehicles</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-orange-500">{fuelTheftData.highRiskVehicles.length}</div>
                        <p className="text-xs text-muted-foreground">
                          Require attention
                        </p>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>

              {/* Error State */}
              {error && (
                <Card className="border-destructive">
                  <CardContent className="pt-6">
                    <div className="text-center text-destructive">
                      <AlertTriangle className="h-10 w-10 mx-auto mb-2" />
                      <p>{error}</p>
                      <button 
                        onClick={() => window.location.reload()} 
                        className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                      >
                        Retry
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* High Risk Vehicles Card */}
              {!loading && !error && fuelTheftData.highRiskVehicles.length > 0 && (
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      Vehicles with High Risk of Fuel Theft
                    </CardTitle>
                    <CardDescription>
                      Vehicles showing patterns of suspicious fuel activity
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {fuelTheftData.highRiskVehicles.map((vehicle, index) => (
                        <div key={index} className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                          <div>
                            <h4 className="font-semibold">{vehicle.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Last theft detected: {new Date(vehicle.lastTheft).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-destructive">{vehicle.riskScore}%</div>
                            <p className="text-xs text-muted-foreground">Risk Score</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Loading state for detailed sections */}
              {loading && (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-sm text-muted-foreground">Loading additional data...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Index;