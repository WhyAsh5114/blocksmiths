import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { GitBranch, Users, Clock } from "lucide-react";
import { Market } from "../types";

interface MarketCardProps {
  market: Market;
}

export function MarketCard({ market }: MarketCardProps) {
  return (
    <Card className="game-card hover:scale-[1.02] transition-all duration-300">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/20 text-primary">
                {market.tags[0]}
              </Badge>
              {market.status === 'review' && (
                <Badge className="bg-accent/20 text-accent">
                  👀 In Review
                </Badge>
              )}
              <Badge variant="outline" className={`
                ${market.change > 30 ? 'text-green-400 border-green-400' : 
                  market.change > 15 ? 'text-yellow-400 border-yellow-400' : 
                  'text-blue-400 border-blue-400'}
              `}>
                +{market.change}% 📊
              </Badge>
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
                by {market.author}
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {market.participants} traders
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {market.timeLeft}
              </div>
            </div>
          </div>
          
          <div className="text-right space-y-2">
            <div className="text-2xl font-bold text-primary">
              {market.price} ETH
            </div>
            <div className="text-sm text-muted-foreground">
              Vol: ${market.volume.toLocaleString()}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Merge Probability</span>
            <span className="font-bold text-primary">
              {market.probability}% 
              {market.probability > 90 ? ' 🎯' : market.probability > 80 ? ' 🔮' : ' 🎲'}
            </span>
          </div>
          <Progress 
            value={market.probability} 
            className={`h-3 ${market.probability > 90 ? 'glow' : ''}`}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {market.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              📊 Details
            </Button>
            <Button 
              size="sm" 
              className={`
                ${market.probability > 90 ? 'glow' : 
                  market.probability > 80 ? 'glow-purple' : ''}
              `}
            >
              {market.probability > 90 ? '🎯' : 
               market.probability > 80 ? '⚡' : '💎'} Trade
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}