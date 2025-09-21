# BlockSmiths 🔗⚒️

**Decentralized Prediction Markets for GitHub Pull Requests**

BlockSmiths revolutionizes developer collaboration by creating prediction markets for GitHub pull request outcomes. Trade tokens representing the probability of PR merges, backed by real GitHub data and powered by bonding curve economics.

## 🚀 Project Overview

BlockSmiths bridges Web2 development workflows with Web3 economics, enabling developers and stakeholders to:

- **Create prediction markets** for any GitHub repository's pull requests
- **Trade tokens** representing PR merge probabilities using bonding curve pricing
- **Earn rewards** when predictions are correct and PRs resolve
- **Incentivize quality contributions** through market-driven feedback

## 🎯 Core Concept

### The Problem
- **Uncertainty in PR outcomes**: Contributors and maintainers lack clear signals about which PRs will merge
- **Limited incentives for code review**: Quality reviewing is undervalued and unrewarded
- **Difficulty prioritizing PRs**: Maintainers struggle to identify high-impact contributions

### The Solution
- **Market-driven predictions**: Let the crowd wisdom determine PR merge probabilities
- **Economic incentives**: Reward accurate predictions and quality contributions
- **Real-time feedback**: Provide immediate market signals for PR quality and likelihood

## 🛠️ How It Works

### 1. **Token Creation (Lazy Minting)**
```
GitHub Repo → Factory Contract → ProjectCoin Token
```
- Anyone can create a `ProjectCoin` for any GitHub repository (0.01 ETH fee)
- Tokens represent prediction markets for that repo's PRs
- Factory manages all project tokens and provides discovery

### 2. **Bonding Curve Economics**
```
Early Buyers: 0.001 ETH → 1000 tokens
Later Buyers: 0.002 ETH → 1000 tokens (price increases)
```
- **Dynamic pricing**: Token prices increase with demand via bonding curves
- **Early adopter advantage**: First buyers get better prices
- **Market efficiency**: Prices reflect collective sentiment

### 3. **Fee Distribution**
Every token purchase splits fees:
- **30% → Treasury**: Platform development and maintenance
- **50% → Reward Pool**: Distributed when PRs resolve
- **20% → Buyback Fund**: Token burns to manage supply

### 4. **PR Resolution & Rewards**
```
PR Merges → Reward Pool → Token Holders
PR Rejects → Buyback & Burn → Deflationary pressure
```
- **Merge rewards**: Successful predictions earn from the reward pool
- **Burn mechanism**: Failed predictions result in token burns
- **Market resolution**: Automated via GitHub API integration

## 🏗️ Architecture

### Smart Contracts (Blockchain Layer)
- **`ProjectCoinFactory.sol`**: Creates and manages project tokens
- **`ProjectCoin.sol`**: ERC20 tokens with bonding curve mechanics
- **Hardhat setup**: Testing, deployment, and verification tools

### Frontend (User Interface)
- **Next.js application**: Modern React-based interface
- **Web3 integration**: Wagmi + MetaMask for blockchain interactions
- **GitHub API**: Real-time PR data and metadata
- **Responsive design**: Mobile-first, accessible UI

### Key Features
- **Real-time market discovery**: Search and explore active prediction markets
- **Integrated trading interface**: Buy/sell tokens directly from PR pages
- **Portfolio tracking**: Monitor your positions and performance
- **Live GitHub data**: Authentic PR information and status updates

## 📊 Market Mechanics

### Token Pricing Model
```typescript
// Bonding curve formula
nextPrice = currentPrice + priceIncrement
// Where priceIncrement = 0.0001 ETH per batch
```

### Market Resolution
```typescript
if (PR.status === 'merged') {
  distributeRewards(rewardPool, tokenHolders);
} else {
  burnTokens(buybackPool);
}
```

### Probability Calculation
```typescript
probability = calculateFromMetrics({
  comments: PR.comments,
  reviews: PR.reviews,
  labels: PR.labels,
  age: PR.createdAt,
  authorReputation: contributor.reputation
});
```

## 🎮 User Experience

### For Developers
1. **Create markets** for your repositories to gauge community sentiment
2. **Trade on PRs** you believe will merge based on code quality
3. **Earn rewards** for accurate predictions and quality contributions

### For Maintainers
1. **Discover high-quality PRs** through market signals
2. **Prioritize reviews** based on community confidence
3. **Incentivize contributors** through prediction market participation

### For Investors
1. **Speculate on development outcomes** using domain expertise
2. **Support promising projects** through token purchases
3. **Earn returns** from successful prediction strategies

## 🛡️ Risk Management

### Smart Contract Security
- **Reentrancy protection**: ReentrancyGuard on critical functions
- **Access controls**: Ownable patterns for admin functions
- **Overflow protection**: SafeMath and Solidity 0.8+ built-ins

### Economic Safeguards
- **Supply caps**: Maximum token supply prevents infinite inflation
- **Fee mechanisms**: Multiple revenue streams ensure sustainability
- **Burn mechanics**: Deflationary pressure maintains token value

