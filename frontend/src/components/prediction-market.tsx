"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatEther, Address } from "viem";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { predictionMarketAbi } from "@/lib/wagmi-generated";

// Replace with your deployed PredictionMarket contract address
const PREDICTION_MARKET_ADDRESS = "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512" as Address;

interface Market {
  id: string;
  description: string;
  yesPool: bigint;
  noPool: bigint;
  resolved: boolean;
  outcome: boolean;
}

interface UserPosition {
  marketId: string;
  isYes: boolean;
  amount: bigint;
  claimed: boolean;
}

export default function PredictionMarket() {
  const { address, isConnected } = useAccount();
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
    if (!isConnected) return;

    // Start with some demo data, but in a real app you'd fetch from the blockchain
    const demoMarkets = [
      {
        id: "0",
        description: "Will PR #123 in blocksmiths repo be merged?",
        yesPool: parseEther("2.5"),
        noPool: parseEther("1.8"),
        resolved: false,
        outcome: false,
      },
      {
        id: "1", 
        description: "Will PR #124 be closed without merging?",
        yesPool: parseEther("0.8"),
        noPool: parseEther("3.2"),
        resolved: true,
        outcome: false,
      }
    ];

    // If we have real contract data, process it
    if (activeMarketsData && Array.isArray(activeMarketsData)) {
      // Process real market data from contract
      const realMarkets = activeMarketsData.map((marketId: string, index: number) => ({
        id: marketId,
        description: `Real market from contract ${marketId}`,
        yesPool: parseEther("1.0"), // This would come from contract
        noPool: parseEther("1.5"),   // This would come from contract
        resolved: false,
        outcome: false,
      }));
      
      setMarkets([...demoMarkets, ...realMarkets]);
    } else {
      setMarkets(demoMarkets);
    }
  }, [isConnected, activeMarketsData, address]);

  const handleCreateMarket = () => {
    if (!newMarketDescription.trim()) return;

    // For demo purposes - in reality you'd extract repo and PR number from description
    const repo = "blocksmiths/example";
    const prNumber = Math.floor(Math.random() * 1000) + 1;

    createMarket({
      address: PREDICTION_MARKET_ADDRESS,
      abi: predictionMarketAbi,
      functionName: "createMarket",
      args: [repo, BigInt(prNumber)],
    });

    setNewMarketDescription("");
  };

  const handleTakePosition = () => {
    if (!selectedMarket || !betAmount) return;

    const amount = parseEther(betAmount);
    // For demo purposes - in reality you'd get these from the market data
    const repo = "blocksmiths/example";
    const prNumber = parseInt(selectedMarket) + 123;
    
    if (betType === "yes") {
      takePosition({
        address: PREDICTION_MARKET_ADDRESS,
        abi: predictionMarketAbi,
        functionName: "takeYesPosition",
        args: [repo, BigInt(prNumber)],
        value: amount,
      });
    } else {
      takePosition({
        address: PREDICTION_MARKET_ADDRESS,
        abi: predictionMarketAbi,
        functionName: "takeNoPosition",
        args: [repo, BigInt(prNumber)],
        value: amount,
      });
    }

    setBetAmount("");
  };

  const handleResolveMarket = (marketId: string, outcome: boolean) => {
    // For demo purposes - in reality you'd get these from the market data
    const repo = "blocksmiths/example";
    const prNumber = parseInt(marketId) + 123;

    resolveMarket({
      address: PREDICTION_MARKET_ADDRESS,
      abi: predictionMarketAbi,
      functionName: "resolveMarket",
      args: [repo, BigInt(prNumber), outcome],
    });
  };

  const handleClaimWinnings = (marketId: string) => {
    // For demo purposes - in reality you'd get these from the market data
    const repo = "blocksmiths/example";
    const prNumber = parseInt(marketId) + 123;

    claimWinnings({
      address: PREDICTION_MARKET_ADDRESS,
      abi: predictionMarketAbi,
      functionName: "claimWinnings",
      args: [repo, BigInt(prNumber)],
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
          {markets.map((market) => (
            <div key={market.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{market.description}</h3>
                <Badge variant={market.resolved ? "secondary" : "default"}>
                  {market.resolved ? "Resolved" : "Active"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-600">YES Pool</span>
                    <span className="text-sm">{formatEther(market.yesPool)} ETH</span>
                  </div>
                  <div className="bg-green-100 h-2 rounded">
                    <div 
                      className="bg-green-600 h-2 rounded"
                      style={{
                        width: `${Number(market.yesPool) / (Number(market.yesPool) + Number(market.noPool)) * 100}%`
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-red-600">NO Pool</span>
                    <span className="text-sm">{formatEther(market.noPool)} ETH</span>
                  </div>
                  <div className="bg-red-100 h-2 rounded">
                    <div 
                      className="bg-red-600 h-2 rounded"
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

              {market.resolved && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Outcome:</span>
                    <Badge variant={market.outcome ? "default" : "destructive"}>
                      {market.outcome ? "YES - PR Merged" : "NO - PR Closed"}
                    </Badge>
                  </div>
                  <Button
                    onClick={() => handleClaimWinnings(market.id)}
                    disabled={isClaimWinningsLoading}
                    variant="outline"
                    size="sm"
                  >
                    {isClaimWinningsLoading ? "Claiming..." : "Claim Winnings"}
                  </Button>
                </div>
              )}
            </div>
          ))}

          {markets.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No prediction markets available. Create one above!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}