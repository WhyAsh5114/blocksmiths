import { useState, useEffect, useCallback } from 'react';
import { useAccount, useConfig } from 'wagmi';
import { useProjectCoinFactory } from './web3/useProjectCoin';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { projectCoinAbi } from '@/lib/wagmi-generated';
import { parseEther, formatEther } from 'viem';
import { readContract } from '@wagmi/core';
import PRStatusService from '@/lib/prStatusService';

export interface PortfolioHolding {
  tokenAddress: string;
  repository: string;
  name: string;
  symbol: string;
  balance: number;
  totalInvested: number;
  estimatedValue: number;
  prStatus?: 'open' | 'merged' | 'closed';
  prNumber?: number;
  redemptionInfo?: {
    canRedeem: boolean;
    baseValue: number;
    rewardMultiplier: number;
    totalValue: number;
    statusMessage: string;
  };
}

export function useUserPortfolio() {
  const { address, isConnected } = useAccount();
  const config = useConfig();
  const [portfolio, setPortfolio] = useState<PortfolioHolding[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingPRStatus, setIsCheckingPRStatus] = useState(false);
  const projectCoinFactory = useProjectCoinFactory();

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const isTransacting = isPending || isConfirming;

  // Load portfolio function with useCallback to prevent infinite re-renders
  const loadPortfolio = useCallback(async () => {
    if (!address || !projectCoinFactory.allProjects) {
      setPortfolio([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get user's portfolio by checking balances in all registered project coins
      const portfolioPromises = projectCoinFactory.allProjects.map(async (project) => {
        try {
          // Get user's balance for this token using readContract
          const balance = await readContract(config, {
            address: project.tokenAddress as `0x${string}`,
            abi: projectCoinAbi,
            functionName: "balanceOf",
            args: [address],
          });

          // Only include tokens where user has a balance
          if (balance && balance > 0n) {
            const balanceInEther = parseFloat(formatEther(balance));
            const repository = `${project.githubOwner}/${project.githubRepo}`;
            
            // Estimate invested amount (this would ideally come from transaction history)
            const estimatedTokenPrice = 0.001; // Base estimate
            const totalInvested = balanceInEther * estimatedTokenPrice;
            
            return {
              tokenAddress: project.tokenAddress,
              repository,
              name: project.name,
              symbol: project.symbol,
              balance: balanceInEther,
              totalInvested,
              estimatedValue: totalInvested, // For now, assume no price change
              prStatus: 'open' as const,
              prNumber: undefined, // Would need to be determined from project data
            } as PortfolioHolding;
          }
          
          return null;
        } catch (error) {
          console.warn(`Failed to check balance for ${project.name}:`, error);
          return null;
        }
      });

      const portfolioResults = await Promise.all(portfolioPromises);
      const validHoldings = portfolioResults.filter(Boolean) as PortfolioHolding[];
      
      setPortfolio(validHoldings);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load portfolio');
    } finally {
      setIsLoading(false);
    }
  }, [address, config, projectCoinFactory.allProjects]);

  // Load portfolio and check PR statuses
  useEffect(() => {
    if (!isConnected || !address) {
      setPortfolio([]);
      return;
    }

    // Only load if factory is not loading
    if (!projectCoinFactory.isLoadingProjects) {
      loadPortfolio();
    }
  }, [isConnected, address, loadPortfolio, isSuccess, projectCoinFactory.isLoadingProjects]);

  const checkPRStatusesAndUpdateRedemption = useCallback(async (holdings: PortfolioHolding[]) => {
    setIsCheckingPRStatus(true);
    
    try {
      const updatedHoldings = await Promise.all(
        holdings.map(async (holding) => {
          if (!holding.prNumber) return holding;
          
          // Check PR status
          const prStatus = await PRStatusService.checkPRStatus(holding.repository, holding.prNumber);
          
          // Calculate redemption value
          const avgTokenPrice = 0.001; // Base token price
          const estimatedRewardPool = 0.05; // Mock reward pool (5% of total invested)
          const totalSupply = 1000000; // Mock total supply
          
          const redemptionInfo = PRStatusService.calculateRedemptionValue(
            holding.balance,
            avgTokenPrice,
            prStatus,
            totalSupply,
            estimatedRewardPool
          );
          
          return {
            ...holding,
            prStatus: redemptionInfo.prStatus,
            redemptionInfo
          };
        })
      );
      
      setPortfolio(updatedHoldings);
    } catch (error) {
      console.error('Error checking PR statuses:', error);
    } finally {
      setIsCheckingPRStatus(false);
    }
  }, []);

  // Enhanced redemption function with reward calculation
  const redeemTokens = async (tokenAddress: string, amount: string) => {
    if (!address || !amount || parseFloat(amount) <= 0) {
      throw new Error('Invalid redemption amount');
    }

    // Call the new redeem function that burns tokens and returns ETH
    writeContract({
      address: tokenAddress as `0x${string}`,
      abi: projectCoinAbi,
      functionName: 'redeem',
      args: [parseEther(amount)]
    });
  };

  // Manually refresh PR statuses
  const refreshPRStatuses = async () => {
    if (portfolio.length > 0) {
      await checkPRStatusesAndUpdateRedemption(portfolio);
    }
  };

  return {
    portfolio,
    isLoading,
    error,
    isCheckingPRStatus,
    redeemTokens,
    isTransacting,
    refreshPortfolio: loadPortfolio,
    refreshPRStatuses,
  };
}

// Hook for individual token balance (simpler version)
export function useTokenBalance(tokenAddress: string) {
  const { address } = useAccount();

  const { data: balance, refetch } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: projectCoinAbi,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    query: { enabled: Boolean(address && tokenAddress) }
  });

  return {
    balance: balance ? formatEther(balance as bigint) : '0',
    refetch
  };
}

// Hook for getting redemption value preview
export function useRedemptionValue(tokenAddress: string, amount: string) {
  const { data: redemptionValue, isLoading } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: projectCoinAbi,
    functionName: 'getRedemptionValue',
    args: [parseEther(amount || '0')],
    query: { enabled: Boolean(tokenAddress && amount && parseFloat(amount) > 0) }
  });

  return {
    redemptionValue: redemptionValue ? formatEther(redemptionValue as bigint) : '0',
    isLoading
  };
}