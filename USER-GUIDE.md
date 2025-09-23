# GitHub Prediction Markets - User Guide

## 🎯 What Is This Platform?

Trade tokens for GitHub repositories and bet on pull request outcomes using real smart contracts.

**Two Ways to Trade:**

- **Token Trading**: Buy/sell repository tokens with bonding curve pricing
- **Prediction Markets**: Bet YES/NO on whether GitHub PRs will be merged

## 🚀 Getting Started

1. Open `http://localhost:3001`
2. Click "Connect Wallet" (top-right)
3. Approve MetaMask connection
4. Start trading!

## 🪙 Token Trading Walkthrough

### Step 1: Browse Available Tokens

- Go to **Dashboard → Tokens** tab
- See list of repository tokens with current prices
- Use search to find specific repositories

### Step 2: Buy Tokens

- Click on a token you want to buy
- Enter amount (e.g., "1000 tokens")
- Click "Buy Tokens"
- Confirm MetaMask transaction
- Tokens appear in your Portfolio

### Step 3: Monitor & Sell

- Go to **Portfolio → Holdings**
- See your token positions and current values
- Click "Redeem" to sell tokens back for ETH

**Key Info:**

- Prices increase as more people buy (bonding curve)
- 10% of each purchase goes to repository creators
- You can always sell back at current market price

## 🎯 Prediction Markets Walkthrough

### Step 1: Find Active Markets

- Go to **Dashboard → Predictions** tab
- Browse active GitHub PR prediction markets
- See current YES/NO odds and betting volume

### Step 2: Place Your Bet

- Choose a PR you want to bet on
- Click "Bet YES" (PR will merge) or "Bet NO" (PR will be rejected)
- Enter your ETH stake amount
- Confirm MetaMask transaction

### Step 3: Claim Winnings

- When the PR is resolved on GitHub:
  - Go to **Portfolio → Holdings**
  - Click "Refresh PR Status" to update
  - Click "Redeem" on resolved markets to claim winnings

**Key Info:**

- YES voters win if PR gets merged
- NO voters win if PR gets closed/rejected
- Winners split the total betting pool

## 📊 Portfolio Management

### Check Your Investments

- **Portfolio → Holdings**: See all your positions
- **Portfolio → Analytics**: View performance metrics
- **Portfolio → Leaderboard**: Compare with other traders

### Important Actions

- **Refresh PR Status**: Updates GitHub PR statuses
- **Redeem**: Claim winnings from resolved markets
- **Sell Tokens**: Convert tokens back to ETH

## 🎮 Creating New Markets

### Create Token for Repository

1. **Dashboard → Manage** tab
2. Enter GitHub repository (owner/repo format)
3. Set token name and symbol
4. Deploy smart contract
5. Token becomes available for trading

### Create Prediction Market

1. **Dashboard → Manage** tab
2. Enter repository and PR number
3. Deploy prediction market contract
4. Market goes live for betting

## 💡 Trading Tips

### For Token Trading

- **Buy Early**: Bonding curve means early buyers get better prices
- **Research Repos**: Active development can drive token value
- **Creator Incentives**: Repository owners earn from token sales

### For Prediction Markets

- **Study the PR**: Check code quality, tests, maintainer activity
- **Read Comments**: PR discussion reveals merge likelihood
- **Timing**: Bet early for better odds, late for more info

## 🔧 Troubleshooting

### Common Issues

- **Can't connect wallet**: Check MetaMask is unlocked and on localhost:8545
- **Transaction fails**: Ensure you have enough ETH for gas fees
- **Data not loading**: Refresh page or check if blockchain is running
- **PR status outdated**: Click "Refresh PR Status" in Portfolio

### Need Help?

- Check browser console for errors
- Verify MetaMask network settings
- Ensure local Hardhat node is running

## 📱 Quick Navigation

| Page | What You Can Do |
|------|----------------|
| **Dashboard** | Browse tokens, prediction markets, create new markets |
| **Portfolio** | View holdings, track performance, claim winnings |

### Dashboard Tabs

- **Overview**: Platform stats and quick actions
- **Tokens**: Trade repository tokens
- **Predictions**: Bet on PR outcomes  
- **Manage**: Create new tokens/markets
- **Analytics**: Platform statistics

### Portfolio Tabs

- **Holdings**: Your positions and actions
- **Analytics**: Performance metrics
- **Leaderboard**: Community rankings

---

**Ready to start?** Connect your wallet and begin trading on GitHub's future! 🚀
