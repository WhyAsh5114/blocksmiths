"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt, useConfig } from "wagmi";
import { parseEther, formatEther, Address } from "viem";
import { readContract } from '@wagmi/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { predictionMarketAbi } from "@/lib/wagmi-generated";
import { ExternalLink, GitPullRequest, Clock, Users, DollarSign } from "lucide-react";

// Get the deployed PredictionMarket contract address from environment
const PREDICTION_MARKET_ADDRESS = (process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS || "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512") as Address;

interface GitHubPR {
  number: number;
  title: string;
  state: string;
  html_url: string;
  created_at: string;
  user: {
    login: string;
    avatar_url: string;
  };
  repository: string;
}

interface PredictionMarket {
  id: string;
  description: string;
  prUrl: string;
  yesPool: bigint;
  noPool: bigint;
  resolved: boolean;
  outcome: boolean;
  totalParticipants: number;
}

export default function PredictionMarketManager() {
  const { address, isConnected } = useAccount();
  const config = useConfig();
  const [repoInput, setRepoInput] = useState("");
  const [availablePRs, setAvailablePRs] = useState<GitHubPR[]>([]);
  const [selectedPR, setSelectedPR] = useState<GitHubPR | null>(null);
  const [markets, setMarkets] = useState<PredictionMarket[]>([]);
  const [isLoadingPRs, setIsLoadingPRs] = useState(false);
  const [prError, setPrError] = useState<string | null>(null);

  // Get all active markets from contract
  const { data: activeMarketIds } = useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: predictionMarketAbi,
    functionName: "getActiveMarkets",
  });

  // Contract interactions
  const { writeContract: createMarket, data: createMarketHash } = useWriteContract();
  const { writeContract: resolveMarket, data: resolveMarketHash } = useWriteContract();
  const { isLoading: isCreatingMarket } = useWaitForTransactionReceipt({ hash: createMarketHash });
  const { isLoading: isResolvingMarket } = useWaitForTransactionReceipt({ hash: resolveMarketHash });

  // Load GitHub PRs for a repository
  const loadRepositoryPRs = async (repo: string) => {
    if (!repo.includes('/')) {
      setPrError("Please enter a valid repository format (owner/repo)");
      return;
    }

    setIsLoadingPRs(true);
    setPrError(null);

    try {
      const response = await fetch(`https://api.github.com/repos/${repo}/pulls?state=open&per_page=20`, {
        headers: process.env.NEXT_PUBLIC_GITHUB_TOKEN 
          ? { 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}` }
          : {}
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const prs = await response.json();
      setAvailablePRs(prs.map((pr: any) => ({
        ...pr,
        repository: repo
      })));
    } catch (error) {
      console.error('Error loading PRs:', error);
      setPrError(error instanceof Error ? error.message : 'Failed to load PRs');
      setAvailablePRs([]);
    } finally {
      setIsLoadingPRs(false);
    }
  };

  // Create prediction market for selected PR
  const handleCreateMarket = () => {
    if (!selectedPR) return;

    const repo = selectedPR.repository;
    const prNumber = selectedPR.number;
    
    createMarket({
      address: PREDICTION_MARKET_ADDRESS,
      abi: predictionMarketAbi,
      functionName: "createMarket",
      args: [repo, BigInt(prNumber)],
    });
  };

  // Resolve market based on actual PR outcome
  const handleResolveMarket = async (marketId: string, prUrl: string) => {
    try {
      // Extract repo and PR number from URL
      const urlParts = prUrl.match(/github\.com\/([^\/]+\/[^\/]+)\/pull\/(\d+)/);
      if (!urlParts) {
        alert("Invalid PR URL format");
        return;
      }

      const [, repoPath, prNum] = urlParts;
      
      // Check current PR status
      const response = await fetch(`https://api.github.com/repos/${repoPath}/pulls/${prNum}`, {
        headers: process.env.NEXT_PUBLIC_GITHUB_TOKEN 
          ? { 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}` }
          : {}
      });

      if (!response.ok) {
        throw new Error("Failed to check PR status");
      }

      const pr = await response.json();
      const outcome = pr.state === 'closed' && pr.merged;

      // Resolve the market - extract repo and PR number from URL or market data
      const marketRepo = repoPath; // This should come from market data
      const marketPrNumber = parseInt(prNum);

      resolveMarket({
        address: PREDICTION_MARKET_ADDRESS,
        abi: predictionMarketAbi,
        functionName: "resolveMarket",
        args: [marketRepo, BigInt(marketPrNumber), outcome],
      });

    } catch (error) {
      console.error('Error resolving market:', error);
      alert('Failed to resolve market. Please try again.');
    }
  };

  // Load existing markets from contract
  useEffect(() => {
    const loadMarkets = async () => {
      if (!activeMarketIds || !Array.isArray(activeMarketIds) || activeMarketIds.length === 0) {
        setMarkets([]);
        return;
      }

      // For each active market ID, we need to get the market details
      // Since we can't reverse the keccak256 hash easily, we'll try known repos/PRs
      const knownMarkets = [
        { repository: "WhyAsh5114/blocksmiths", prNumber: 1 },
        { repository: "WhyAsh5114/blocksmiths", prNumber: 2 },
        { repository: "vercel/next.js", prNumber: 123 },
        { repository: "facebook/react", prNumber: 456 },
        { repository: "microsoft/vscode", prNumber: 789 },
      ];

      const marketPromises = knownMarkets.map(async ({ repository, prNumber }) => {
        try {
          const marketData = await readContract(config, {
            address: PREDICTION_MARKET_ADDRESS,
            abi: predictionMarketAbi,
            functionName: "getMarket",
            args: [repository, BigInt(prNumber)],
          });

          if (marketData && marketData[0]) { // isActive
            const marketId = await readContract(config, {
              address: PREDICTION_MARKET_ADDRESS,
              abi: predictionMarketAbi,
              functionName: "getMarketId",
              args: [repository, BigInt(prNumber)],
            });

            return {
              id: marketId as string,
              repository,
              prNumber: prNumber,
              description: `Will PR #${prNumber} in ${repository} be merged?`,
              yesPool: marketData[1] as bigint,
              noPool: marketData[2] as bigint,
              totalYesTokens: marketData[3] as bigint,
              totalNoTokens: marketData[4] as bigint,
              resolved: marketData[5] as boolean,
              outcome: marketData[6] as boolean,
              createdAt: Number(marketData[7]),
              resolvedAt: Number(marketData[8]),
              totalParticipants: 0, // Calculate from contract data if available
              prUrl: `https://github.com/${repository}/pull/${prNumber}`,
            };
          }
        } catch (error) {
          // Market doesn't exist for this repo/PR combination
          return null;
        }
      });

      const loadedMarkets = (await Promise.all(marketPromises)).filter(Boolean) as PredictionMarket[];
      setMarkets(loadedMarkets);
    };

    loadMarkets();
  }, [activeMarketIds, config]);

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Prediction Market Manager</CardTitle>
          <CardDescription>Connect your wallet to manage prediction markets</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>Please connect your wallet to access the prediction market manager.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🎯 Prediction Market Manager</CardTitle>
          <CardDescription>
            Create and manage YES/NO prediction markets for GitHub PR outcomes. Winners take all!
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="create" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create">Create Market</TabsTrigger>
          <TabsTrigger value="manage">Manage Markets</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Prediction Market</CardTitle>
              <CardDescription>Select a GitHub repository and PR to create a prediction market</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Repository Input */}
              <div className="space-y-2">
                <Label htmlFor="repo">GitHub Repository</Label>
                <div className="flex space-x-2">
                  <Input
                    id="repo"
                    placeholder="owner/repository (e.g., facebook/react)"
                    value={repoInput}
                    onChange={(e) => setRepoInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && loadRepositoryPRs(repoInput)}
                  />
                  <Button
                    onClick={() => loadRepositoryPRs(repoInput)}
                    disabled={!repoInput.trim() || isLoadingPRs}
                  >
                    {isLoadingPRs ? "Loading..." : "Load PRs"}
                  </Button>
                </div>
                {prError && (
                  <Alert className="mt-2">
                    <AlertDescription className="text-destructive">{prError}</AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Available PRs */}
              {availablePRs.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Select a Pull Request:</h3>
                  <div className="grid gap-3 max-h-96 overflow-y-auto">
                    {availablePRs.map((pr) => (
                      <div
                        key={pr.number}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          selectedPR?.number === pr.number
                            ? "border-primary bg-primary/10 dark:bg-primary/20"
                            : "border-border hover:border-muted-foreground/30"
                        }`}
                        onClick={() => setSelectedPR(pr)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <GitPullRequest className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            <div>
                              <p className="font-medium">#{pr.number}: {pr.title}</p>
                              <p className="text-sm text-muted-foreground">
                                by {pr.user.login} • {new Date(pr.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">Open</Badge>
                            <ExternalLink 
                              className="w-4 h-4 text-muted-foreground hover:text-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(pr.html_url, '_blank');
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Create Market Button */}
              {selectedPR && (
                <div className="space-y-4">
                  <Separator />
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Market Preview:</h4>
                    <p className="text-sm text-muted-foreground">
                      <strong>Question:</strong> Will PR #{selectedPR.number} in {selectedPR.repository} be merged?
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Title:</strong> "{selectedPR.title}"
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Mechanics:</strong> YES voters win if merged, NO voters win if closed without merging
                    </p>
                  </div>
                  <Button
                    onClick={handleCreateMarket}
                    disabled={isCreatingMarket}
                    className="w-full"
                    size="lg"
                  >
                    {isCreatingMarket ? "Creating Market..." : "Create Prediction Market"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Prediction Markets</CardTitle>
              <CardDescription>Manage existing prediction markets and resolve outcomes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {markets.length === 0 ? (
                <div className="text-center py-8">
                  <GitPullRequest className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Prediction Markets Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first prediction market by selecting a GitHub repository and PR above.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Markets will appear here once they're created on the blockchain.
                  </p>
                </div>
              ) : (
                markets.map((market) => (
                <div key={market.id} className="border rounded-lg p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <h3 className="font-semibold">{market.description}</h3>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{market.totalParticipants} participants</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-4 h-4" />
                          <span>{formatEther(market.yesPool + market.noPool)} ETH total</span>
                        </div>
                        <a
                          href={market.prUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 text-primary hover:underline"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>View PR</span>
                        </a>
                      </div>
                    </div>
                    <Badge variant={market.resolved ? "secondary" : "default"}>
                      {market.resolved ? "Resolved" : "Active"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">YES Pool (Will Merge)</span>
                        <span className="text-sm">{formatEther(market.yesPool)} ETH</span>
                      </div>
                      <div className="bg-emerald-100 dark:bg-emerald-900/20 h-3 rounded">
                        <div 
                          className="bg-emerald-600 dark:bg-emerald-400 h-3 rounded"
                          style={{
                            width: `${Number(market.yesPool) / (Number(market.yesPool) + Number(market.noPool)) * 100}%`
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-rose-600 dark:text-rose-400">NO Pool (Will Close)</span>
                        <span className="text-sm">{formatEther(market.noPool)} ETH</span>
                      </div>
                      <div className="bg-rose-100 dark:bg-rose-900/20 h-3 rounded">
                        <div 
                          className="bg-rose-600 dark:bg-rose-400 h-3 rounded"
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
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleResolveMarket(market.id, market.prUrl)}
                          disabled={isResolvingMarket}
                          variant="outline"
                          size="sm"
                        >
                          {isResolvingMarket ? "Resolving..." : "Auto-Resolve from GitHub"}
                        </Button>
                        <Button
                          onClick={() => {
                            // Extract repository and PR number from market data
                            const repo = market.repository;
                            const prNumber = market.prNumber;
                            resolveMarket({
                              address: PREDICTION_MARKET_ADDRESS,
                              abi: predictionMarketAbi,
                              functionName: "resolveMarket",
                              args: [repo, BigInt(prNumber), true],
                            });
                          }}
                          disabled={isResolvingMarket}
                          variant="outline"
                          size="sm"
                          className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                        >
                          Force Resolve YES
                        </Button>
                        <Button
                          onClick={() => {
                            // Extract repository and PR number from market data
                            const repo = market.repository;
                            const prNumber = market.prNumber;
                            resolveMarket({
                              address: PREDICTION_MARKET_ADDRESS,
                              abi: predictionMarketAbi,
                              functionName: "resolveMarket",
                              args: [repo, BigInt(prNumber), false],
                            });
                          }}
                          disabled={isResolvingMarket}
                          variant="outline"
                          size="sm"
                          className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300"
                        >
                          Force Resolve NO
                        </Button>
                      </div>
                    </>
                  )}

                  {market.resolved && (
                    <div className="flex items-center space-x-2">
                      <Badge variant={market.outcome ? "default" : "destructive"}>
                        Outcome: {market.outcome ? "YES - PR Merged" : "NO - PR Closed"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {market.outcome ? "YES" : "NO"} voters won {formatEther(market.yesPool + market.noPool)} ETH
                      </span>
                    </div>
                  )}
                </div>
              ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Markets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{markets.length}</div>
                <p className="text-xs text-muted-foreground">
                  {markets.filter(m => !m.resolved).length} active, {markets.filter(m => m.resolved).length} resolved
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatEther(markets.reduce((sum, m) => sum + m.yesPool + m.noPool, BigInt(0)))} ETH
                </div>
                <p className="text-xs text-muted-foreground">Across all markets</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Participants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {markets.reduce((sum, m) => sum + m.totalParticipants, 0)}
                </div>
                <p className="text-xs text-muted-foreground">Total unique participants</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Market Performance</CardTitle>
              <CardDescription>Historical outcomes and accuracy</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {markets.filter(m => m.resolved).map((market) => (
                  <div key={market.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Market #{market.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {market.description.substring(0, 60)}...
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={market.outcome ? "default" : "destructive"}>
                        {market.outcome ? "YES Won" : "NO Won"}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatEther(market.yesPool + market.noPool)} ETH
                      </p>
                    </div>
                  </div>
                ))}
                
                {markets.filter(m => m.resolved).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No resolved markets yet. Create and resolve some markets to see analytics.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}