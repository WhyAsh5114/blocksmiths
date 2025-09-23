"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt, useConfig } from "wagmi";
import { parseEther, formatEther, Address, keccak256, toHex } from "viem";
import { readContract } from '@wagmi/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { predictionMarketAbi } from "@/lib/wagmi-generated";

// Get the deployed PredictionMarket contract address from environment
const PREDICTION_MARKET_ADDRESS = (process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS || "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512") as Address;

// Utility function to extract repository and PR number from description
function extractRepoAndPR(description: string): { repository: string; prNumber: number } | null {
  // Match patterns like "Will PR #123 in repo owner/name be merged?" 
  // or "Will owner/repo PR #456 be merged?"
  const patterns = [
    /(?:PR #(\d+) in (?:repo )?([^?\s]+))/i,
    /(?:([^?\s]+) PR #(\d+))/i,
    /(?:([^?\s]+)\/[^?\s]+ #(\d+))/i
  ];
  
  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) {
      if (pattern === patterns[0]) {
        // Pattern: "PR #123 in repo owner/name"
        return { prNumber: parseInt(match[1]), repository: match[2] };
      } else {
        // Pattern: "owner/repo PR #123" or "owner/repo #123"
        return { repository: match[1], prNumber: parseInt(match[2]) };
      }
    }
  }
  
  return null;
}

interface Market {
  id: string;
  repository: string;
  prNumber: number;
  description: string;
  yesPool: bigint;
  noPool: bigint;
  totalYesTokens: bigint;
  totalNoTokens: bigint;
  resolved: boolean;
  outcome: boolean;
  createdAt: number;
  resolvedAt: number;
}

interface UserPosition {
  marketId: string;
  repository: string;
  prNumber: number;
  yesTokens: bigint;
  noTokens: bigint;
  hasClaimed: boolean;
}

export default function PredictionMarket() {
  const { address, isConnected } = useAccount();
  const config = useConfig();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [userPositions, setUserPositions] = useState<UserPosition[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<string>("");
  const [betAmount, setBetAmount] = useState("");
  const [betType, setBetType] = useState<"yes" | "no">("yes");
  const [newMarketDescription, setNewMarketDescription] = useState("");

  // Contract write hooks
  const { writeContract: createMarket, data: createMarketHash } = useWriteContract();
  const { writeContract: takePosition, data: takePositionHash } = useWriteContract();
  const { writeContract: resolveMarket, data: resolveMarketHash } = useWriteContract();
  const { writeContract: claimWinnings, data: claimWinningsHash } = useWriteContract();

  // Wait for transaction confirmations
  const { isLoading: isCreateMarketLoading } = useWaitForTransactionReceipt({ hash: createMarketHash });
  const { isLoading: isTakePositionLoading } = useWaitForTransactionReceipt({ hash: takePositionHash });
  const { isLoading: isResolveMarketLoading } = useWaitForTransactionReceipt({ hash: resolveMarketHash });
  const { isLoading: isClaimWinningsLoading } = useWaitForTransactionReceipt({ hash: claimWinningsHash });

  // Read contract data
  const { data: allMarketsData } = useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: predictionMarketAbi,
    functionName: "getAllMarkets",
  });

  const { data: activeMarketsData } = useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: predictionMarketAbi,
    functionName: "getActiveMarkets",
  });

  // Load markets and user positions
  useEffect(() => {
    if (!isConnected || !activeMarketsData) return;

    const loadMarkets = async () => {
      if (Array.isArray(activeMarketsData)) {
        const marketPromises = activeMarketsData.map(async (marketId: string) => {
          // We need to decode the marketId to get repository and PR number
          // The market ID is generated as keccak256(abi.encodePacked(repository, prNumber))
          // For now, we'll use a placeholder approach since we can't easily reverse the hash
          // In a real implementation, you'd maintain a mapping or use events
          
          // Temporary approach: try to get market data for known repos/PRs
          const knownMarkets = [
            { repository: "WhyAsh5114/blocksmiths", prNumber: 1 },
            { repository: "WhyAsh5114/blocksmiths", prNumber: 2 },
            { repository: "vercel/next.js", prNumber: 123 },
          ];
          
          for (const { repository, prNumber } of knownMarkets) {
            try {
              const marketData = await readContract(config, {
                address: PREDICTION_MARKET_ADDRESS,
                abi: predictionMarketAbi,
                functionName: "getMarket",
                args: [repository, BigInt(prNumber)],
              });
              
              if (marketData && marketData[0]) { // isActive
                return {
                  id: marketId,
                  repository,
                  prNumber,
                  description: `Will PR #${prNumber} in ${repository} be merged?`,
                  yesPool: marketData[1] as bigint,
                  noPool: marketData[2] as bigint,
                  totalYesTokens: marketData[3] as bigint,
                  totalNoTokens: marketData[4] as bigint,
                  resolved: marketData[5] as boolean,
                  outcome: marketData[6] as boolean,
                  createdAt: Number(marketData[7]),
                  resolvedAt: Number(marketData[8]),
                };
              }
            } catch (error) {
              // Market doesn't exist for this repo/PR combination
              continue;
            }
          }
          return null;
        });
        
        const loadedMarkets = (await Promise.all(marketPromises)).filter(Boolean) as Market[];
        setMarkets(loadedMarkets);
        
        // Load user positions for each market
        if (address && loadedMarkets.length > 0) {
          const positionPromises = loadedMarkets.map(async (market) => {
            try {
              const positionData = await readContract(config, {
                address: PREDICTION_MARKET_ADDRESS,
                abi: predictionMarketAbi,
                functionName: "getUserPositions",
                args: [market.repository, BigInt(market.prNumber), address],
              });
              
              return {
                marketId: market.id,
                repository: market.repository,
                prNumber: market.prNumber,
                yesTokens: positionData[0] as bigint,
                noTokens: positionData[1] as bigint,
                hasClaimed: positionData[2] as boolean,
              };
            } catch (error) {
              return null;
            }
          });
          
          const loadedPositions = (await Promise.all(positionPromises)).filter(Boolean) as UserPosition[];
          setUserPositions(loadedPositions);
        }
      }
    };

    loadMarkets();
  }, [isConnected, activeMarketsData, address]);

  const handleCreateMarket = () => {
    if (!newMarketDescription.trim()) return;

    const repoAndPR = extractRepoAndPR(newMarketDescription);
    if (!repoAndPR) {
      alert("Please include repository and PR number in format: 'Will PR #123 in owner/repo be merged?' or 'Will owner/repo PR #123 be merged?'");
      return;
    }

    createMarket({
      address: PREDICTION_MARKET_ADDRESS,
      abi: predictionMarketAbi,
      functionName: "createMarket",
      args: [repoAndPR.repository, BigInt(repoAndPR.prNumber)],
    });

    setNewMarketDescription("");
  };

  const handleTakePosition = () => {
    if (!selectedMarket || !betAmount) return;

    const market = markets.find(m => m.id === selectedMarket);
    if (!market) return;

    const amount = parseEther(betAmount);
    
    if (betType === "yes") {
      takePosition({
        address: PREDICTION_MARKET_ADDRESS,
        abi: predictionMarketAbi,
        functionName: "takeYesPosition",
        args: [market.repository, BigInt(market.prNumber)],
        value: amount,
      });
    } else {
      takePosition({
        address: PREDICTION_MARKET_ADDRESS,
        abi: predictionMarketAbi,
        functionName: "takeNoPosition",
        args: [market.repository, BigInt(market.prNumber)],
        value: amount,
      });
    }

    setBetAmount("");
  };

  const handleResolveMarket = (marketId: string, outcome: boolean) => {
    const market = markets.find(m => m.id === marketId);
    if (!market) return;

    resolveMarket({
      address: PREDICTION_MARKET_ADDRESS,
      abi: predictionMarketAbi,
      functionName: "resolveMarket",
      args: [market.repository, BigInt(market.prNumber), outcome],
    });
  };

  const handleClaimWinnings = (marketId: string) => {
    const market = markets.find(m => m.id === marketId);
    if (!market) return;

    claimWinnings({
      address: PREDICTION_MARKET_ADDRESS,
      abi: predictionMarketAbi,
      functionName: "claimWinnings",
      args: [market.repository, BigInt(market.prNumber)],
    });
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Prediction Markets</CardTitle>
          <CardDescription>Connect your wallet to participate in YES/NO prediction markets</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>Please connect your wallet to access prediction markets.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create New Market */}
      <Card>
        <CardHeader>
          <CardTitle>Create Prediction Market</CardTitle>
          <CardDescription>Create a new YES/NO prediction market for GitHub PR outcomes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Market Description</Label>
            <Input
              id="description"
              placeholder="Will PR #123 in repo XYZ be merged?"
              value={newMarketDescription}
              onChange={(e) => setNewMarketDescription(e.target.value)}
            />
          </div>
          <Button
            onClick={handleCreateMarket}
            disabled={!newMarketDescription.trim() || isCreateMarketLoading}
            className="w-full"
          >
            {isCreateMarketLoading ? "Creating..." : "Create Market"}
          </Button>
        </CardContent>
      </Card>

      {/* Active Markets */}
      <Card>
        <CardHeader>
          <CardTitle>Active Prediction Markets</CardTitle>
          <CardDescription>Winner takes all! NO voters gain all the money if PR gets closed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {markets.map((market) => {
            const userPosition = userPositions.find(p => p.marketId === market.id);
            
            return (
              <div key={market.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{market.description}</h3>
                  <p className="text-sm text-muted-foreground">
                    Created: {new Date(market.createdAt * 1000).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={market.resolved ? "secondary" : "default"}>
                  {market.resolved ? "Resolved" : "Active"}
                </Badge>
              </div>

              {/* User Position Display */}
              {userPosition && (userPosition.yesTokens > 0n || userPosition.noTokens > 0n) && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <h4 className="text-sm font-medium mb-2">Your Position:</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {userPosition.yesTokens > 0n && (
                      <div className="text-emerald-600 dark:text-emerald-400">
                        YES: {userPosition.yesTokens.toString()} tokens
                      </div>
                    )}
                    {userPosition.noTokens > 0n && (
                      <div className="text-rose-600 dark:text-rose-400">
                        NO: {userPosition.noTokens.toString()} tokens
                      </div>
                    )}
                  </div>
                  {market.resolved && !userPosition.hasClaimed && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Click "Claim Winnings" below to collect your rewards
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">YES Pool</span>
                    <span className="text-sm">{formatEther(market.yesPool)} ETH</span>
                  </div>
                  <div className="bg-emerald-100 dark:bg-emerald-900/30 h-2 rounded">
                    <div 
                      className="bg-emerald-600 dark:bg-emerald-400 h-2 rounded"
                      style={{
                        width: `${Number(market.yesPool) / (Number(market.yesPool) + Number(market.noPool)) * 100}%`
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-rose-600 dark:text-rose-400">NO Pool</span>
                    <span className="text-sm">{formatEther(market.noPool)} ETH</span>
                  </div>
                  <div className="bg-rose-100 dark:bg-rose-900/30 h-2 rounded">
                    <div 
                      className="bg-rose-600 dark:bg-rose-400 h-2 rounded"
                      style={{
                        width: `${Number(market.noPool) / (Number(market.yesPool) + Number(market.noPool)) * 100}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              {!market.resolved && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`amount-${market.id}`}>Bet Amount (ETH)</Label>
                        <Input
                          id={`amount-${market.id}`}
                          placeholder="0.1"
                          value={selectedMarket === market.id ? betAmount : ""}
                          onChange={(e) => {
                            setSelectedMarket(market.id);
                            setBetAmount(e.target.value);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Position</Label>
                        <div className="flex space-x-2">
                          <Button
                            variant={betType === "yes" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setBetType("yes")}
                            className="flex-1"
                          >
                            YES
                          </Button>
                          <Button
                            variant={betType === "no" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setBetType("no")}
                            className="flex-1"
                          >
                            NO
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        onClick={handleTakePosition}
                        disabled={!betAmount || selectedMarket !== market.id || isTakePositionLoading}
                        className="flex-1"
                      >
                        {isTakePositionLoading ? "Betting..." : `Bet ${betType.toUpperCase()}`}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleResolveMarket(market.id, true)}
                        disabled={isResolveMarketLoading}
                        size="sm"
                      >
                        Resolve YES
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleResolveMarket(market.id, false)}
                        disabled={isResolveMarketLoading}
                        size="sm"
                      >
                        Resolve NO
                      </Button>
                    </div>
                  </div>
                </>
              )}

              </div>
              )}

              {market.resolved && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Outcome:</span>
                    <Badge variant={market.outcome ? "default" : "destructive"}>
                      {market.outcome ? "YES - PR Merged" : "NO - PR Closed"}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Resolved: {new Date(market.resolvedAt * 1000).toLocaleDateString()}
                  </div>
                  {userPosition && !userPosition.hasClaimed && (
                    <Button
                      onClick={() => handleClaimWinnings(market.id)}
                      disabled={isClaimWinningsLoading}
                      variant="outline"
                      size="sm"
                    >
                      {isClaimWinningsLoading ? "Claiming..." : "Claim Winnings"}
                    </Button>
                  )}
                </div>
              )}
            </div>
            );
          })

          {markets.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">No Prediction Markets Available</h3>
              <p className="text-muted-foreground mb-4">
                Create your first prediction market above or wait for others to create markets.
              </p>
              <p className="text-sm text-muted-foreground">
                Markets will appear here once they're created on the blockchain.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}