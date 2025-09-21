'use client';

import { useState, useEffect } from 'react';
import { DashboardHeader } from './components/dashboard-header';
import { SearchBar } from './components/search-bar';
import { IntegratedMarketCard } from './components/integrated-market-card';
import { useIntegratedMarkets } from '@/hooks/useIntegratedMarkets';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  const { 
    markets, 
    isLoading, 
    error, 
    searchIntegratedMarkets, 
    createMarketToken,
    isCreatingToken,
    tokenCreated,
    tokenMarkets,
    discoveryMarkets,
    hasRegisteredTokens
  } = useIntegratedMarkets();

  // Handle search with proper error handling
  useEffect(() => {
    const searchMarkets = async () => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        setSearchError(null);
        try {
          const results = await searchIntegratedMarkets(searchQuery);
          setSearchResults(results);
        } catch (err) {
          console.error('Search failed:', err);
          setSearchError(err instanceof Error ? err.message : 'Search failed');
          setSearchResults([]); // Clear results on error
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setSearchError(null);
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchMarkets, 500); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchIntegratedMarkets]);

  const displayMarkets = searchQuery.trim() ? searchResults : markets;

  const handleCreateToken = (repository: string, name: string, symbol: string) => {
    createMarketToken(repository, name, symbol);
  };

  return (
    <div className="space-y-8">
      <DashboardHeader />
      
      <div className="space-y-6">
        {/* Search Bar - Always visible */}
        <SearchBar 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* Global Error Display */}
        {error && (
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
        )}

        {/* Search Error Display */}
        {searchError && (
          <Card className="game-card border-red-400/50">
            <CardContent className="p-4 text-center">
              <div className="text-red-400">
                Search error: {searchError}
              </div>
            </CardContent>
          </Card>
        )}

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

        {/* Main Content */}
        {searchQuery.trim() ? (
          /* Search Results */
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">Search Results for "{searchQuery}"</h2>
              {isSearching && <Loader2 className="w-4 h-4 animate-spin" />}
            </div>
            
            {displayMarkets.length === 0 && !isSearching && !searchError && (
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
          /* Default View */
          <div className="space-y-6">
            {/* Real Markets Section */}
            {hasRegisteredTokens && tokenMarkets && tokenMarkets.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">🎯 Active Markets</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tokenMarkets.map((market) => (
                    <IntegratedMarketCard
                      key={`${market.repo}-${market.prNumber}`}
                      market={market}
                      onCreateToken={handleCreateToken}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Discovery Section */}
            {(!hasRegisteredTokens || (discoveryMarkets && discoveryMarkets.length > 0)) && !error && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">
                    {hasRegisteredTokens ? "🔍 Discover New Markets" : "🚀 Create Your First Market"}
                  </h2>
                  <p className="text-muted-foreground">
                    {hasRegisteredTokens 
                      ? "Popular repositories where you can create new prediction markets"
                      : "Get started by creating prediction markets for popular GitHub repositories"
                    }
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(hasRegisteredTokens ? discoveryMarkets : displayMarkets)?.slice(0, 9).map((market) => (
                    <IntegratedMarketCard
                      key={`${market.repo}-${market.prNumber}`}
                      market={market}
                      onCreateToken={handleCreateToken}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (!displayMarkets || displayMarkets.length === 0) && !error && (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Loading markets...
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && (!displayMarkets || displayMarkets.length === 0) && (
              <Card className="game-card">
                <CardContent className="p-6 text-center">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">No Markets Available</h3>
                    <p className="text-muted-foreground">
                      Try refreshing the page or check your network connection.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}