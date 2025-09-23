import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Target, Clock, Award } from 'lucide-react';
import { useUserPortfolio, PortfolioHolding } from '@/hooks/useUserPortfolio';
import { useProjectCoinFactory } from '@/hooks/web3/useProjectCoin';

interface PortfolioAnalytics {
  totalValue: number;
  totalInvested: number;
  gainLoss: number;
  gainLossPercent: number;
  bestPerformer: PortfolioHolding | null;
  worstPerformer: PortfolioHolding | null;
  totalTokens: number;
  averageHoldingTime: number;
  successRate: number;
}

export function PortfolioAnalytics() {
  const { portfolio, isLoading } = useUserPortfolio();
  const { allProjects } = useProjectCoinFactory();
  const [analytics, setAnalytics] = useState<PortfolioAnalytics | null>(null);

  useEffect(() => {
    if (portfolio && portfolio.length > 0) {
      calculateAnalytics(portfolio);
    }
  }, [portfolio]);

  const calculateAnalytics = (holdings: PortfolioHolding[]) => {
    const totalValue = holdings.reduce((sum, h) => sum + h.estimatedValue, 0);
    const totalInvested = holdings.reduce((sum, h) => sum + h.totalInvested, 0);
    const gainLoss = totalValue - totalInvested;
    const gainLossPercent = totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0;

    // Find best and worst performers
    const performers = holdings.map(h => ({
      ...h,
      performance: h.totalInvested > 0 ? ((h.estimatedValue - h.totalInvested) / h.totalInvested) * 100 : 0
    }));
    
    const bestPerformer = performers.reduce((best, current) => 
      current.performance > best.performance ? current : best, performers[0]);
    
    const worstPerformer = performers.reduce((worst, current) => 
      current.performance < worst.performance ? current : worst, performers[0]);

    // Calculate success rate based on PR outcomes
    const resolvedHoldings = holdings.filter(h => h.prStatus && h.prStatus !== 'open');
    const successfulHoldings = resolvedHoldings.filter(h => h.prStatus === 'merged');
    const successRate = resolvedHoldings.length > 0 ? (successfulHoldings.length / resolvedHoldings.length) * 100 : 0;

    const totalTokens = holdings.reduce((sum, h) => sum + h.balance, 0);

    // Calculate average holding time from project creation dates
    let averageHoldingTime = 0;
    if (holdings.length > 0 && allProjects) {
      const currentTime = Date.now() / 1000; // Current time in seconds
      const holdingTimes = holdings.map(holding => {
        const project = allProjects.find(p => p.tokenAddress === holding.tokenAddress);
        if (project && project.createdAt) {
          const createdAtSeconds = Number(project.createdAt);
          return currentTime - createdAtSeconds;
        }
        return 0;
      }).filter(time => time > 0);
      
      if (holdingTimes.length > 0) {
        averageHoldingTime = holdingTimes.reduce((sum, time) => sum + time, 0) / holdingTimes.length;
        averageHoldingTime = averageHoldingTime / (24 * 60 * 60); // Convert to days
      }
    }

    setAnalytics({
      totalValue,
      totalInvested,
      gainLoss,
      gainLossPercent,
      bestPerformer: bestPerformer || null,
      worstPerformer: worstPerformer || null,
      totalTokens,
      averageHoldingTime,
      successRate
    });
  };

  if (isLoading) {
    return (
      <Card className="game-card">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-8 bg-muted rounded"></div>
              <div className="h-8 bg-muted rounded"></div>
              <div className="h-8 bg-muted rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics || portfolio.length === 0) {
    return (
      <Card className="game-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Portfolio Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No portfolio data available. Start trading to see analytics!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="game-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Portfolio Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Value */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="w-4 h-4" />
                Total Value
              </div>
              <div className="text-2xl font-bold">
                {analytics.totalValue.toFixed(4)} ETH
              </div>
            </div>

            {/* Gain/Loss */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {analytics.gainLoss >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                )}
                P&L
              </div>
              <div className={`text-2xl font-bold ${analytics.gainLoss >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                {analytics.gainLoss >= 0 ? '+' : ''}{analytics.gainLoss.toFixed(4)} ETH
              </div>
              <div className={`text-sm ${analytics.gainLoss >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                {analytics.gainLossPercent >= 0 ? '+' : ''}{analytics.gainLossPercent.toFixed(2)}%
              </div>
            </div>

            {/* Success Rate */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="w-4 h-4" />
                Success Rate
              </div>
              <div className="text-2xl font-bold">
                {analytics.successRate.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">
                Of resolved markets
              </div>
            </div>

            {/* Total Tokens */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Award className="w-4 h-4" />
                Total Tokens
              </div>
              <div className="text-2xl font-bold">
                {analytics.totalTokens.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                Across {portfolio.length} markets
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Highlights */}
      {analytics.bestPerformer && analytics.worstPerformer && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="game-card border-emerald-400/30 dark:border-emerald-600/30">
            <CardHeader>
              <CardTitle className="text-emerald-500 dark:text-emerald-400 text-lg">🏆 Best Performer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="font-semibold">{analytics.bestPerformer.repository}</div>
                <div className="text-emerald-500 dark:text-emerald-400 font-bold">
                  +{((analytics.bestPerformer.estimatedValue - analytics.bestPerformer.totalInvested) / analytics.bestPerformer.totalInvested * 100).toFixed(2)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  {analytics.bestPerformer.balance.toLocaleString()} tokens
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="game-card border-rose-400/30 dark:border-rose-600/30">
            <CardHeader>
              <CardTitle className="text-rose-500 dark:text-rose-400 text-lg">📉 Needs Attention</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="font-semibold">{analytics.worstPerformer.repository}</div>
                <div className="text-rose-500 dark:text-rose-400 font-bold">
                  {((analytics.worstPerformer.estimatedValue - analytics.worstPerformer.totalInvested) / analytics.worstPerformer.totalInvested * 100).toFixed(2)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  {analytics.worstPerformer.balance.toLocaleString()} tokens
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}