## 🚀 Getting Started

### Quick Start
```bash
# Clone the repository
git clone https://github.com/WhyAsh5114/blocksmiths
cd blocksmiths

# Install dependencies
npm install
cd blockchain && npm install
cd ../frontend && npm install

# Set up environment
cp frontend/.env.example frontend/.env.local
# Add your GitHub token and contract addresses

# Start development
npm run dev
```

### Prerequisites
- **Node.js** 18+ and npm
- **MetaMask** wallet with Sepolia ETH
- **GitHub** personal access token
- **Hardhat** for contract development (optional)

## 🗂️ Project Structure

```
blocksmiths/
├── blockchain/          # Smart contracts and deployment
│   ├── contracts/       # Solidity contracts
│   ├── test/           # Contract tests
│   ├── scripts/        # Deployment scripts
│   └── hardhat.config.ts
├── frontend/           # Next.js application
│   ├── src/
│   │   ├── app/        # App router pages
│   │   ├── components/ # Reusable UI components
│   │   ├── hooks/      # Custom React hooks
│   │   └── lib/        # Utilities and configurations
│   └── package.json
├── README.md           # This file
└── package.json        # Root dependencies
```

## 🎯 Roadmap

### Phase 1: MVP (Current)
- ✅ Core smart contracts (ProjectCoin + Factory)
- ✅ Basic frontend with wallet integration
- ✅ GitHub API integration for PR data
- 🔄 Sepolia testnet deployment

### Phase 2: Enhanced Markets
- 🔮 Advanced probability algorithms
- 🔮 Multi-outcome predictions (merge time, review count)
- 🔮 Automated market makers (AMM) integration
- 🔮 Cross-repository prediction baskets

### Phase 3: Community Features
- 🔮 Reputation systems for predictors
- 🔮 Social features (following, leaderboards)
- 🔮 DAO governance for platform decisions
- 🔮 Integration with development tools

### Phase 4: Enterprise
- 🔮 Private repository support
- 🔮 Enterprise dashboard and analytics
- 🔮 API for third-party integrations
- 🔮 Mainnet deployment and scaling

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. **Fork the repository** and create a feature branch
2. **Write tests** for new functionality
3. **Follow code style** guidelines (Prettier + ESLint)
4. **Submit a pull request** with clear description

### Development Setup
```bash
# Run tests
cd blockchain && npm test
cd frontend && npm test

# Lint and format
npm run lint
npm run format

# Local blockchain
cd blockchain && npx hardhat node
```

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🔗 Links

- **Live Demo**: [Coming Soon]
- **Documentation**: [Wiki](https://github.com/WhyAsh5114/blocksmiths/wiki)
- **Discord**: [Community](https://discord.gg/blocksmiths)
- **Twitter**: [@BlockSmiths](https://twitter.com/blocksmiths)

## 🎯 The Problem It Solves

**Open source development lacks market signals for PR quality and merge probability.**

### Current Pain Points
- **Contributors**: Waste time on PRs unlikely to merge, no feedback on quality
- **Maintainers**: Can't prioritize valuable PRs, overwhelmed by review queue  
- **Ecosystem**: No economic incentives, uneven code quality

### BlockSmiths Solution
- **📊 Market Predictions**: Real-time probability scores for PR outcomes
- **💰 Economic Incentives**: Reward accurate predictions and quality contributions
- **⚡ Priority Signals**: Help maintainers focus on high-value PRs first

---

## 🚧 Challenges I Ran Into

### 1. **Smart Contract Economics**
- **Challenge**: Designing sustainable bonding curve tokenomics
- **Solution**: Linear price increases with multi-tiered fee distribution
- **Learning**: Batch operations significantly reduce gas costs

### 2. **GitHub API Rate Limits**  
- **Challenge**: 5,000 requests/hour limit for real-time PR data
- **Solution**: Intelligent caching with exponential backoff
- **Learning**: Aggressive caching essential for production

### 3. **Web3 UX Complexity**
- **Challenge**: Making blockchain accessible to traditional developers
- **Solution**: Progressive disclosure of Web3 complexity with clear error messages
- **Learning**: Fallback mechanisms crucial for adoption

---

## 🛠️ Technologies Used

### **Blockchain**
- **Solidity 0.8.28** - Smart contracts with OpenZeppelin libraries
- **Hardhat** - Development environment and testing
- **Sepolia** - Ethereum testnet deployment

### **Frontend**  
- **Next.js 14** - React framework with TypeScript
- **Wagmi + Viem** - Web3 React hooks and Ethereum library
- **Tailwind CSS** - Utility-first styling

### **Integration**
- **GitHub REST API** - Real-time PR and repository data
- **React Query** - Data fetching and caching
- **MetaMask** - Primary wallet connection

---

**Built with ❤️ by the BlockSmiths team**

*Empowering developers through prediction markets and decentralized collaboration.*