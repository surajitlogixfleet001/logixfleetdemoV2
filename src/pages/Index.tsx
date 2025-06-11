import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Fuel, ShieldAlert, Car, AlertTriangle } from "lucide-react";

const sampleData = [
  {
    "imei": "353691842162892",
    "timestamp": "2025-06-10T12:10:00",
    "latitude": -1.27969,
    "longitude": 36.7942233,
    "speed": 0,
    "fuel_liters": 12.0,
    "ignition": true,
    "movement": true,
    "satellites": 14,
    "total_distance_km": 3058.015,
    "engine_hours": 56.405,
    "rpm": 920,
    "external_voltage": 12.271
  },
  {
    "imei": "353691842162892",
    "timestamp": "2025-06-10T12:10:35",
    "latitude": -1.27962,
    "longitude": 36.7942533,
    "speed": 9,
    "fuel_liters": 12.0,
    "ignition": true,
    "movement": true,
    "satellites": 14,
    "total_distance_km": 3058.028,
    "engine_hours": 56.405,
    "rpm": 890,
    "external_voltage": 14.178
  },
  {
    "imei": "353691842162892",
    "timestamp": "2025-06-10T12:22:06",
    "latitude": -1.2796816,
    "longitude": 36.79421,
    "speed": 0,
    "fuel_liters": 11.2,
    "ignition": false,
    "movement": false,
    "satellites": 15,
    "total_distance_km": 3058.622,
    "engine_hours": 56.405,
    "rpm": 940,
    "external_voltage": 12.983
  }
];

// Mock data for fuel theft metrics
const fuelTheftData = {
  totalVehicles: 4,
  monthlyTheftCount: 7,
  totalFuelStolen: 285.6, // in liters
  highRiskVehicles: [
    { name: "Fleet Vehicle 001", riskScore: 95, lastTheft: "2025-06-10" },
    { name: "Fleet Vehicle 003", riskScore: 87, lastTheft: "2025-06-09" },
    { name: "Fleet Vehicle 007", riskScore: 73, lastTheft: "2025-06-08" }
  ]
};

const Index = () => {
  const [currentData, setCurrentData] = useState(sampleData[sampleData.length - 1]);
  const [vehicleData, setVehicleData] = useState(sampleData);

  useEffect(() => {
    // Simulate real-time data updates
    const interval = setInterval(() => {
      const latestPoint = vehicleData[vehicleData.length - 1];
      setCurrentData(latestPoint);
    }, 5000);

    return () => clearInterval(interval);
  }, [vehicleData]);

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
                      Welcome John
                    </h1>
                    <p className="text-muted-foreground mt-2">
                      Real-time vehicle tracking and fuel monitoring system
                    </p>
                  </div>
                </div>
              </div>

              {/* Key Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                    <div className="text-2xl font-bold text-destructive">{fuelTheftData.totalFuelStolen}L</div>
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
              </div>

              {/* High Risk Vehicles Card */}
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
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Index;
