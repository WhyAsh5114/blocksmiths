# GitHub Prediction Markets - Usage Guide

A decentralized prediction market platform for GitHub pull requests with bonding curve token economics.

## 🚀 Quick Start

### Prerequisites

- MetaMask wallet installed and configured
- Some ETH for gas fees and trading
- Local blockchain running (Hardhat network on localhost:8545)

### Getting Started

1. Navigate to `http://localhost:3001`
2. Click "Connect Wallet" in the top-right corner
3. Approve MetaMask connection
4. You're ready to trade!

## 📊 Platform Overview

The platform combines two trading mechanisms:

- **Token Trading**: Buy/sell project tokens with bonding curve pricing
- **Prediction Markets**: Bet on GitHub PR outcomes (YES/NO)

## 🪙 Token Trading

### How It Works

- Each GitHub repository can have its own ERC-20 token
- Tokens use bonding curve pricing (price increases with supply)
- 10% of each purchase goes to the repository creator as rewards
- Tokens can be redeemed back for ETH at current bonding curve price

### Trading Flow

1. **Browse Tokens**
   - Go to Dashboard → Tokens tab
   - View available project tokens
   - See current price, market cap, and supply

2. **Buy Tokens**
   - Select a token from the list
   - Enter the amount you want to buy
   - Click "Buy Tokens"
   - Confirm transaction in MetaMask
   - Tokens appear in your portfolio

3. **Sell Tokens**
   - Go to Portfolio → Holdings
   - Find your token position
   - Click "Redeem" or use the sell interface
   - Receive ETH based on current bonding curve price

### Key Features

- **Dynamic Pricing**: Price automatically adjusts based on supply/demand
- **Creator Rewards**: Repository owners earn 10% on all token sales
- **Instant Liquidity**: Always able to buy/sell through the bonding curve
- **No Slippage Protection Needed**: Bonding curve provides guaranteed pricing

## 🎯 Prediction Markets

### How It Works

- Each GitHub PR gets its own prediction market
- Users can bet YES (PR will merge) or NO (PR will be rejected/closed)
- Markets resolve based on actual GitHub PR outcomes
- Winners split the total pool proportionally to their stakes

### Trading Flow

1. **Browse Markets**
   - Go to Dashboard → Predictions tab
   - View active prediction markets
   - See current YES/NO prices and volume

2. **Place Bets**
   - Select a market
   - Choose YES or NO position
   - Enter your ETH stake amount
   - Confirm transaction in MetaMask

3. **Market Resolution**
   - When PR is merged/closed on GitHub, market resolves
   - Check Portfolio → Holdings for resolved positions
   - Click "Redeem" to claim winnings

### Market States

- **Active**: PR is still open, betting continues
- **Resolved - Merged**: PR was merged, YES voters win
- **Resolved - Closed**: PR was closed/rejected, NO voters win

## 📈 Portfolio Management

### Viewing Your Portfolio

1. Click "Portfolio" in the sidebar
2. See three main tabs:

#### Holdings Tab

- **Total Value**: Combined value of all positions
- **Individual Positions**: Each token/market position
- **PR Status**: Real-time GitHub PR status
- **Actions**: Redeem winnings, sell tokens

#### Analytics Tab

- **Performance Overview**: Total P&L, success rate
- **Best/Worst Performers**: Your top and bottom investments
- **Portfolio Statistics**: Token counts, market participation

#### Leaderboard Tab

- **Top Traders**: Community leaderboard by total value
- **Your Ranking**: See where you stand
- **Success Metrics**: Compare win rates and profits

### Portfolio Actions

- **Refresh PR Status**: Update GitHub PR statuses manually
- **Redeem Tokens**: Sell tokens back to bonding curve
- **Claim Winnings**: Collect payouts from resolved prediction markets

## 🎮 Creating Markets

### Create New Token Markets

1. Go to Dashboard → Manage tab
2. Enter repository information (owner/repo)
3. Set token parameters (name, symbol)
4. Deploy via smart contract
5. Token becomes available for trading

### Create Prediction Markets

