"use client";

import TypographyH1 from "@/components/typography/h1";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Github, Coins, Trophy, Users, Zap, GitBranch, DollarSign, Target } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-background" />
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
        <div className="relative container mx-auto px-4 py-20">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-full glow">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Long-Only • GitHub Prediction Market • Live</span>
            </div>
            
            <div className="space-y-6">
              <TypographyH1 className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent pulse-glow">
                BlockSmiths Arena
              </TypographyH1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                🎯 Trade GitHub PRs like a pro. Buy tokens early, ride the bonding curve, 
                and cash out when PRs merge. The ultimate prediction market for developers.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8 glow floating" asChild>
                <Link href="/dashboard">
                  <Trophy className="w-5 h-5 mr-2" />
                  Enter Arena
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="px-8" asChild>
                <Link href="https://github.com/WhyAsh5114/blocksmiths" target="_blank">
                  <Github className="w-5 h-5 mr-2" />
                  View Source
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Live Stats */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <Card className="game-card pulse-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">$2.4M</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +20.1% this week
              </p>
            </CardContent>
          </Card>
          
          <Card className="game-card glow-purple">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Markets</CardTitle>
              <GitBranch className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">1,284</div>
              <p className="text-xs text-muted-foreground">
                <Target className="inline h-3 w-3 mr-1" />
                Live PR predictions
              </p>
            </CardContent>
          </Card>
          
          <Card className="game-card glow-blue">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Traders</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">8,429</div>
              <p className="text-xs text-muted-foreground">
                <Users className="inline h-3 w-3 mr-1" />
                Active this month
              </p>
            </CardContent>
          </Card>
          
          <Card className="game-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <Trophy className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">78.3%</div>
              <p className="text-xs text-muted-foreground">
                <Trophy className="inline h-3 w-3 mr-1" />
                Avg. prediction accuracy
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Hot Markets */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              🔥 Hot Markets
            </h2>
            <p className="text-muted-foreground">Top performing predictions this week</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Featured Market 1 */}
            <Card className="game-card floating shimmer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge className="bg-primary/20 text-primary glow">
                    🚀 React
                  </Badge>
                  <Badge variant="outline" className="text-primary">
                    +47% 📈
                  </Badge>
                </div>
                <CardTitle className="text-lg">
                  facebook/react #28,453
                </CardTitle>
                <CardDescription>
                  feat: Add concurrent rendering optimizations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Merge Probability</span>
                  <span className="text-primary font-bold">92% 🎯</span>
                </div>
                <Progress value={92} className="h-3 glow" />
                
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-muted-foreground">Token Price</div>
                    <div className="font-bold text-primary text-lg">0.045 ETH</div>
                  </div>
                  <Button size="sm" className="glow">
                    🎯 Trade
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Featured Market 2 */}
            <Card className="game-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge className="bg-accent/20 text-accent glow-purple">
                    ⚡ Vite
                  </Badge>
                  <Badge variant="outline" className="text-accent">
                    +32% 📊
                  </Badge>
                </div>
                <CardTitle className="text-lg">
                  vitejs/vite #15,892
                </CardTitle>
                <CardDescription>
                  fix: Resolve HMR issues with dynamic imports
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Merge Probability</span>
                  <span className="text-accent font-bold">87% 🔮</span>
                </div>
                <Progress value={87} className="h-3" />
                
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-muted-foreground">Token Price</div>
                    <div className="font-bold text-accent text-lg">0.032 ETH</div>
                  </div>
                  <Button size="sm" variant="outline" className="glow-purple">
                    ⚡ Trade
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Featured Market 3 */}
            <Card className="game-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge className="bg-yellow-400/20 text-yellow-400">
                    🎯 TypeScript
                  </Badge>
                  <Badge variant="outline" className="text-yellow-400">
                    +28% 💫
                  </Badge>
                </div>
                <CardTitle className="text-lg">
                  microsoft/TypeScript #56,234
                </CardTitle>
                <CardDescription>
                  feat: Improve type inference for mapped types
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Merge Probability</span>
                  <span className="text-yellow-400 font-bold">94% 🏆</span>
                </div>
                <Progress value={94} className="h-3" />
                
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-muted-foreground">Token Price</div>
                    <div className="font-bold text-yellow-400 text-lg">0.058 ETH</div>
                  </div>
                  <Button size="sm" variant="outline">
                    💎 Trade
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            🎮 How It Works
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Revolutionary prediction markets with bonding curve economics. Get better prices by being early!
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="game-card floating">
            <CardHeader>
              <div className="w-16 h-16 rounded-lg bg-primary/20 flex items-center justify-center mb-4 glow">
                <GitBranch className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>🎯 Find PR Markets</CardTitle>
              <CardDescription>
                Browse live GitHub PRs and their prediction markets. Each PR gets its own token with unique pricing curves.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="game-card floating" style={{ animationDelay: '0.5s' }}>
            <CardHeader>
              <div className="w-16 h-16 rounded-lg bg-accent/20 flex items-center justify-center mb-4 glow-purple">
                <Coins className="w-8 h-8 text-accent" />
              </div>
              <CardTitle>💰 Buy PR Tokens</CardTitle>
              <CardDescription>
                Purchase tokens early with our bonding curve pricing. Early buyers get better prices as demand increases!
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="game-card floating" style={{ animationDelay: '1s' }}>
            <CardHeader>
              <div className="w-16 h-16 rounded-lg bg-yellow-400/20 flex items-center justify-center mb-4">
                <Trophy className="w-8 h-8 text-yellow-400" />
              </div>
              <CardTitle>🏆 Earn Big</CardTitle>
              <CardDescription>
                When PRs merge, redeem tokens for rewards + fee share. Or sell early if prices moon! 🚀
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Final CTA */}
      <div className="container mx-auto px-4 pb-20">
        <Card className="game-card text-center py-16">
          <CardContent>
            <div className="space-y-6">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Ready to Trade? 🚀
              </h2>
              <p className="text-xl text-muted-foreground max-w-md mx-auto">
                Join the future of developer prediction markets. Start trading GitHub PRs today!
              </p>
              <Button size="lg" className="px-12 glow pulse-glow" asChild>
                <Link href="/dashboard">
                  <Zap className="w-5 h-5 mr-2" />
                  Launch Arena Now
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
