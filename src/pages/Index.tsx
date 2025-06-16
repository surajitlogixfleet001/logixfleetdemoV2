import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Fuel, ShieldAlert, Car, AlertTriangle } from 'lucide-react';
import api from "@/lib/api";

// Define types for API responses
interface Vehicle {
  id: number;
  name: string;
  imei: string;
  type: string;
  license_plate: string;
  fuel_capacity: string;
  is_active: boolean;
  driver_name: string;
  driver_phone: string;
  notes: string;
}

interface FleetResponse {
  fleet_overview: Vehicle[];
}

interface FuelEvent {
  id: string;
  event_type: string;
  vehicle: {
    license_plate: string;
    name: string;
  };
  timestamp: string;
  location: {
    latitude: number;
    longitude: number;
  };
  fuel_change: {
    amount_liters: number;
    before_liters: number;
    after_liters: number;
  };
  vehicle_state: {
    speed: number;
    ignition: boolean;
    stationary: boolean;
  };
}

interface FuelEventsResponse {
  summary: {
    period: {
      start: string;
      end: string;
      days: number;
    };
    fill_events: {
      count: number;
      total_liters: number;
      vehicles_affected: number;
      average_fill_liters: number;
    };
    theft_events: {
      count: number;
      total_liters: number;
      vehicles_affected: number;
      average_theft_liters: number;
    };
    total_events: number;
  };
  events: FuelEvent[];
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
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fuelEvents, setFuelEvents] = useState<FuelEventsResponse | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize theft metrics calculation to avoid recalculation on every render
  const dashboardMetrics = useMemo(() => {
    if (!vehicles.length || !fuelEvents) {
      return {
        totalVehicles: 0,
        activeVehicles: 0,
        monthlyTheftCount: 0,
        totalFuelStolen: 0,
        highRiskVehicles: []
      };
    }

    const activeVehicles = vehicles.filter(v => v.is_active).length;
    const theftEvents = fuelEvents.events.filter(event => event.event_type === 'theft');
    
    const totalFuelStolen = fuelEvents.summary.theft_events.total_liters;
    
    // Create high risk vehicles based on theft events
    const vehicleTheftMap = new Map<string, number>();
    theftEvents.forEach(event => {
      const plate = event.vehicle.license_plate;
      vehicleTheftMap.set(plate, (vehicleTheftMap.get(plate) || 0) + 1);
    });
    
    const highRiskVehicles = Array.from(vehicleTheftMap.entries())
      .map(([plate, theftCount]) => {
        const vehicle = vehicles.find(v => v.license_plate === plate);
        const lastTheft = theftEvents
          .filter(e => e.vehicle.license_plate === plate)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
        
        return {
          name: vehicle?.name || plate,
          license_plate: plate,
          riskScore: Math.min(100, 50 + (theftCount * 15)), // Base 50 + 15 per theft
          lastTheft: lastTheft?.timestamp || '',
          theftCount
        };
      })
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 3); // Top 3 high risk vehicles
    
    return {
      totalVehicles: vehicles.length,
      activeVehicles,
      monthlyTheftCount: fuelEvents.summary.theft_events.count,
      totalFuelStolen,
      highRiskVehicles
    };
  }, [vehicles, fuelEvents]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch vehicles first
        const vehiclesResponse = await api.get('/vehicles/');
        const vehiclesData = vehiclesResponse.data.fleet_overview || [];
        setVehicles(vehiclesData);
        
        // If we have vehicles, fetch fuel events for the first vehicle as sample
        if (vehiclesData.length > 0) {
          const firstVehicle = vehiclesData[0];
          try {
            const eventsResponse = await api.get(`/fuel-events?license_plate=${firstVehicle.license_plate}&event_type=all`);
            setFuelEvents(eventsResponse.data);
          } catch (eventsError) {
            console.warn('Could not fetch fuel events:', eventsError);
            // Set empty events data to prevent crashes
            setFuelEvents({
              summary: {
                period: { start: '', end: '', days: 0 },
                fill_events: { count: 0, total_liters: 0, vehicles_affected: 0, average_fill_liters: 0 },
                theft_events: { count: 0, total_liters: 0, vehicles_affected: 0, average_theft_liters: 0 },
                total_events: 0
              },
              events: []
            });
          }
        }
        
        const stored = localStorage.getItem('userFname');
        if (stored) {
          setEmail(stored);
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
                      Welcome {email}
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
                        <div className="text-2xl font-bold">{dashboardMetrics.totalVehicles}</div>
                        <p className="text-xs text-muted-foreground">
                          {dashboardMetrics.activeVehicles} active
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Fuel Theft This Period</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-destructive" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-destructive">{dashboardMetrics.monthlyTheftCount}</div>
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
                        <div className="text-2xl font-bold text-destructive">{dashboardMetrics.totalFuelStolen.toFixed(1)}L</div>
                        <p className="text-xs text-muted-foreground">
                          This period
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">High Risk Vehicles</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-orange-500">{dashboardMetrics.highRiskVehicles.length}</div>
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
              {!loading && !error && dashboardMetrics.highRiskVehicles.length > 0 && (
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
                      {dashboardMetrics.highRiskVehicles.map((vehicle, index) => (
                        <div key={index} className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                          <div>
                            <h4 className="font-semibold">{vehicle.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              License: {vehicle.license_plate}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {vehicle.lastTheft ? `Last theft: ${new Date(vehicle.lastTheft).toLocaleDateString()}` : 'No recent theft'}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-destructive">{vehicle.riskScore}%</div>
                            <p className="text-xs text-muted-foreground">Risk Score</p>
                            <Badge variant="destructive" className="text-xs">
                              {vehicle.theftCount} theft{vehicle.theftCount !== 1 ? 's' : ''}
                            </Badge>
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
