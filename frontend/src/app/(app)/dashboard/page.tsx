"use client";

import { useState } from "react";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { formatEther } from "viem";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PredictionMarket from "@/components/prediction-market";
import PredictionMarketManager from "@/components/prediction-market-manager";
import TokenTrading from "@/components/token-trading";
import { WalletConnect } from "@/components/wallet-connect";
import { useIntegratedMarkets } from "@/hooks/useIntegratedMarkets";
import { predictionMarketAbi, projectCoinFactoryAbi } from "@/lib/wagmi-generated";

// Contract addresses from environment
const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`;
const PREDICTION_MARKET_ADDRESS = process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS as `0x${string}`;

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const [activeTab, setActiveTab] = useState("overview");

  // Read contract data for overview
  const { data: allProjects } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: projectCoinFactoryAbi,
    functionName: "getAllProjects",
  });

  const { data: activeMarkets } = useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: predictionMarketAbi,
    functionName: "getActiveMarkets",
  });

  const {
    tokenMarkets,
    hasRegisteredTokens,
    isLoading: marketsLoading
  } = useIntegratedMarkets();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">GitHub PR Trading Platform</h1>
          <p className="text-gray-600 mt-2">
            Trade tokens with bonding curves + creator rewards, or bet on PR outcomes with prediction markets
          </p>
        </div>
        <WalletConnect />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tokens">Token Trading</TabsTrigger>
          <TabsTrigger value="predictions">Prediction Markets</TabsTrigger>
          <TabsTrigger value="manage">Manage Markets</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Your Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {balance ? `${formatEther(balance.value).substring(0, 6)} ETH` : "0 ETH"}
                </div>
                <p className="text-xs text-gray-500">Available for trading</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Markets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(Array.isArray(allProjects) ? allProjects.length : 0) + (Array.isArray(activeMarkets) ? activeMarkets.length : 0)}
                </div>
                <p className="text-xs text-gray-500">
                  {Array.isArray(allProjects) ? allProjects.length : 0} token + {Array.isArray(activeMarkets) ? activeMarkets.length : 0} prediction
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Creator Rewards</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$2,847</div>
                <p className="text-xs text-gray-500">10% of minting fees</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Prediction Pools</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">15.7 ETH</div>
                <p className="text-xs text-gray-500">Winner takes all</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>How It Works: Dual System</CardTitle>
                <CardDescription>Two complementary systems for different use cases</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-green-600 mb-2">🪙 Token Trading System</h3>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• Bonding curve pricing (price increases with supply)</li>
                    <li>• Redeem tokens anytime for ETH</li>
                    <li>• Creators earn 10% of all minting fees</li>
                    <li>• Long-term value appreciation</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-red-600 mb-2">🎯 Prediction Markets</h3>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• YES/NO betting on PR outcomes</li>
                    <li>• Winners take ALL losers' money</li>
                    <li>• If PR closes, NO voters gain everything</li>
                    <li>• Pure speculation with high risk/reward</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest trades and predictions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isConnected ? (
                  <>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Connected</p>
                        <p className="text-xs text-gray-500">
                          {address?.substring(0, 6)}...{address?.substring(address.length - 4)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">
                          {balance ? formatEther(balance.value).substring(0, 6) : "0"} ETH
                        </p>
                        <Badge variant="default" className="text-xs">Ready</Badge>
                      </div>
                    </div>

                    {hasRegisteredTokens && (
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">Token Markets Available</p>
                          <p className="text-xs text-gray-500">
                            {Array.isArray(allProjects) ? allProjects.length : 0} registered projects
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="default" className="text-xs">Active</Badge>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Prediction Markets</p>
                        <p className="text-xs text-gray-500">
                          {Array.isArray(activeMarkets) ? activeMarkets.length : 0} active markets
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="text-xs">YES/NO</Badge>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Connect your wallet to see activity</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tokens" className="space-y-6">
          <TokenTrading />
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          <PredictionMarket />
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <PredictionMarketManager />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Market Performance</CardTitle>
                <CardDescription>Token vs Prediction market statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Token Markets Active</span>
                    <Badge variant="default">{Array.isArray(allProjects) ? allProjects.length : 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Prediction Markets Active</span>
                    <Badge variant="secondary">{Array.isArray(activeMarkets) ? activeMarkets.length : 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Volume (24h)</span>
                    <span className="font-medium">$12,431</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Creator Rewards Paid</span>
                    <span className="font-medium text-green-600">$2,847</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Prediction Accuracy</CardTitle>
                <CardDescription>How often does the market predict correctly?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Markets Resolved</span>
                    <Badge variant="outline">47</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Prediction Accuracy</span>
                    <span className="font-medium">73.4%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Pool Size</span>
                    <span className="font-medium">2.3 ETH</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Largest Win</span>
                    <span className="font-medium text-green-600">8.7 ETH</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}