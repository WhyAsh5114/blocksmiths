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
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/3 to-background" />
        <div className="absolute inset-0 bg-grid-white/[0.01] bg-[size:80px_80px]" />
        <div className="relative container mx-auto px-4 py-24 lg:py-32">
          <div className="text-center space-y-10">
            <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 px-5 py-2.5 rounded-full backdrop-blur-sm">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium tracking-wide">GitHub Prediction Markets • Live Trading</span>
            </div>
            
            <div className="space-y-8">
              <TypographyH1 className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                BlockSmiths Arena
              </TypographyH1>
              <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Trade GitHub pull requests with bonding curve economics. 
                Back promising PRs early and earn rewards when they merge.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" className="px-10 py-3 text-base font-medium" asChild>
                <Link href="/dashboard">
                  <Trophy className="w-5 h-5 mr-2" />
                  Start Trading
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="px-10 py-3 text-base" asChild>
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
      <div className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          <Card className="group hover:shadow-lg transition-all duration-300 border-primary/10 bg-gradient-to-br from-background to-primary/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Volume</CardTitle>
              <DollarSign className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">$2.4M</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1 text-emerald-500" />
                +20.1% this week
              </p>
            </CardContent>
          </Card>
          
          <Card className="group hover:shadow-lg transition-all duration-300 border-accent/10 bg-gradient-to-br from-background to-accent/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Markets</CardTitle>
              <GitBranch className="h-4 w-4 text-accent group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">1,284</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <Target className="h-3 w-3 mr-1 text-accent" />
                Live PR predictions
              </p>
            </CardContent>
          </Card>
          
          <Card className="group hover:shadow-lg transition-all duration-300 border-blue-500/10 bg-gradient-to-br from-background to-blue-500/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Traders</CardTitle>
              <Users className="h-4 w-4 text-blue-500 group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">8,429</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <Users className="h-3 w-3 mr-1 text-blue-500" />
                Active this month
              </p>
            </CardContent>
          </Card>
          
          <Card className="group hover:shadow-lg transition-all duration-300 border-yellow-500/10 bg-gradient-to-br from-background to-yellow-500/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
              <Trophy className="h-4 w-4 text-yellow-500 group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">78.3%</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <Trophy className="h-3 w-3 mr-1 text-yellow-500" />
                Avg. prediction accuracy
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Featured Markets */}
        <div className="space-y-12">
          <div className="text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Top Performing Markets
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover the most active prediction markets with high confidence scores
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Featured Market 1 */}
            <Card className="group border-primary/20 bg-gradient-to-br from-background to-primary/5 hover:shadow-xl transition-all duration-300 hover:border-primary/40">
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className="bg-primary/20 text-primary border-primary/30 font-medium">
                    React
                  </Badge>
                  <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10">
                    +47%
                  </Badge>
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
                    facebook/react #28,453
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    feat: Add concurrent rendering optimizations for improved performance
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Merge Probability</span>
                    <span className="text-foreground font-semibold">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                
                <div className="flex justify-between items-center pt-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Current Price</div>
                    <div className="font-bold text-lg">0.045 ETH</div>
                  </div>
                  <Button size="sm" className="px-6">
                    Trade Now
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Featured Market 2 */}
            <Card className="group border-accent/20 bg-gradient-to-br from-background to-accent/5 hover:shadow-xl transition-all duration-300 hover:border-accent/40">
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className="bg-accent/20 text-accent border-accent/30 font-medium">
                    Vite
                  </Badge>
                  <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10">
                    +32%
                  </Badge>
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold group-hover:text-accent transition-colors">
                    vitejs/vite #15,892
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    fix: Resolve HMR issues with dynamic imports for better developer experience
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Merge Probability</span>
                    <span className="text-foreground font-semibold">87%</span>
                  </div>
                  <Progress value={87} className="h-2" />
                </div>
                
                <div className="flex justify-between items-center pt-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Current Price</div>
                    <div className="font-bold text-lg">0.032 ETH</div>
                  </div>
                  <Button size="sm" variant="outline" className="px-6 border-accent/30 hover:bg-accent/10">
                    Trade Now
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Featured Market 3 */}
            <Card className="group border-yellow-500/20 bg-gradient-to-br from-background to-yellow-500/5 hover:shadow-xl transition-all duration-300 hover:border-yellow-500/40">
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 font-medium">
                    TypeScript
                  </Badge>
                  <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10">
                    +28%
                  </Badge>
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold group-hover:text-yellow-500 transition-colors">
                    microsoft/TypeScript #56,234
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    feat: Improve type inference for mapped types and conditional types
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Merge Probability</span>
                    <span className="text-foreground font-semibold">94%</span>
                  </div>
                  <Progress value={94} className="h-2" />
                </div>
                
                <div className="flex justify-between items-center pt-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Current Price</div>
                    <div className="font-bold text-lg">0.058 ETH</div>
                  </div>
                  <Button size="sm" variant="outline" className="px-6 border-yellow-500/30 hover:bg-yellow-500/10">
                    Trade Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Revolutionary prediction markets powered by bonding curve economics. 
            Early participants get better prices as demand increases.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-10">
          <Card className="group text-center p-8 border-primary/20 bg-gradient-to-br from-background to-primary/5 hover:shadow-lg transition-all duration-300">
            <CardHeader className="space-y-6">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 mx-auto group-hover:scale-105 transition-transform">
                <GitBranch className="w-10 h-10 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold mb-3">Discover Markets</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Browse live GitHub PRs across popular repositories. Each PR gets its own prediction market with dynamic pricing.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>

          <Card className="group text-center p-8 border-accent/20 bg-gradient-to-br from-background to-accent/5 hover:shadow-lg transition-all duration-300">
            <CardHeader className="space-y-6">
              <div className="w-20 h-20 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-6 mx-auto group-hover:scale-105 transition-transform">
                <Coins className="w-10 h-10 text-accent" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold mb-3">Buy PR Tokens</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Purchase tokens using our bonding curve model. Early buyers benefit from lower prices that increase with demand.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>

          <Card className="group text-center p-8 border-yellow-500/20 bg-gradient-to-br from-background to-yellow-500/5 hover:shadow-lg transition-all duration-300">
            <CardHeader className="space-y-6">
              <div className="w-20 h-20 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mb-6 mx-auto group-hover:scale-105 transition-transform">
                <Trophy className="w-10 h-10 text-yellow-500" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold mb-3">Earn Rewards</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  When PRs merge successfully, redeem your tokens for rewards plus trading fees. Or sell early if prices surge.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Final CTA */}
      <div className="container mx-auto px-4 pb-20">
        <Card className="text-center border-primary/20 bg-gradient-to-br from-background via-primary/5 to-accent/5 backdrop-blur-sm">
          <CardContent className="p-16">
            <div className="space-y-8 max-w-2xl mx-auto">
              <div className="space-y-4">
                <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  Ready to Trade?
                </h2>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Join the future of developer prediction markets. Start trading GitHub PRs with confidence and transparency.
                </p>
              </div>
              <div className="pt-4">
                <Button size="lg" className="px-12 py-4 text-lg font-medium" asChild>
                  <Link href="/dashboard">
                    <Zap className="w-6 h-6 mr-3" />
                    Start Trading Now
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
