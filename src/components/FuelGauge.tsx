
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Fuel } from "lucide-react";

interface FuelGaugeProps {
  currentFuel: number;
  maxCapacity?: number;
}

const FuelGauge = ({ currentFuel, maxCapacity = 60 }: FuelGaugeProps) => {
  const fuelPercentage = (currentFuel / maxCapacity) * 100;
  
  const getFuelStatus = (percentage: number) => {
    if (percentage > 50) return { status: "Good", color: "text-green-600" };
    if (percentage > 25) return { status: "Medium", color: "text-yellow-600" };
    return { status: "Low", color: "text-red-600" };
  };

  const { status, color } = getFuelStatus(fuelPercentage);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fuel className="h-5 w-5" />
          Fuel Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Circular Fuel Gauge */}
        <div className="relative w-48 h-48 mx-auto">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="8"
            />
            {/* Fuel level circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={fuelPercentage > 25 ? "hsl(var(--primary))" : "#ef4444"}
              strokeWidth="8"
              strokeDasharray={`${fuelPercentage * 2.51} 251`}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-bold">{currentFuel}L</div>
            <div className="text-sm text-muted-foreground">
              {fuelPercentage.toFixed(1)}%
            </div>
            <div className={`text-sm font-medium ${color}`}>
              {status}
            </div>
          </div>
        </div>

        {/* Linear Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Fuel Level</span>
            <span>{currentFuel}L / {maxCapacity}L</span>
          </div>
          <Progress 
            value={fuelPercentage} 
            className="h-3"
          />
        </div>

        {/* Fuel Statistics */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold">{maxCapacity}L</div>
            <div className="text-xs text-muted-foreground">Tank Capacity</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{(maxCapacity - currentFuel).toFixed(1)}L</div>
            <div className="text-xs text-muted-foreground">Space Available</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FuelGauge;
