import { useState, useEffect } from 'react';
import { useGitHubMarkets } from './api/useGitHubAPI';
import { useProjectCoinFactory, ProjectInfo } from './web3/useProjectCoin';
import { Market } from '@/app/(app)/dashboard/types';

export interface IntegratedMarket extends Market {
  hasToken: boolean;
  tokenAddress?: string;
  totalSupply?: string;
  marketCap?: number;
}

export function useIntegratedMarkets() {
  const [markets, setMarkets] = useState<IntegratedMarket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const githubMarkets = useGitHubMarkets();
  const projectCoinFactory = useProjectCoinFactory();

  // Combine GitHub data with Web3 data
  const integrateMarkets = async (): Promise<IntegratedMarket[]> => {
    setIsLoading(true);
    setError(null);

    try {
      // Load GitHub markets
      await githubMarkets.loadTrendingMarkets();
      
      // Get existing project coins from factory
      const projectCoins = projectCoinFactory.allProjects || [];
      
      // Create a map of repository -> token address
      const tokenMap = new Map<string, { address: string; totalSupply: string }>();
      projectCoins.forEach((project: ProjectInfo) => {
        tokenMap.set(`${project.githubOwner}/${project.githubRepo}`, {
          address: project.tokenAddress,
          totalSupply: '0', // We'll need to fetch this separately
        });
      });

      // Integrate the data
      const integratedMarkets: IntegratedMarket[] = githubMarkets.markets.map((market: Market) => {
        const tokenInfo = tokenMap.get(market.repo);
        const hasToken = !!tokenInfo;
        
        // Calculate mock market cap if token exists
        const marketCap = hasToken && tokenInfo 
          ? parseFloat(tokenInfo.totalSupply) * market.price * 1000 // Mock calculation
          : undefined;

        return {
          ...market,
          hasToken,
          tokenAddress: tokenInfo?.address,
          totalSupply: tokenInfo?.totalSupply,
          marketCap,
        };
      });

      setMarkets(integratedMarkets);
      return integratedMarkets;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to integrate markets';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Search markets with integrated data
  const searchIntegratedMarkets = async (query: string): Promise<IntegratedMarket[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const searchResults = await githubMarkets.searchMarkets(query);
      const projectCoins = projectCoinFactory.allProjects || [];
      
      const tokenMap = new Map<string, { address: string; totalSupply: string }>();
      projectCoins.forEach((project: ProjectInfo) => {
        tokenMap.set(`${project.githubOwner}/${project.githubRepo}`, {
          address: project.tokenAddress,
          totalSupply: '0', // We'll need to fetch this separately
        });
      });

      const integratedResults: IntegratedMarket[] = searchResults.map((market: Market) => {
        const tokenInfo = tokenMap.get(market.repo);
        const hasToken = !!tokenInfo;
        
        const marketCap = hasToken && tokenInfo 
          ? parseFloat(tokenInfo.totalSupply) * market.price * 1000
          : undefined;

        return {
          ...market,
          hasToken,
          tokenAddress: tokenInfo?.address,
          totalSupply: tokenInfo?.totalSupply,
          marketCap,
        };
      });

      return integratedResults;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search integrated markets';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new project coin for a repository
  const createMarketToken = async (
    repository: string, 
    name: string, 
    symbol: string,
    treasury?: string,
    rewardPool?: string
  ) => {
    try {
      await projectCoinFactory.createProjectCoin(repository, name, symbol, treasury, rewardPool);
      // Refresh markets after creation
      setTimeout(() => integrateMarkets(), 2000); // Wait for transaction confirmation
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create market token');
    }
  };

  // Initialize on mount
  useEffect(() => {
    integrateMarkets();
  }, []);

  return {
    markets,
    isLoading: isLoading || githubMarkets.isLoading || projectCoinFactory.isLoadingProjects,
    error: error || githubMarkets.error,
    
    // Functions
    integrateMarkets,
    searchIntegratedMarkets,
    createMarketToken,
    
    // Web3 states
    isCreatingToken: projectCoinFactory.isPending,
    isConfirmingToken: projectCoinFactory.isConfirming,
    tokenCreated: projectCoinFactory.isSuccess,
    
    // Factory data
    allProjectCoins: projectCoinFactory.allProjects,
  };
}