'use client';

import { useState, useEffect } from 'react';
import { DashboardHeader } from './components/dashboard-header';
import { SearchBar } from './components/search-bar';
import { IntegratedMarketCard } from './components/integrated-market-card';
import { useIntegratedMarkets } from '@/hooks/useIntegratedMarkets';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Zap, Star, Clock, Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const { 
    markets, 
    isLoading, 
    error, 
    searchIntegratedMarkets, 
    createMarketToken,
    isCreatingToken,
    tokenCreated 
  } = useIntegratedMarkets();

  // Handle search
  useEffect(() => {
    const searchMarkets = async () => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        try {
          const results = await searchIntegratedMarkets(searchQuery);
          setSearchResults(results);
        } catch (err) {
          console.error('Search failed:', err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    };

    const timeoutId = setTimeout(searchMarkets, 500); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchIntegratedMarkets]);

  const displayMarkets = searchQuery.trim() ? searchResults : markets;

  const hotMarkets = displayMarkets.filter(m => m.change > 25);
  const trendingMarkets = displayMarkets.filter(m => m.volume > 8000);
  const newMarkets = displayMarkets.slice(-6);
  const endingSoonMarkets = displayMarkets.filter(m => 
    m.timeLeft.includes('1d') || m.timeLeft.includes('2d')
  );

  const handleCreateToken = (repository: string, name: string, symbol: string) => {
    createMarketToken(repository, name, symbol);
  };

  if (error) {
    return (
      <div className="space-y-8">
        <DashboardHeader />
        <Card className="game-card">
          <CardContent className="p-6 text-center">
            <p className="text-red-400">Error loading markets: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <DashboardHeader />
      
      <div className="space-y-6">
        <SearchBar 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* Token Creation Status */}
        {isCreatingToken && (
          <Card className="game-card border-yellow-400/50">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-yellow-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating token... Please confirm the transaction in your wallet.
              </div>
            </CardContent>
          </Card>
        )}
        
        {tokenCreated && (
          <Card className="game-card border-green-400/50">
            <CardContent className="p-4 text-center">
              <div className="text-green-400">
                🎉 Token created successfully! The market is now live.
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Results or Market Tabs */}
        {searchQuery.trim() ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">Search Results</h2>
              {isSearching && <Loader2 className="w-4 h-4 animate-spin" />}
            </div>
            
            {displayMarkets.length === 0 && !isSearching && (
              <Card className="game-card">
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">
                    No markets found for "{searchQuery}". Try searching for popular repositories like "facebook/react" or "microsoft/typescript".
                  </p>
                </CardContent>
              </Card>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayMarkets.slice(0, 12).map((market) => (
                <IntegratedMarketCard
                  key={`${market.repo}-${market.prNumber}`}
                  market={market}
                  onCreateToken={handleCreateToken}
                />
              ))}
            </div>
          </div>
        ) : (
          <Tabs defaultValue="trending" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-1/2">
              <TabsTrigger value="trending" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Trending
              </TabsTrigger>
              <TabsTrigger value="hot" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Hot
              </TabsTrigger>
              <TabsTrigger value="new" className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                New
              </TabsTrigger>
              <TabsTrigger value="ending" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Ending Soon
              </TabsTrigger>
            </TabsList>

            <TabsContent value="trending" className="space-y-4">
              {isLoading ? (
                <Card className="game-card">
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading trending markets...
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {trendingMarkets.slice(0, 9).map((market) => (
                    <IntegratedMarketCard
                      key={`${market.repo}-${market.prNumber}`}
                      market={market}
                      onCreateToken={handleCreateToken}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="hot" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hotMarkets.slice(0, 9).map((market) => (
                  <IntegratedMarketCard
                    key={`${market.repo}-${market.prNumber}`}
                    market={market}
                    onCreateToken={handleCreateToken}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="new" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {newMarkets.map((market) => (
                  <IntegratedMarketCard
                    key={`${market.repo}-${market.prNumber}`}
                    market={market}
                    onCreateToken={handleCreateToken}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="ending" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {endingSoonMarkets.slice(0, 9).map((market) => (
                  <IntegratedMarketCard
                    key={`${market.repo}-${market.prNumber}`}
                    market={market}
                    onCreateToken={handleCreateToken}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
