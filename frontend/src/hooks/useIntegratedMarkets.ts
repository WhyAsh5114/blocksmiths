import { useState, useEffect } from 'react';
import { useGitHubMarkets } from './api/useGitHubAPI';
import { useProjectCoinFactory, useProjectCoinContract, ProjectInfo } from './web3/useProjectCoin';
import { Market } from '@/app/(app)/dashboard/types';
import { formatEther } from 'viem';

export interface IntegratedMarket extends Market {
  hasToken: boolean;
  tokenAddress?: string;
  totalSupply?: string;
  marketCap?: number;
  mintCost?: string;
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
      
      // Create a map of repository -> token info
      const tokenMap = new Map<string, ProjectInfo>();
      projectCoins.forEach((project: ProjectInfo) => {
        const repoKey = `${project.githubOwner}/${project.githubRepo}`;
        tokenMap.set(repoKey, project);
      });

      // Integrate the data
      const integratedMarkets: IntegratedMarket[] = await Promise.all(
        githubMarkets.markets.map(async (market: Market) => {
          const tokenInfo = tokenMap.get(market.repo);
          const hasToken = !!tokenInfo;
          
          let totalSupply = '0';
          let marketCap: number | undefined;
          let mintCost = '0';
          
          // If token exists, fetch real contract data
          if (hasToken && tokenInfo) {
            try {
              // This would ideally use a hook to get token contract data
              // For now, we'll use the tokenAddress to indicate a token exists
              totalSupply = '1000000'; // Placeholder - would need actual contract call
              mintCost = '0.001'; // Placeholder - would need actual contract call
              
              // Calculate market cap: totalSupply * price
              const supply = parseFloat(totalSupply);
              marketCap = supply * market.price;
            } catch (contractError) {
              console.warn(`Failed to fetch contract data for ${market.repo}:`, contractError);
            }
          }

          return {
            ...market,
            hasToken,
            tokenAddress: tokenInfo?.tokenAddress,
            totalSupply,
            marketCap,
            mintCost,
          } as IntegratedMarket;
        })
      );

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
      
      const tokenMap = new Map<string, ProjectInfo>();
      projectCoins.forEach((project: ProjectInfo) => {
        const repoKey = `${project.githubOwner}/${project.githubRepo}`;
        tokenMap.set(repoKey, project);
      });

      const integratedResults: IntegratedMarket[] = await Promise.all(
        searchResults.map(async (market: Market) => {
          const tokenInfo = tokenMap.get(market.repo);
          const hasToken = !!tokenInfo;
          
          let totalSupply = '0';
          let marketCap: number | undefined;
          let mintCost = '0';
          
          if (hasToken && tokenInfo) {
            try {
              // Fetch real contract data if token exists
              totalSupply = '1000000'; // Placeholder
              mintCost = '0.001'; // Placeholder
              marketCap = parseFloat(totalSupply) * market.price;
            } catch (contractError) {
              console.warn(`Failed to fetch contract data for ${market.repo}:`, contractError);
            }
          }

          return {
            ...market,
            hasToken,
            tokenAddress: tokenInfo?.tokenAddress,
            totalSupply,
            marketCap,
            mintCost,
          } as IntegratedMarket;
        })
      );

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
    error: error || githubMarkets.error || projectCoinFactory.contractError || projectCoinFactory.writeError,
    
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