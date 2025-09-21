'use client';

import { useState, useEffect, useMemo } from 'react';
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

  // Memoize filtered markets to prevent unnecessary re-renders
  const filteredMarkets = useMemo(() => {
    const hotMarkets = displayMarkets.filter(m => m.change > 25);
    const trendingMarkets = displayMarkets.filter(m => m.volume > 8000);
    const newMarkets = displayMarkets.slice(-6);
    const endingSoonMarkets = displayMarkets.filter(m => 
      m.timeLeft.includes('1d') || m.timeLeft.includes('2d')
    );

    return {
      hot: hotMarkets,
      trending: trendingMarkets,
      new: newMarkets,
      ending: endingSoonMarkets,
    };
  }, [displayMarkets]);

  const handleCreateToken = (repository: string, name: string, symbol: string) => {
    createMarketToken(repository, name, symbol);
  };

  if (error) {
    return (
      <div className="space-y-8">
        <DashboardHeader />
        <Card className="game-card border-red-400/50">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold text-red-400">Error Loading Markets</h3>
              <p className="text-red-300">{error}</p>
              {error.includes('rate limit') && (
                <div className="mt-4 p-4 bg-yellow-400/10 border border-yellow-400/20 rounded-lg text-left">
                  <h4 className="font-semibold text-yellow-400 mb-2">How to fix this:</h4>
                  <ol className="text-sm text-yellow-300 space-y-1 list-decimal list-inside">
                    <li>Go to <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:underline">GitHub Settings → Personal Access Tokens</a></li>
                    <li>Click "Generate new token (classic)"</li>
                    <li>Select the "public_repo" scope</li>
                    <li>Copy the generated token</li>
                    <li>Create a <code className="bg-black/20 px-1 rounded">.env.local</code> file in the frontend folder</li>
                    <li>Add: <code className="bg-black/20 px-1 rounded">NEXT_PUBLIC_GITHUB_TOKEN=your_token_here</code></li>
                    <li>Restart the development server</li>
                  </ol>
                </div>
              )}
            </div>
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
                  {filteredMarkets.trending.slice(0, 9).map((market) => (
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
                {filteredMarkets.hot.slice(0, 9).map((market) => (
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
                {filteredMarkets.new.map((market) => (
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
                {filteredMarkets.ending.slice(0, 9).map((market) => (
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