1. Go to Dashboard → Manage tab
2. Enter GitHub repository and PR number
3. Set initial market parameters
4. Deploy prediction market contract
5. Market becomes available for betting

## 💡 Tips for Success

### Token Trading

- **Research Projects**: Invest in repositories with active development
- **Watch Creator Activity**: Active maintainers may drive token value
- **Bonding Curve Strategy**: Earlier buyers get better prices
- **Creator Rewards**: Repository owners have incentive to promote their tokens

### Prediction Markets

- **Study PR Quality**: Look at code quality, tests, documentation
- **Check Maintainer Activity**: Active maintainers merge PRs faster
- **Monitor Discussion**: PR comments reveal merge likelihood
- **Timing Matters**: Bet early for better odds, late for more information

### Risk Management

- **Diversify**: Don't put all funds in one token or market
- **Set Limits**: Only invest what you can afford to lose
- **Monitor GitHub**: Stay updated on PR and repository activity
- **Understand Mechanics**: Learn how bonding curves and prediction markets work

## 🔧 Technical Details

### Smart Contracts

- **ProjectCoinFactory**: Deploys and manages project tokens
- **PredictionMarket**: Handles GitHub PR prediction betting
- **Bonding Curve**: Mathematical pricing model for tokens

### GitHub Integration

- **Real-time PR Status**: Automatic checking of PR merge/close status
- **Repository Data**: Live repository information and statistics
- **Creator Verification**: Links GitHub accounts to wallet addresses

### Pricing Models

- **Bonding Curve Formula**: `price = basePrice * (1 + supply/maxSupply)^2`
- **Prediction Market Odds**: Dynamic based on betting volume
- **Creator Rewards**: Fixed 10% of all token purchases

## 🛠️ Troubleshooting

### Common Issues

#### Wallet Connection

- **Problem**: Can't connect wallet
- **Solution**: Ensure MetaMask is installed and unlocked
- **Check**: Network should be set to localhost:8545

#### Transaction Failures

- **Problem**: Transactions fail or revert
- **Solution**: Check gas fees and approve token spending
- **Check**: Ensure sufficient ETH balance for gas

#### Missing Data

- **Problem**: Tokens or markets not showing
- **Solution**: Refresh page or check if contracts are deployed
- **Check**: Verify contract addresses in .env.local

#### PR Status Not Updating

- **Problem**: GitHub PR status shows as outdated
- **Solution**: Click "Refresh PR Status" in portfolio
- **Check**: Ensure GitHub API is accessible

### Getting Help

- Check browser console for error messages
- Verify MetaMask network settings
- Ensure local blockchain is running
- Review contract deployment logs

## 🎯 Advanced Features

### Market Making

- Provide liquidity to prediction markets
- Earn fees from market spreads
- Balance YES/NO positions for profit

### Arbitrage Opportunities

- Price differences between tokens and prediction markets
- GitHub activity vs market pricing mismatches
- Cross-repository token value correlations

### Community Features

- Leaderboard competitions
- Success rate tracking
- Social trading insights

## 📋 API Integration

### GitHub API

- Automatic PR status checking
- Repository metadata fetching
- Real-time update notifications

### Smart Contract Events

- Token purchase/sale tracking
- Market creation notifications
- Resolution event handling

---

## 🎨 UI Navigation Quick Reference

| Page | URL | Purpose |
|------|-----|---------|
| Homepage | `/` | Landing page and overview |
| Dashboard | `/dashboard` | Main trading interface |
| Portfolio | `/portfolio` | Track investments and performance |

### Dashboard Tabs

- **Overview**: Platform statistics and quick actions
- **Tokens**: Browse and trade project tokens
- **Predictions**: Browse and bet on PR outcomes
- **Manage**: Create new tokens and markets
- **Analytics**: Platform-wide statistics

### Portfolio Tabs

- **Holdings**: View and manage your positions
- **Analytics**: Personal performance metrics
- **Leaderboard**: Community rankings

---

*Built with Next.js, TypeScript, Wagmi, and Hardhat. All trading is on-chain with real smart contracts.*
