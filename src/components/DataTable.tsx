
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface VehicleData {
  imei: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  speed: number;
  fuel_liters: number;
  ignition: boolean;
  movement: boolean;
  satellites: number;
  total_distance_km: number;
  engine_hours: number;
  rpm: number;
  external_voltage: number;
}

interface DataTableProps {
  data: VehicleData[];
}

const DataTable = ({ data }: DataTableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vehicle Tracking Data</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Speed</TableHead>
                <TableHead>Fuel</TableHead>
                <TableHead>RPM</TableHead>
                <TableHead>Voltage</TableHead>
                <TableHead>Satellites</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.slice().reverse().map((row, index) => (
                <TableRow key={index} className="hover:bg-muted/50">
                  <TableCell className="font-mono text-xs">
                    {new Date(row.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Badge variant={row.ignition ? "default" : "secondary"} className="text-xs">
                        {row.ignition ? "ON" : "OFF"}
                      </Badge>
                      {row.movement && (
                        <Badge variant="outline" className="text-xs">
                          MOVING
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {row.latitude.toFixed(6)}, {row.longitude.toFixed(6)}
                  </TableCell>
                  <TableCell>
                    <span className={row.speed > 0 ? "font-semibold" : "text-muted-foreground"}>
                      {row.speed} km/h
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={row.fuel_liters < 15 ? "text-orange-600 font-semibold" : ""}>
                      {row.fuel_liters}L
                    </span>
                  </TableCell>
                  <TableCell>{row.rpm}</TableCell>
                  <TableCell>
                    <span className={row.external_voltage < 12.5 ? "text-red-600 font-semibold" : ""}>
                      {row.external_voltage}V
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={row.satellites < 10 ? "text-yellow-600" : "text-green-600"}>
                      {row.satellites}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default DataTable;
