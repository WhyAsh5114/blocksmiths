import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GitBranch, Clock, Coins, ExternalLink, Wallet } from "lucide-react";
import { IntegratedMarket } from "@/hooks/useIntegratedMarkets";
import { useProjectCoinContract } from "@/hooks/web3/useProjectCoin";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";

interface IntegratedMarketCardProps {
  market: IntegratedMarket;
  onCreateToken?: (repository: string, name: string, symbol: string) => void;
}

export function IntegratedMarketCard({ market, onCreateToken }: IntegratedMarketCardProps) {
  const [mintAmount, setMintAmount] = useState('1');
  const [mintError, setMintError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const { isConnected } = useAccount();
  
  const projectCoin = useProjectCoinContract(market.tokenAddress || '', mintAmount);
  
  // Get the mint cost directly from the hook
  const mintCostFormatted = projectCoin.mintCost && parseFloat(projectCoin.mintCost) > 0 
    ? parseFloat(projectCoin.mintCost).toFixed(6) 
    : '0';

  // Clear errors when transaction succeeds and reset mint amount
  useEffect(() => {
    if (projectCoin.isSuccess) {
      setMintError(null);
      setMintAmount('1'); // Reset to default amount
      setShowSuccess(true);
      
      // Auto-hide success message after 3 seconds
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [projectCoin.isSuccess]);

  // Clear errors when user changes amount
  useEffect(() => {
    if (mintError) {
      setMintError(null);
    }
    if (showSuccess) {
      setShowSuccess(false);
    }
  }, [mintAmount]);

  const handleCreateToken = () => {
    if (onCreateToken) {
      const repoName = market.repo.split('/')[1];
      const symbol = repoName.toUpperCase().slice(0, 4) + 'PR';
      onCreateToken(market.repo, `${repoName} PR Token`, symbol);
    }
  };

  const handleMint = async () => {
    if (!market.tokenAddress || !mintAmount) return;
    
    setMintError(null);
    
    try {
      const amount = parseFloat(mintAmount);
      if (amount <= 0) {
        setMintError('Amount must be greater than 0');
        return;
      }
      
      await projectCoin.mintTokens(mintAmount);
    } catch (error) {
      setMintError(error instanceof Error ? error.message : 'Failed to mint tokens');
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
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {market.tags && market.tags[0] && (
                <Badge variant="secondary" className="text-xs">
                  {market.tags[0]}
                </Badge>
              )}
              {market.status === 'review' && (
                <Badge variant="outline" className="text-xs">
                  In Review
                </Badge>
              )}
              {market.hasToken && (
                <Badge className="bg-green-500/20 text-green-400 border-green-400/50 text-xs">
                  <Coins className="w-3 h-3 mr-1" />
                  Token Available
                </Badge>
              )}
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
                {market.author}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Updated recently
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Token Information */}
          {market.hasToken && market.tokenAddress && (
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-primary" />
                <span className="font-medium">Token Details</span>
              </div>
              
              <div className="grid grid-cols-1 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Total Supply</div>
                  <div className="font-semibold">{projectCoin.totalSupply || 'Loading...'}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Mint Cost: {mintCostFormatted} ETH (for {mintAmount} tokens)
                </div>
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
                    disabled={!isConnected || projectCoin.isPending || !mintAmount || parseFloat(mintAmount) <= 0}
                    className="px-6"
                  >
                    {projectCoin.isPending ? 'Minting...' : 'Mint'}
                  </Button>
                </div>
                {mintError && (
                  <div className="text-sm text-red-400">
                    {mintError}
                  </div>
                )}
                {showSuccess && (
                  <div className="text-sm text-green-400">
                    Tokens minted successfully!
                  </div>
                )}
              </div>
            </div>
          )}

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
          {showSuccess && (
            <div className="text-center text-sm text-green-400">
              Tokens minted successfully! Total supply updated.
            </div>
          )}
          {projectCoin.writeError && (
            <div className="text-center text-sm text-red-400">
              Transaction failed: {projectCoin.writeError}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}