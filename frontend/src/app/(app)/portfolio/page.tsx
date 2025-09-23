'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExternalLink, Coins, TrendingUp, TrendingDown, AlertCircle, BarChart3, Users } from 'lucide-react';
import { useUserPortfolio } from '@/hooks/useUserPortfolio';
import { PortfolioAnalytics } from '@/components/portfolio/portfolio-analytics';
import { Leaderboard } from '@/components/portfolio/leaderboard';

export default function PortfolioPage() {
  const { isConnected, address } = useAccount();
  const { 
    portfolio, 
    isLoading, 
    error, 
    isCheckingPRStatus,
    redeemTokens, 
    isTransacting, 
    refreshPRStatuses 
  } = useUserPortfolio();

  if (!isConnected) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Portfolio
          </h1>
          <p className="text-muted-foreground">
            Manage your token investments and track performance
          </p>
        </div>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                <Coins className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Connect Wallet</h3>
                <p className="text-muted-foreground">
                  Please connect your wallet to view your portfolio
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Portfolio
          </h1>
          <p className="text-muted-foreground">Loading your investments...</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-8 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Portfolio
          </h1>
          <p className="text-muted-foreground">Manage your token investments</p>
        </div>

        <Card className="border-destructive/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <div>
                <h3 className="font-semibold">Error Loading Portfolio</h3>
                <p className="text-sm text-destructive/80">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalValue = portfolio.reduce((sum, holding) => sum + holding.estimatedValue, 0);
  const totalTokens = portfolio.reduce((sum, holding) => sum + holding.balance, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Portfolio
        </h1>
        <p className="text-muted-foreground">
          Manage your token investments and track performance
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalValue.toFixed(4)} ETH</div>
            <p className="text-xs text-muted-foreground mt-1">
              Estimated current value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTokens.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {portfolio.length} projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolio.filter(p => p.balance > 0).length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Projects with holdings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Interface */}
      <Tabs defaultValue="holdings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="holdings" className="flex items-center gap-2">
            <Coins className="w-4 h-4" />
            Holdings
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Leaderboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="holdings" className="space-y-6">
          {/* PR Status Refresh */}
          {portfolio.length > 0 && (
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Your Holdings</h2>
              <Button 
                variant="outline" 
                onClick={refreshPRStatuses}
                disabled={isCheckingPRStatus}
                className="flex items-center gap-2"
              >
                {isCheckingPRStatus ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Checking PR Status...
                  </>
                ) : (
                  'Refresh PR Status'
                )}
              </Button>
            </div>
          )}

          {/* Holdings */}
          <div className="space-y-4">        
            {portfolio.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                      <Coins className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">No Investments Yet</h3>
                      <p className="text-muted-foreground">
                        Start trading on prediction markets to build your portfolio
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {portfolio.map((holding) => (
                  <PortfolioCard 
                    key={`${holding.tokenAddress}-${holding.repository}`}
                    holding={holding}
                    onRedeem={redeemTokens}
                    isTransacting={isTransacting}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <PortfolioAnalytics />
        </TabsContent>

        <TabsContent value="leaderboard">
          <Leaderboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface PortfolioCardProps {
  holding: any; // Will type this properly in the hook
  onRedeem: (tokenAddress: string, amount: string) => Promise<void>;
  isTransacting: boolean;
}

function PortfolioCard({ holding, onRedeem, isTransacting }: PortfolioCardProps) {
  const [redeemAmount, setRedeemAmount] = useState('');
  const [showRedeemInput, setShowRedeemInput] = useState(false);

  const handleRedeem = async () => {
    if (!redeemAmount || parseFloat(redeemAmount) <= 0) return;
    await onRedeem(holding.tokenAddress, redeemAmount);
    setRedeemAmount('');
    setShowRedeemInput(false);
  };

  const redemptionInfo = holding.redemptionInfo;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {holding.symbol}
              </Badge>
              {holding.prStatus && (
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    holding.prStatus === 'merged' ? 'text-emerald-600 dark:text-emerald-400 border-emerald-600 dark:border-emerald-400' :
                    holding.prStatus === 'closed' ? 'text-rose-600 dark:text-rose-400 border-rose-600 dark:border-rose-400' :
                    'text-primary border-primary'
                  }`}
                >
                  {holding.prStatus}
                </Badge>
              )}
            </div>
            
            <CardTitle className="text-lg">
              {holding.name}
            </CardTitle>
            
            <CardDescription>
              {holding.repository}
            </CardDescription>
          </div>
          
          <div className="text-right">
            <div className="text-lg font-bold text-primary">
              {holding.balance.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              tokens
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Invested</div>
            <div className="font-semibold">{holding.totalInvested.toFixed(4)} ETH</div>
          </div>
          <div>
            <div className="text-muted-foreground">Current Value</div>
            <div className="font-semibold">{holding.estimatedValue.toFixed(4)} ETH</div>
          </div>
        </div>

        {/* Redemption Info */}
        {redemptionInfo && (
          <div className="p-3 bg-muted/50 rounded-lg space-y-2">
            <div className="text-sm font-medium">Redemption Details</div>
            <div className="text-xs text-muted-foreground">{redemptionInfo.statusMessage}</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Base Value:</span>
                <span className="ml-1 font-medium">{redemptionInfo.baseValue.toFixed(4)} ETH</span>
              </div>
              <div>
                <span className="text-muted-foreground">With Rewards:</span>
                <span className="ml-1 font-medium text-primary">{redemptionInfo.totalValue.toFixed(4)} ETH</span>
              </div>
            </div>
            {redemptionInfo.rewardMultiplier !== 1.0 && (
              <div className="text-xs">
                <span className={`font-medium ${
                  redemptionInfo.rewardMultiplier > 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {redemptionInfo.rewardMultiplier > 1 ? '+' : ''}{((redemptionInfo.rewardMultiplier - 1) * 100).toFixed(0)}% 
                  {redemptionInfo.rewardMultiplier > 1 ? ' bonus' : ' reduction'} 
                </span>
                <span className="text-muted-foreground"> based on PR outcome</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          {!showRedeemInput ? (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(`https://github.com/${holding.repository}`, '_blank')}
                className="flex-1"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Repo
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowRedeemInput(true)}
                className="flex-1"
                disabled={holding.balance <= 0}
              >
                <Coins className="w-4 h-4 mr-2" />
                Redeem
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Amount to redeem"
                  value={redeemAmount}
                  onChange={(e) => setRedeemAmount(e.target.value)}
                  max={holding.balance}
                  className="flex-1"
                />
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => setRedeemAmount(holding.balance.toString())}
                  className="px-3"
                >
                  Max
                </Button>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowRedeemInput(false)}
                  className="flex-1"
                  disabled={isTransacting}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm"
                  onClick={handleRedeem}
                  disabled={!redeemAmount || parseFloat(redeemAmount) <= 0 || isTransacting}
                  className="flex-1"
                >
                  {isTransacting ? 'Redeeming...' : 'Confirm Redeem'}
                </Button>
              </div>
              {redemptionInfo && (
                <p className="text-xs text-muted-foreground">
                  You will receive ~{(parseFloat(redeemAmount || '0') * redemptionInfo.totalValue / holding.balance).toFixed(4)} ETH 
                  (includes base value + rewards - 2% burn fee)
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}