'use client';

import { useState, useEffect } from 'react';
import { DashboardHeader } from './components/dashboard-header';
import { SearchBar } from './components/search-bar';
import { IntegratedMarketCard } from './components/integrated-market-card';
import { useIntegratedMarkets } from '@/hooks/useIntegratedMarkets';
import { useGitHubMarkets } from '@/hooks/api/useGitHubAPI';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Search, Coins } from 'lucide-react';

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  const { 
    markets, 
    isLoading, 
    error, 
    createMarketToken,
    isCreatingToken,
    tokenCreated,
    tokenMarkets,
    hasRegisteredTokens,
    allProjectCoins
  } = useIntegratedMarkets();

  const githubMarkets = useGitHubMarkets();

  // Handle search with proper error handling and debouncing
  useEffect(() => {
    const searchMarkets = async () => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        setSearchError(null);
        try {
          const results = await githubMarkets.searchMarkets(searchQuery);
          setSearchResults(results.map(market => ({
            ...market,
            hasToken: false // Discovery search results don't have tokens yet
          })));
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
  }, [searchQuery]);

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
              <Search className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Search Results for "{searchQuery}"</h2>
              {isSearching && <Loader2 className="w-4 h-4 animate-spin" />}
            </div>
            
            {searchResults.length === 0 && !isSearching && !searchError && (
              <Card className="game-card">
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">
                    No repositories found for "{searchQuery}". Try searching for popular repositories like "facebook/react" or "microsoft/typescript".
                  </p>
                </CardContent>
              </Card>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.slice(0, 12).map((market) => (
                <IntegratedMarketCard
                  key={`search-${market.repo}-${market.prNumber}`}
                  market={market}
                  onCreateToken={handleCreateToken}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Default Dashboard View - Two Clear Sections */
          <div className="space-y-8">
            
            {/* Section 1: Existing Projects in Contract */}
            {hasRegisteredTokens && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-green-400" />
                  <h2 className="text-xl font-semibold">Active Token Markets</h2>
                  <span className="text-sm text-muted-foreground">
                    ({allProjectCoins?.length || 0} registered)
                  </span>
                </div>
                <p className="text-muted-foreground">
                  Live prediction markets with active tokens you can trade
                </p>
                
                {tokenMarkets && tokenMarkets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tokenMarkets.map((market) => (
                      <IntegratedMarketCard
                        key={`token-${market.repo}-${market.prNumber}`}
                        market={market}
                        onCreateToken={handleCreateToken}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="game-card">
                    <CardContent className="p-6 text-center">
                      <p className="text-muted-foreground">
                        No active PRs found for registered repositories. Check back later or create tokens for repositories with open PRs.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Section 2: Discovery Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-semibold">
                  {hasRegisteredTokens ? "Discover New Repositories" : "Create Your First Token"}
                </h2>
              </div>
              <p className="text-muted-foreground">
                {hasRegisteredTokens 
                  ? "Search for repositories above to create new prediction markets"
                  : "Search for popular GitHub repositories to get started with your first prediction market"
                }
              </p>
              
              {!hasRegisteredTokens && (
                <Card className="game-card border-blue-400/30 bg-blue-400/5">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <h3 className="font-semibold text-blue-400">🎯 How to get started:</h3>
                      <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                        <li>Search for a popular repository (e.g., "facebook/react")</li>
                        <li>Find a repository with open pull requests</li>
                        <li>Click "Create Token" to launch a prediction market</li>
                        <li>Start trading on the outcome of pull requests!</li>
                      </ol>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Loading contract data...
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}