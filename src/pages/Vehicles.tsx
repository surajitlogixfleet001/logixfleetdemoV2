import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
const vehiclesData = [
  {
    imei: "353691842162892",
    name: "Fleet Vehicle 001",
    license_plate: "KCA 123A",
    fuel_capacity: 60.0,
    vehicle_type: "truck",
    is_active: true,
    driver_name: "John Doe",
    driver_phone: "+254701234567",
    last_position: {
      latitude: -1.286389,
      longitude: 36.817223,
      timestamp: "2025-06-10T12:22:06",
      fuel_level: 12.0,
      speed: 45
    },
    is_online: true
  },
  {
    imei: "353691842162893",
    name: "Fleet Vehicle 002",
    license_plate: "KCB 456B",
    fuel_capacity: 50.0,
    vehicle_type: "car",
    is_active: true,
    driver_name: "Jane Smith",
    driver_phone: "+254701234568",
    last_position: {
      latitude: -1.263056,
      longitude: 36.808889,
      timestamp: "2025-06-10T11:15:30",
      fuel_level: 25.5,
      speed: 0
    },
    is_online: false
  },
  {
    imei: "353691842162894",
    name: "Fleet Vehicle 003",
    license_plate: "KCC 789C",
    fuel_capacity: 80.0,
    vehicle_type: "bus",
    is_active: true,
    driver_name: "Mike Johnson",
    driver_phone: "+254701234569",
    last_position: {
      latitude: -1.319167,
      longitude: 36.914722,
      timestamp: "2025-06-10T12:18:45",
      fuel_level: 8.2,
      speed: 30
    },
    is_online: true
  },
  {
    imei: "353691842162895",
    name: "Fleet Vehicle 004",
    license_plate: "KCD 012D",
    fuel_capacity: 45.0,
    vehicle_type: "car",
    is_active: false,
    driver_name: "Sarah Wilson",
    driver_phone: "+254701234570",
    last_position: {
      latitude: -1.284444,
      longitude: 36.823333,
      timestamp: "2025-06-09T16:30:00",
      fuel_level: 15.7,
      speed: 0
    },
    is_online: false
  }
];

const Vehicles = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredVehicles = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return vehiclesData.filter((v) => {
      return (
        v.name.toLowerCase().includes(term) ||
        v.imei.toLowerCase().includes(term) ||
        v.license_plate.toLowerCase().includes(term) ||
        v.vehicle_type.toLowerCase().includes(term) ||
        v.driver_name.toLowerCase().includes(term) ||
        v.driver_phone.toLowerCase().includes(term) ||
        (v.is_active ? "active" : "inactive").includes(term) ||
        (v.is_online ? "online" : "offline").includes(term)
      );
    });
  }, [searchTerm]);

  const getVehicleTypeDisplay = (type: string) => {
    const types = { car: "Car", truck: "Truck", bus: "Bus", motorcycle: "Motorcycle", other: "Other" };
    return types[type as keyof typeof types] || "Unknown";
  };

  const getStatusBadge = (vehicle: typeof vehiclesData[0]) => {
    if (!vehicle.is_active) return <Badge variant="destructive" className="text-xs">INACTIVE</Badge>;
    if (vehicle.is_online) return <Badge variant="default" className="text-xs">ONLINE</Badge>;
    return <Badge variant="secondary" className="text-xs">OFFLINE</Badge>;
  };


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
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Vehicles</h1>
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
                          <TableRow key={vehicle.imei} className="hover:bg-muted/50">
                            <TableCell>
                              <div>
                                <div className="font-semibold">{vehicle.name}</div>
                                <div className="text-xs text-muted-foreground font-mono">{vehicle.imei}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">{getVehicleTypeDisplay(vehicle.vehicle_type)}</Badge>
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
                </CardContent>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Vehicles;
