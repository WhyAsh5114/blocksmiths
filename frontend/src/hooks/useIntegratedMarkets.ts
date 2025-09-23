import { useState, useEffect } from 'react';
import { useGitHubMarkets } from './api/useGitHubAPI';
import { useProjectCoinFactory, useProjectCoinContract, ProjectInfo } from './web3/useProjectCoin';
import { Market } from '@/app/(app)/dashboard/types';
import { formatEther } from 'viem';

/*
 * IMPROVEMENT SUMMARY: Factory-First Market Discovery
 * 
 * BEFORE: 
 * - Hardcoded popular repos → GitHub API → Try to match with factory tokens
 * - Showed "fake" markets for repos without tokens
 * - Wasted API calls on repos without actual trading
 * 
 * AFTER:
 * - Factory contract → Real registered tokens → GitHub API for those specific repos
 * - Shows only real markets users can trade
 * - Discovery mode only when no tokens exist yet
 * - Clear separation between real markets and discovery
 */

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

  /*
   * DESIGN PHILOSOPHY: Factory-First Discovery
   * 
   * Instead of showing hardcoded popular repos (that may not have tokens),
   * we prioritize ACTUAL registered tokens from the factory contract.
   * 
   * Benefits:
   * ✅ Shows real markets users can trade
   * ✅ No "fake" markets without tokens
   * ✅ Efficient GitHub API usage
   * ✅ True decentralized discovery
   * 
   * Flow:
   * 1. Load registered tokens from factory
   * 2. Fetch GitHub PR data for those specific repos
   * 3. Show discovery mode only when no tokens exist yet
   */

  // Factory-First Market Discovery
  const fetchIntegratedMarkets = async (): Promise<IntegratedMarket[]> => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Get all registered tokens from factory
      const projectCoins = projectCoinFactory.allProjects || [];
      
      if (projectCoins.length === 0) {
        // No registered tokens yet - return empty array, don't auto-load discovery
        setMarkets([]);
        return [];
      }

      // Fetch GitHub data for each registered token
      const marketArrays = await Promise.all(
        projectCoins.map(async (project: ProjectInfo) => {
          const repoName = `${project.githubOwner}/${project.githubRepo}`;
          
          try {
            // Fetch real GitHub PR data for this specific repository
            const repoMarkets = await githubMarkets.searchMarkets(repoName);
            
            // If we found PRs for this repo, create integrated markets
            if (repoMarkets.length > 0) {
              return repoMarkets.map((market: Market): IntegratedMarket => ({
                ...market,
                hasToken: true,
                tokenAddress: project.tokenAddress,
                totalSupply: '1000000', // TODO: Fetch from contract
                mintCost: '0.001', // TODO: Fetch from contract
                marketCap: parseFloat('1000000') * market.price,
              }));
            } else {
              // Create a placeholder market for tokens without active PRs
              return [{
                id: parseInt(project.tokenAddress.slice(-8), 16), // Pseudo-random ID from address
                repo: repoName,
                prNumber: 0,
                title: `${project.name} - No active PRs`,
                author: project.creator,
                probability: 0,
                price: 0,
                change: 0,
                volume: 0,
                status: 'open' as const,
                tags: ['Token Available'],
                timeLeft: 'N/A',
                participants: 0,
                hasToken: true,
                tokenAddress: project.tokenAddress,
                totalSupply: '0',
                mintCost: '0',
                marketCap: 0,
              } as IntegratedMarket];
            }
          } catch (error) {
            console.warn(`Failed to fetch GitHub data for ${repoName}:`, error);
            // Return placeholder on error
            return [{
              id: parseInt(project.tokenAddress.slice(-8), 16),
              repo: repoName,
              prNumber: 0,
              title: `${project.name} - GitHub data unavailable`,
              author: project.creator,
              probability: 0,
              price: 0,
              change: 0,
              volume: 0,
              status: 'open' as const,
              tags: ['Token Available'],
              timeLeft: 'N/A',
              participants: 0,
              hasToken: true,
              tokenAddress: project.tokenAddress,
              totalSupply: '0',
              mintCost: '0',
              marketCap: 0,
            } as IntegratedMarket];
          }
        })
      );

      const flattenedMarkets: IntegratedMarket[] = marketArrays.flat();
      setMarkets(flattenedMarkets);
      return flattenedMarkets;

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
              // Use real contract data when available
              // These will be filled by the ProjectCoin contract hook
              totalSupply = '0'; // Will be loaded from contract
              mintCost = '0'; // Will be loaded from contract
              marketCap = 0; // Not calculated without real trading data
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
      setTimeout(() => fetchIntegratedMarkets(), 2000); // Wait for transaction confirmation
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create market token');
    }
  };

  // Initialize on mount
  useEffect(() => {
    // Load factory data and build markets
    if (!projectCoinFactory.isLoadingProjects && projectCoinFactory.allProjects) {
      fetchIntegratedMarkets();
    }
  }, [projectCoinFactory.isLoadingProjects, projectCoinFactory.allProjects?.length]);

  // Get only markets that have actual tokens (for a cleaner "real markets" view)
  const getTokenMarkets = (): IntegratedMarket[] => {
    return markets.filter(market => market.hasToken);
  };

  // Get discovery markets (popular repos without tokens for new token creation)
  const getDiscoveryMarkets = (): IntegratedMarket[] => {
    return markets.filter(market => !market.hasToken);
  };

  return {
    markets,
    isLoading: isLoading || githubMarkets.isLoading || projectCoinFactory.isLoadingProjects,
    error: error || githubMarkets.error || projectCoinFactory.contractError || projectCoinFactory.writeError,
    
    // Functions
    fetchIntegratedMarkets,
    searchIntegratedMarkets,
    createMarketToken,
    
    // Web3 states
    isCreatingToken: projectCoinFactory.isPending,
    isConfirmingToken: projectCoinFactory.isConfirming,
    tokenCreated: projectCoinFactory.isSuccess,
    
    // Factory data
    allProjectCoins: projectCoinFactory.allProjects,
    
    // New filtered views for better UX
    tokenMarkets: getTokenMarkets(),
    discoveryMarkets: getDiscoveryMarkets(),
    hasRegisteredTokens: projectCoinFactory.allProjects && projectCoinFactory.allProjects.length > 0,
  };
}