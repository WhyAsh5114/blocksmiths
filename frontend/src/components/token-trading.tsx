"use client";

import { useState, useEffect } from "react";
import { useAccount, useBalance } from "wagmi";
import { formatEther, parseEther } from "viem";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIntegratedMarkets } from "@/hooks/useIntegratedMarkets";
import { useProjectCoinContract } from "@/hooks/web3/useProjectCoin";
import { Search, TrendingUp, TrendingDown, Coins, DollarSign, Users, ArrowUpDown } from "lucide-react";

interface TokenMarket {
  repository: string;
  name: string;
  symbol: string;
  tokenAddress: string;
  totalSupply: bigint;
  currentPrice: bigint;
  marketCap: number;
  prCount: number;
  creatorRewards: bigint;
}

export default function TokenTrading() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const [selectedToken, setSelectedToken] = useState<string>("");
  const [tradeAmount, setTradeAmount] = useState("");
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [searchQuery, setSearchQuery] = useState("");
  
  const {
    markets,
    isLoading,
    error,
    createMarketToken,
    isCreatingToken,
    tokenCreated,
    hasRegisteredTokens,
    allProjectCoins
  } = useIntegratedMarkets();

  // Real token data from blockchain
  const realTokenMarkets = (allProjectCoins || []).map(coin => ({
    repository: `${coin.githubOwner}/${coin.githubRepo}`,
    name: coin.name,
    symbol: coin.symbol,
    tokenAddress: coin.tokenAddress,
    totalSupply: parseEther("1000000"), // Default supply - actual supply would be fetched from contract
    currentPrice: parseEther("0.001"), // Initial price - actual price would be calculated from bonding curve
    marketCap: 1000, // Calculated as totalSupply * currentPrice
    prCount: 0, // To be fetched from GitHub API integration
    creatorRewards: parseEther("0"), // To be fetched from contract
  }));

  const filteredTokens = realTokenMarkets.filter(token =>
    token.repository.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateMintCost = (token: TokenMarket, amount: string) => {
    if (!amount) return "0";
    const tokens = parseEther(amount);
    // Simplified bonding curve calculation
    const cost = (tokens * token.currentPrice) / parseEther("1");
    return formatEther(cost);
  };

  const calculateRedemptionValue = (token: TokenMarket, amount: string) => {
    if (!amount) return "0";
    const tokens = parseEther(amount);
    // Simplified redemption calculation (slightly less than mint cost)
    const value = (tokens * token.currentPrice * BigInt(95)) / (parseEther("1") * BigInt(100));
    return formatEther(value);
  };

  const handleTrade = (tokenAddress: string) => {
    if (!tradeAmount || !selectedToken) return;
    
    // Here you would call the actual contract functions
    // For buy: useProjectCoin mintTokens
    // For sell: useProjectCoin redeemTokens
    
    setTradeAmount("");
  };

  const handleCreateToken = (repository: string) => {
    const name = `${repository.split('/')[1]} Token`;
    const symbol = repository.split('/')[1].toUpperCase().substring(0, 5);
    createMarketToken(repository, name, symbol);
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Token Trading</CardTitle>
          <CardDescription>Connect your wallet to trade project tokens</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>Please connect your wallet to access token trading.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trading Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Your Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{balance ? formatEther(balance.value).substring(0, 6) : "0"} ETH</div>
            <p className="text-xs text-gray-500">Available for trading</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realTokenMarkets.length}</div>
            <p className="text-xs text-gray-500">Markets available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Market Cap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${realTokenMarkets.reduce((sum, t) => sum + t.marketCap, 0).toFixed(0)}
            </div>
            <p className="text-xs text-gray-500">
              Total value locked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Creator Rewards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {realTokenMarkets.length > 0 
                ? formatEther(realTokenMarkets.reduce((sum, t) => sum + t.creatorRewards, BigInt(0))).substring(0, 4) 
                : "0"} ETH
            </div>
            <p className="text-xs text-gray-500">10% of minting fees</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trade" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trade">Trade Tokens</TabsTrigger>
          <TabsTrigger value="portfolio">My Portfolio</TabsTrigger>
          <TabsTrigger value="create">Create Token</TabsTrigger>
        </TabsList>

        <TabsContent value="trade" className="space-y-6">
          {/* Token Search */}
          <Card>
            <CardHeader>
              <CardTitle>Available Tokens</CardTitle>
              <CardDescription>Trade tokens representing GitHub project outcomes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search repositories or tokens..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
              </div>

              <div className="grid gap-4">
                {filteredTokens.map((token) => (
                  <div
                    key={token.tokenAddress}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedToken === token.tokenAddress
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedToken(token.tokenAddress)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{token.name}</h3>
                          <Badge variant="outline">{token.symbol}</Badge>
                        </div>
                        <p className="text-sm text-gray-500">{token.repository}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center">
                            <Users className="w-3 h-3 mr-1" />
                            {token.prCount} PRs
                          </span>
                          <span className="flex items-center">
                            <DollarSign className="w-3 h-3 mr-1" />
                            ${token.marketCap}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatEther(token.currentPrice)} ETH</p>
                        <p className="text-sm text-gray-500">per token</p>
                        <div className="flex items-center space-x-1 mt-1">
                          <span className="text-xs text-gray-500">Market Cap: ${token.marketCap.toFixed(0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Trading Interface */}
          {selectedToken && (
            <Card>
              <CardHeader>
                <CardTitle>Trade Tokens</CardTitle>
                <CardDescription>
                  Buy tokens with bonding curve pricing or redeem tokens for ETH
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Button
                    variant={tradeType === "buy" ? "default" : "outline"}
                    onClick={() => setTradeType("buy")}
                    className="flex-1"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Buy Tokens
                  </Button>
                  <ArrowUpDown className="w-4 h-4 text-gray-400" />
                  <Button
                    variant={tradeType === "sell" ? "default" : "outline"}
                    onClick={() => setTradeType("sell")}
                    className="flex-1"
                  >
                    <TrendingDown className="w-4 h-4 mr-2" />
                    Redeem Tokens
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">
                      {tradeType === "buy" ? "Tokens to Buy" : "Tokens to Redeem"}
                    </Label>
                    <Input
                      id="amount"
                      placeholder="1000"
                      value={tradeAmount}
                      onChange={(e) => setTradeAmount(e.target.value)}
                    />
                  </div>

                      {tradeAmount && (
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">
                              {tradeType === "buy" ? "Cost:" : "You'll receive:"}
                            </span>
                            <span className="font-medium">
                              {tradeType === "buy" 
                                ? calculateMintCost(realTokenMarkets.find(t => t.tokenAddress === selectedToken)!, tradeAmount)
                                : calculateRedemptionValue(realTokenMarkets.find(t => t.tokenAddress === selectedToken)!, tradeAmount)
                              } ETH
                            </span>
                          </div>
                          {tradeType === "buy" && (
                            <>
                              <div className="flex justify-between text-sm text-gray-500">
                                <span>Creator fee (10%):</span>
                                <span>
                                  {(parseFloat(calculateMintCost(realTokenMarkets.find(t => t.tokenAddress === selectedToken)!, tradeAmount)) * 0.1).toFixed(6)} ETH
                                </span>
                              </div>
                              <div className="flex justify-between text-sm text-gray-500">
                                <span>Current price per token:</span>
                                <span>{formatEther(realTokenMarkets.find(t => t.tokenAddress === selectedToken)!.currentPrice)} ETH</span>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                  <Button
                    onClick={() => handleTrade(selectedToken)}
                    disabled={!tradeAmount || parseFloat(tradeAmount) <= 0}
                    className="w-full"
                    size="lg"
                  >
                    {tradeType === "buy" ? "Buy Tokens" : "Redeem Tokens"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Token Portfolio</CardTitle>
              <CardDescription>Your token holdings and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {realTokenMarkets.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Coins className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No tokens available yet.</p>
                    <p className="text-sm mt-1">Create some tokens to start trading.</p>
                  </div>
                ) : hasRegisteredTokens ? (
                  <div className="text-center py-8 text-gray-500">
                    <Coins className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Connect your wallet to see token balances.</p>
                    <p className="text-sm mt-1">Your holdings will appear here once you buy tokens.</p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Coins className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No token holdings found.</p>
                    <p className="text-sm mt-1">Buy some tokens to see your portfolio here.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Token</CardTitle>
              <CardDescription>Launch a new token for a GitHub repository</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  Creating a token costs 0.01 ETH. You'll become the repository's token creator and earn 10% of all minting fees.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-3">
                <div className="text-sm font-medium mb-2">Example repositories (create tokens for any GitHub repo):</div>
                {["WhyAsh5114/blocksmiths", "vercel/next.js", "vitejs/vite"].map(repo => (
                  <div key={repo} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{repo}</p>
                      <p className="text-sm text-gray-500">
                        {repo === "WhyAsh5114/blocksmiths" ? "Current repository" : "Popular project"}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleCreateToken(repo)}
                      disabled={isCreatingToken}
                      size="sm"
                    >
                      {isCreatingToken ? "Creating..." : "Create Token"}
                    </Button>
                  </div>
                ))}
              </div>

              {tokenCreated && (
                <Alert className="border-green-200 bg-green-50">
                  <AlertDescription className="text-green-700">
                    🎉 Token created successfully! You can now start trading.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}