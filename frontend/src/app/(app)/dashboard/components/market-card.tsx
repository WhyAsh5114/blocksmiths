import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GitBranch, Clock } from "lucide-react";
import { Market } from "../types";

interface MarketCardProps {
  market: Market;
}

export function MarketCard({ market }: MarketCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {market.tags[0] && (
                <Badge variant="secondary" className="text-xs">
                  {market.tags[0]}
                </Badge>
              )}
              {market.status === 'review' && (
                <Badge variant="outline" className="text-xs">
                  In Review
                </Badge>
              )}
            </div>
            
            <CardTitle className="text-xl">
              {market.repo} #{market.prNumber}
            </CardTitle>
            
            <CardDescription className="text-base">
              {market.title}
            </CardDescription>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <GitBranch className="w-4 h-4" />
                {market.author}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {market.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(`https://github.com/${market.repo}/pull/${market.prNumber}`, '_blank')}
            >
              View PR
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}