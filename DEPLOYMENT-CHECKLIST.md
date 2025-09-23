# Quick Sepolia Deployment Checklist

## ✅ Prerequisites
- [ ] MetaMask installed with account
- [ ] Alchemy account created
- [ ] Etherscan account created
- [ ] At least 0.1 Sepolia ETH in wallet

## 🔧 Environment Setup

### 1. API Keys Needed
- [ ] **Alchemy RPC URL**: Get from [alchemy.com](https://alchemy.com) → Create App → Sepolia
- [ ] **Private Key**: MetaMask → Account Details → Export Private Key
- [ ] **Etherscan API**: [etherscan.io](https://etherscan.io) → API Keys → Create

### 2. Create `.env` file in `/blockchain` directory:
```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=your_private_key_without_0x
ETHERSCAN_API_KEY=your_etherscan_key
```

## 🚀 Deployment Commands

```bash
# 1. Go to blockchain directory
cd blockchain

# 2. Install dependencies
npm install

# 3. Compile contracts
npx hardhat compile

# 4. Deploy to Sepolia
npx hardhat run scripts/deploy-sepolia.ts --network sepolia
```

## 📝 Copy Contract Addresses

After deployment, copy the addresses and create `frontend/.env.local`:

```env
NEXT_PUBLIC_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=11155111
```

## 🎯 Test Deployment

```bash
# Start frontend
cd frontend
npm run dev

# Open browser
open http://localhost:3001

# Connect MetaMask (switch to Sepolia)
# Try creating a token or market
```

## 🔍 Verify Success

- [ ] Contracts deployed successfully
- [ ] Contracts verified on Sepolia Etherscan
- [ ] Frontend connects to Sepolia network
- [ ] Can create tokens and markets
- [ ] Transactions work in MetaMask

---

**Need Sepolia ETH?**
- [Alchemy Faucet](https://sepoliafaucet.com)
- [Chainlink Faucet](https://faucets.chain.link/sepolia)
- [QuickNode Faucet](https://faucet.quicknode.com/ethereum/sepolia)