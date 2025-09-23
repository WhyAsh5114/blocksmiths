import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, TrendingUp, Users } from 'lucide-react';

interface LeaderboardEntry {
  address: string;
  displayName: string;
  totalValue: number;
  totalGains: number;
  successRate: number;
  marketsTraded: number;
  rank: number;
  isCurrentUser?: boolean;
}

export function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all'>('week');

  // Real leaderboard data would come from contract events and user activity
  useEffect(() => {
    // For now, show empty state until real data implementation
    setLeaderboard([]);
    setIsLoading(false);
  }, [timeframe]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-muted-foreground" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <div className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">#{rank}</div>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30';
      case 2:
        return 'bg-muted/50 text-muted-foreground border-muted';
      case 3:
        return 'bg-amber-600/20 text-amber-600 border-amber-600/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <Card className="game-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-muted rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                  <div className="h-6 bg-muted rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="game-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Leaderboard
          </CardTitle>
          <div className="flex gap-2">
            {(['week', 'month', 'all'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setTimeframe(period)}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  timeframe === period
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {period === 'all' ? 'All Time' : `This ${period}`}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {leaderboard.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">No leaderboard data available yet</p>
            <p className="text-sm text-muted-foreground">
              Start trading to see yourself and others on the leaderboard!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {leaderboard.map((entry) => (
              <div
                key={entry.address}
                className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                  entry.isCurrentUser
                    ? 'bg-primary/10 border border-primary/20'
                    : 'hover:bg-muted/50'
                }`}
              >
                {/* Rank Icon */}
                <div className="flex items-center justify-center w-8 h-8">
                  {getRankIcon(entry.rank)}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold truncate">
                      {entry.displayName}
                    </div>
                    {entry.isCurrentUser && (
                      <Badge variant="outline" className="text-xs">
                        You
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{entry.address}</span>
                    <span>•</span>
                    <span>{entry.marketsTraded} markets</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="text-right space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                    {entry.totalValue.toFixed(2)} ETH
                  </div>
                  <div className="text-sm text-muted-foreground">
                    +{entry.totalGains.toFixed(2)} ETH ({entry.successRate.toFixed(1)}% success)
                  </div>
                </div>

                {/* Rank Badge */}
                <Badge className={getRankBadgeColor(entry.rank)}>
                  #{entry.rank}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Current User Rank (if not in top 5) - only show when we have data */}
        {leaderboard.length > 0 && !leaderboard.some(entry => entry.isCurrentUser) && (
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
              <div className="flex items-center justify-center w-8 h-8">
                <div className="text-sm font-bold text-muted-foreground">#47</div>
              </div>
              <div className="flex-1">
                <div className="font-semibold">Your Rank</div>
                <div className="text-sm text-muted-foreground">Keep trading to climb higher!</div>
              </div>
              <div className="text-right">
                <div className="font-bold">2.1 ETH</div>
                <div className="text-sm text-muted-foreground">+0.8 ETH</div>
              </div>
            </div>
          </div>
        )}

        {leaderboard.length > 0 && (
          <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="text-sm text-primary font-medium mb-1">💡 Pro Tip</div>
            <div className="text-sm text-muted-foreground">
              Success rate is calculated based on resolved markets. Focus on quality over quantity!
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}