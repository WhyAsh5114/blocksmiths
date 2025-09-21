import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Rocket } from "lucide-react";

export function DashboardHeader() {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          🎯 Trading Arena
        </h1>
        <p className="text-muted-foreground">
          Trade GitHub PR predictions and earn rewards
        </p>
      </div>
      
      <div className="flex items-center gap-3">
        <Badge className="bg-primary/20 text-primary glow px-4 py-2">
          <Activity className="w-4 h-4 mr-2" />
          Live Markets: 1,284
        </Badge>
        <Button className="glow">
          <Rocket className="w-4 h-4 mr-2" />
          Create Market
        </Button>
      </div>
    </div>
  );
}