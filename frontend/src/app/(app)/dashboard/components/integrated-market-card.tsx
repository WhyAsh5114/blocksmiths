import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { GitBranch, Users, Clock, Coins, ExternalLink, Wallet } from "lucide-react";
import { IntegratedMarket } from "@/hooks/useIntegratedMarkets";
import { useProjectCoinContract } from "@/hooks/web3/useProjectCoin";
import { useState } from "react";
import { useAccount } from "wagmi";

interface IntegratedMarketCardProps {
  market: IntegratedMarket;
  onCreateToken?: (repository: string, name: string, symbol: string) => void;
}

export function IntegratedMarketCard({ market, onCreateToken }: IntegratedMarketCardProps) {
  const [mintAmount, setMintAmount] = useState('1');
  const { isConnected } = useAccount();
  
  const projectCoin = useProjectCoinContract(market.tokenAddress || '');

  const handleCreateToken = () => {
    if (onCreateToken) {
      const repoName = market.repo.split('/')[1];
      const symbol = repoName.toUpperCase().slice(0, 4) + 'PR';
      onCreateToken(market.repo, `${repoName} PR Token`, symbol);
    }
  };

  const handleMint = () => {
    if (market.tokenAddress) {
      projectCoin.mintTokens(mintAmount);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <Card className="game-card hover:scale-[1.02] transition-all duration-300">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-primary/20 text-primary">
                {market.tags[0] || 'PR'}
              </Badge>
              {market.status === 'review' && (
                <Badge className="bg-accent/20 text-accent">
                  👀 In Review
                </Badge>
              )}
              {market.hasToken && (
                <Badge className="bg-green-500/20 text-green-400 border-green-400">
                  <Coins className="w-3 h-3 mr-1" />
                  Token Live
                </Badge>
              )}
              <Badge variant="outline" className={`
                ${market.change > 30 ? 'text-green-400 border-green-400' : 
                  market.change > 15 ? 'text-yellow-400 border-yellow-400' : 
                  'text-blue-400 border-blue-400'}
              `}>
                +{market.change}% 📊
              </Badge>
            </div>
            
            <CardTitle className="text-xl">
              {market.repo} #{market.prNumber}
            </CardTitle>
            
            <CardDescription className="text-base">
              {market.title}
            </CardDescription>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <GitBranch className="w-4 h-4" />
                by {market.author}
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {market.participants}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {market.timeLeft}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              {market.probability}%
            </div>
            <div className="text-sm text-muted-foreground">
              Merge Chance
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Market Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Volume (24h)</div>
              <div className="font-semibold">{formatCurrency(market.volume)}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Price</div>
              <div className="font-semibold">{formatCurrency(market.price)}</div>
            </div>
          </div>

          {/* Token Information */}
          {market.hasToken && market.tokenAddress && (
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-primary" />
                <span className="font-medium">Token Details</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Total Supply</div>
                  <div className="font-semibold">{projectCoin.totalSupply}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Market Cap</div>
                  <div className="font-semibold">
                    {market.marketCap ? formatCurrency(market.marketCap) : 'N/A'}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Mint Cost: {projectCoin.mintCost} ETH</div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={mintAmount}
                    onChange={(e) => setMintAmount(e.target.value)}
                    className="flex-1"
                    min="0.01"
                    step="0.01"
                  />
                  <Button 
                    onClick={handleMint}
                    disabled={!isConnected || projectCoin.isPending}
                    className="px-6"
                  >
                    {projectCoin.isPending ? 'Minting...' : 'Mint'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Merge Probability</span>
              <span>{market.probability}%</span>
            </div>
            <Progress 
              value={market.probability} 
              className="h-2 bg-background/50" 
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {!market.hasToken ? (
              <Button 
                onClick={handleCreateToken}
                disabled={!isConnected}
                className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/80 hover:to-accent/80"
              >
                <Coins className="w-4 h-4 mr-2" />
                Create Token
              </Button>
            ) : (
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => window.open(`https://github.com/${market.repo}/pull/${market.prNumber}`, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View PR
              </Button>
            )}
            
            {!isConnected && (
              <Button 
                variant="secondary" 
                className="flex-1"
                onClick={() => {/* Connect wallet handler */}}
              >
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </Button>
            )}
          </div>

          {/* Transaction Status */}
          {projectCoin.isPending && (
            <div className="text-center text-sm text-yellow-400">
              Transaction pending...
            </div>
          )}
          {projectCoin.isConfirming && (
            <div className="text-center text-sm text-blue-400">
              Confirming transaction...
            </div>
          )}
          {projectCoin.isSuccess && (
            <div className="text-center text-sm text-green-400">
              Transaction successful! 🎉
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}