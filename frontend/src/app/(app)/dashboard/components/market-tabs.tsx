import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Zap, Star, Clock } from "lucide-react";
import { MarketCard } from "./market-card";
import { mockMarkets } from "../data";

interface MarketTabsProps {
  searchQuery: string;
}

export function MarketTabs({ searchQuery }: MarketTabsProps) {
  // Filter markets based on search query
  const filteredMarkets = mockMarkets.filter(market => 
    market.repo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    market.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    market.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const hotMarkets = filteredMarkets.filter(m => m.change > 25);
  const trendingMarkets = filteredMarkets.filter(m => m.volume > 8000);
  const newMarkets = filteredMarkets.slice(-3);
  const endingSoonMarkets = filteredMarkets.filter(m => 
    m.timeLeft.includes('1d') || m.timeLeft.includes('2d')
  );

  return (
    <Tabs defaultValue="hot" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4 lg:w-1/2">
        <TabsTrigger value="hot" className="flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Hot 🔥
        </TabsTrigger>
        <TabsTrigger value="trending" className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Trending 📈
        </TabsTrigger>
        <TabsTrigger value="new" className="flex items-center gap-2">
          <Star className="w-4 h-4" />
          New ⭐
        </TabsTrigger>
        <TabsTrigger value="ending" className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Ending ⏰
        </TabsTrigger>
      </TabsList>

      <TabsContent value="hot" className="space-y-6">
        <div className="grid gap-6">
          {hotMarkets.length > 0 ? (
            hotMarkets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))
          ) : (
            <EmptyState 
              title="No Hot Markets Found"
              description="Try adjusting your search query to find hot markets"
            />
          )}
        </div>
      </TabsContent>

      <TabsContent value="trending" className="space-y-6">
        <div className="grid gap-6">
          {trendingMarkets.length > 0 ? (
            trendingMarkets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))
          ) : (
            <EmptyState 
              title="No Trending Markets Found"
              description="Markets with high volume and momentum will appear here"
            />
          )}
        </div>
      </TabsContent>

      <TabsContent value="new" className="space-y-6">
        <div className="grid gap-6">
          {newMarkets.length > 0 ? (
            newMarkets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))
          ) : (
            <EmptyState 
              title="No New Markets Found"
              description="Fresh PR prediction markets will appear here"
            />
          )}
        </div>
      </TabsContent>

      <TabsContent value="ending" className="space-y-6">
        <div className="grid gap-6">
          {endingSoonMarkets.length > 0 ? (
            endingSoonMarkets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))
          ) : (
            <EmptyState 
              title="No Markets Ending Soon"
              description="Markets closing soon will appear here - last chance to trade!"
            />
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
}

function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <Card className="game-card">
      <CardContent className="p-12 text-center">
        <div className="w-16 h-16 text-muted-foreground mx-auto mb-4">
          🔍
        </div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}