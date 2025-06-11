
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Gauge, MapPin, Fuel, LayoutDashboard } from "lucide-react";

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

interface VehicleMetricsProps {
  data: VehicleData;
}

const VehicleMetrics = ({ data }: VehicleMetricsProps) => {
  const batteryPercentage = ((data.external_voltage - 11) / (14.5 - 11)) * 100;
  const rpmPercentage = (data.rpm / 6000) * 100;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LayoutDashboard className="h-5 w-5" />
          Vehicle Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Vehicle Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Engine Status</label>
            <Badge variant={data.ignition ? "default" : "secondary"} className="w-full justify-center">
              {data.ignition ? "Running" : "Stopped"}
            </Badge>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Movement</label>
            <Badge variant={data.movement ? "default" : "outline"} className="w-full justify-center">
              {data.movement ? "Moving" : "Stationary"}
            </Badge>
          </div>
        </div>

        {/* Engine RPM */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1">
              <Gauge className="h-4 w-4" />
              Engine RPM
            </span>
            <span className="font-medium">{data.rpm} RPM</span>
          </div>
          <Progress value={rpmPercentage} className="h-2" />
        </div>

        {/* Battery Voltage */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Battery Voltage</span>
            <span className="font-medium">{data.external_voltage}V</span>
          </div>
          <Progress 
            value={Math.max(0, Math.min(100, batteryPercentage))} 
            className="h-2"
          />
        </div>

        {/* GPS Signal Strength */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              GPS Signal
            </span>
            <span className="font-medium">{data.satellites} satellites</span>
          </div>
          <Progress value={(data.satellites / 20) * 100} className="h-2" />
        </div>

        {/* Vehicle Information */}
        <div className="grid grid-cols-1 gap-4 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">IMEI:</span>
              <div className="font-mono text-xs">{data.imei}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Engine Hours:</span>
              <div className="font-semibold">{data.engine_hours.toFixed(1)}h</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Distance:</span>
              <div className="font-semibold">{data.total_distance_km.toFixed(1)} km</div>
            </div>
            <div>
              <span className="text-muted-foreground">Last Update:</span>
              <div className="font-semibold">{new Date(data.timestamp).toLocaleTimeString()}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleMetrics;
