
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

interface VehicleData {
  latitude: number;
  longitude: number;
  speed: number;
  ignition: boolean;
  timestamp: string;
}

interface VehicleMapProps {
  data: VehicleData[];
  currentPosition: VehicleData;
  fullSize?: boolean;
}

const VehicleMap = ({ data, currentPosition, fullSize = false }: VehicleMapProps) => {
  const cardHeight = fullSize ? "h-[600px]" : "h-[400px]";

  return (
    <Card className={`${cardHeight} overflow-hidden hover:shadow-lg transition-shadow`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Vehicle Location
          </CardTitle>
          <Badge variant={currentPosition.ignition ? "default" : "secondary"}>
            {currentPosition.ignition ? "Active" : "Parked"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0 h-full">
        <div className="relative w-full h-full bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950">
          {/* Map Placeholder with Route Visualization */}
          <div className="absolute inset-4 bg-white dark:bg-gray-800 rounded-lg shadow-inner overflow-hidden">
            {/* Simulated Map Grid */}
            <div className="absolute inset-0 opacity-10">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            {/* Route Path */}
            <svg className="absolute inset-0 w-full h-full">
              <path
                d={`M 50,200 Q 100,150 150,200 Q 200,250 250,200 Q 300,150 350,200`}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="3"
                strokeDasharray="5,5"
                className="animate-pulse"
              />
            </svg>

            {/* Vehicle Position Marker */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className={`w-4 h-4 rounded-full ${
                currentPosition.ignition ? 'bg-green-500' : 'bg-red-500'
              } shadow-lg animate-pulse`}>
                <div className={`w-8 h-8 rounded-full absolute -top-2 -left-2 ${
                  currentPosition.ignition ? 'bg-green-500/20' : 'bg-red-500/20'
                } animate-ping`}></div>
              </div>
            </div>

            {/* GPS Coordinates Display */}
            <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
              <div className="space-y-1 text-sm">
                <div className="font-semibold">Current Position</div>
                <div className="text-muted-foreground">
                  Lat: {currentPosition.latitude.toFixed(6)}
                </div>
                <div className="text-muted-foreground">
                  Lng: {currentPosition.longitude.toFixed(6)}
                </div>
                <div className="text-muted-foreground">
                  Speed: {currentPosition.speed} km/h
                </div>
              </div>
            </div>

            {/* Speed Indicator */}
            <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
              <div className="text-center">
                <div className="text-2xl font-bold">{currentPosition.speed}</div>
                <div className="text-xs text-muted-foreground">km/h</div>
              </div>
            </div>

            {/* Last Update Time */}
            <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
              <div className="text-xs text-muted-foreground">
                Last update: {new Date(currentPosition.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleMap;
